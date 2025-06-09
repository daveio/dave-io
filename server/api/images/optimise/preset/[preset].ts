import { blake3 } from "@noble/hashes/blake3"
import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"
import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAPIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { validateBase64Image, validateImageURL } from "~/server/utils/validation"

interface PresetConfig {
  maxSizeBytes: number
  description: string
}

interface OptimisedImage {
  buffer: Buffer
  originalSize: number
  optimisedSize: number
  format: string
  hash: string
  url: string
  quality: number
}

const PRESETS: Record<string, PresetConfig> = {
  alt: {
    maxSizeBytes: 4 * 1024 * 1024, // 4MB
    description: "Optimise image for AI alt text processing (≤ 4MB)"
  }
}

const LOSSY_FORMATS = ["image/jpeg", "image/jpg"]
const VALID_IMAGE_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif"
]

async function validateAndDetectMimeType(buffer: Buffer): Promise<string> {
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType || !VALID_IMAGE_FORMATS.includes(fileType.mime)) {
    throw createApiError(406, `Unsupported file type. Expected image, got: ${fileType?.mime || "unknown"}`)
  }

  return fileType.mime
}

async function optimiseForPreset(
  inputBuffer: Buffer,
  preset: PresetConfig
): Promise<{ buffer: Buffer; originalMimeType: string; quality: number }> {
  const originalMimeType = await validateAndDetectMimeType(inputBuffer)

  let sharpImage = sharp(inputBuffer)

  // For the 'alt' preset, we need to get as close to 4MB as possible
  // Start with a reasonable quality and adjust based on output size
  let quality = LOSSY_FORMATS.includes(originalMimeType) ? 60 : 80
  let optimisedBuffer: Buffer
  let attempts = 0
  const maxAttempts = 10

  // Binary search approach to find optimal quality
  let minQuality = 10
  let maxQuality = 95

  do {
    attempts++

    sharpImage = sharp(inputBuffer)

    if (LOSSY_FORMATS.includes(originalMimeType) || quality < 95) {
      // Use lossy compression
      sharpImage = sharpImage.webp({
        quality,
        lossless: false,
        effort: 6
      })
    } else {
      // Use lossless compression (only if quality is at maximum)
      sharpImage = sharpImage.webp({
        lossless: true,
        effort: 6
      })
    }

    optimisedBuffer = await sharpImage.toBuffer()

    // If we're within 10% of target size or under target, we're done
    const targetSize = preset.maxSizeBytes
    const tolerance = targetSize * 0.1

    if (optimisedBuffer.length <= targetSize) {
      // Under target - try to increase quality if possible
      if (optimisedBuffer.length <= targetSize - tolerance && quality < maxQuality && attempts < maxAttempts) {
        minQuality = quality
        quality = Math.ceil((quality + maxQuality) / 2)
      } else {
        break // Close enough or at max quality
      }
    } else {
      // Over target - reduce quality
      maxQuality = quality
      quality = Math.floor((minQuality + quality) / 2)

      if (quality <= minQuality) {
        break // Can't reduce further
      }
    }
  } while (attempts < maxAttempts && Math.abs(maxQuality - minQuality) > 1)

  // Final check - if still over target, use minimum quality
  if (optimisedBuffer.length > preset.maxSizeBytes && quality > 10) {
    sharpImage = sharp(inputBuffer).webp({
      quality: 10,
      lossless: false,
      effort: 6
    })
    optimisedBuffer = await sharpImage.toBuffer()
    quality = 10
  }

  console.log(
    `Preset optimisation completed after ${attempts} attempts: ${inputBuffer.length} → ${optimisedBuffer.length} bytes at quality ${quality}`
  )

  return {
    buffer: optimisedBuffer,
    originalMimeType,
    quality
  }
}

function generateFilename(originalBuffer: Buffer): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const hash = blake3(originalBuffer, { dkLen: 16 }) // 128 bits = 16 bytes
  const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  return `${timestamp}-${base64Hash}.webp`
}

async function uploadToR2(
  env: Env,
  buffer: Buffer,
  filename: string,
  originalMimeType: string,
  preset: string
): Promise<string> {
  if (!env.IMAGES) {
    throw createApiError(503, "Image storage service not available")
  }

  const key = `opt/${filename}`

  await env.IMAGES.put(key, buffer, {
    httpMetadata: {
      contentType: "image/webp"
    },
    customMetadata: {
      originalMimeType,
      preset,
      uploadedAt: new Date().toISOString()
    }
  })

  // Return the public URL
  return `https://images.dave.io/${key}`
}

async function processPresetOptimisation(
  imageBuffer: Buffer,
  presetName: string,
  preset: PresetConfig,
  env: Env
): Promise<OptimisedImage> {
  const startTime = Date.now()

  // Generate filename based on original image hash
  const filename = generateFilename(imageBuffer)

  // Optimise the image for the preset
  const { buffer: optimisedBuffer, originalMimeType, quality } = await optimiseForPreset(imageBuffer, preset)

  // Upload to R2 bucket
  const url = await uploadToR2(env, optimisedBuffer, filename, originalMimeType, presetName)

  const processingTime = Date.now() - startTime
  console.log(`Preset '${presetName}' optimisation completed in ${processingTime}ms`)

  return {
    buffer: optimisedBuffer,
    originalSize: imageBuffer.length,
    optimisedSize: optimisedBuffer.length,
    format: "webp",
    hash: filename.split("-")[1]?.split(".")[0] || "",
    url,
    quality
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    // Require API authentication for image optimisation
    const auth = await requireAPIAuth(event, "images")

    const env = getCloudflareEnv(event)

    // Get preset from route parameter
    const presetName = getRouterParam(event, "preset")

    if (!presetName) {
      throw createApiError(400, "Preset parameter is required")
    }

    const preset = PRESETS[presetName]
    if (!preset) {
      const availablePresets = Object.keys(PRESETS).join(", ")
      throw createApiError(400, `Unknown preset '${presetName}'. Available presets: ${availablePresets}`)
    }

    let imageBuffer: Buffer
    let imageSource: string

    if (method === "GET") {
      // Handle URL-based image processing
      const query = getQuery(event)
      const imageUrl = query.url as string

      if (!imageUrl) {
        throw createApiError(400, "Image URL is required (url parameter)")
      }

      const arrayBuffer = await validateImageURL(imageUrl)
      imageBuffer = Buffer.from(arrayBuffer)
      imageSource = imageUrl
    } else if (method === "POST") {
      // Handle base64 image processing
      const body = await readBody(event)

      if (typeof body === "string") {
        // Raw base64 string
        imageBuffer = await validateBase64Image(body)
      } else if (body && typeof body === "object" && body.image) {
        // JSON object with image field
        imageBuffer = await validateBase64Image(body.image)
      } else {
        throw createApiError(400, "Base64 image data is required")
      }

      imageSource = "uploaded-file"
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image with the preset
    const result = await processPresetOptimisation(imageBuffer, presetName, preset, env as Env)

    // Verify the result meets preset requirements
    if (result.optimisedSize > preset.maxSizeBytes) {
      console.warn(
        `Warning: Optimised image (${result.optimisedSize} bytes) exceeds preset limit (${preset.maxSizeBytes} bytes)`
      )
    }

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, `images/optimise/preset/${presetName}`, method, 200, {
      user: auth.payload?.sub || "anonymous",
      originalSize: result.originalSize,
      optimisedSize: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
      quality: result.quality,
      preset: presetName,
      success: true
    })

    return createApiResponse(
      {
        url: result.url,
        originalSizeBytes: result.originalSize,
        optimisedSizeBytes: result.optimisedSize,
        compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
        format: result.format,
        hash: result.hash,
        quality: result.quality,
        preset: {
          name: presetName,
          description: preset.description,
          maxSizeBytes: preset.maxSizeBytes
        },
        imageSource,
        timestamp: new Date().toISOString()
      },
      `Image optimised with '${presetName}' preset successfully`
    )
  } catch (error: unknown) {
    console.error(`Preset optimisation error (${getRouterParam(event, "preset")}):`, error)

    // Record failed request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, `images/optimise/preset/${getRouterParam(event, "preset")}`, method, statusCode, {
      user: "unknown",
      originalSize: 0,
      optimisedSize: 0,
      compressionRatio: 0,
      quality: 0,
      preset: getRouterParam(event, "preset") || "unknown",
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Preset image optimisation failed")
  }
})
