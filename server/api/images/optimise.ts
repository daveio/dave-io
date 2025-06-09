import { blake3 } from "@noble/hashes/blake3"
import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"
import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAPIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { validateBase64Image, validateImageURL, validateNumericParam } from "~/server/utils/validation"

interface OptimisationOptions {
  quality?: number
}

interface OptimisedImage {
  buffer: Buffer
  originalSize: number
  optimisedSize: number
  format: string
  hash: string
  url: string
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

async function optimiseImage(
  inputBuffer: Buffer,
  options: OptimisationOptions = {}
): Promise<{ buffer: Buffer; originalMimeType: string }> {
  const originalMimeType = await validateAndDetectMimeType(inputBuffer)

  let sharpImage = sharp(inputBuffer)

  // Preserve transparency and original image orientation
  const _metadata = await sharpImage.metadata()

  // Determine compression strategy based on input format and options
  if (options.quality !== undefined) {
    // Explicit quality specified - use lossy WebP
    sharpImage = sharpImage.webp({
      quality: options.quality,
      lossless: false,
      effort: 6 // Maximum compression effort
    })
  } else if (LOSSY_FORMATS.includes(originalMimeType)) {
    // Input is lossy format (JPEG) - use lossy WebP
    sharpImage = sharpImage.webp({
      quality: 60,
      lossless: false,
      effort: 6
    })
  } else {
    // Input is lossless format (PNG, etc.) - use lossless WebP
    sharpImage = sharpImage.webp({
      lossless: true,
      effort: 6
    })
  }

  const optimisedBuffer = await sharpImage.toBuffer()

  return {
    buffer: optimisedBuffer,
    originalMimeType
  }
}

function generateFilename(originalBuffer: Buffer): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const hash = blake3(originalBuffer, { dkLen: 16 }) // 128 bits = 16 bytes
  const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  return `${timestamp}-${base64Hash}.webp`
}

async function uploadToR2(env: Env, buffer: Buffer, filename: string, originalMimeType: string): Promise<string> {
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
      uploadedAt: new Date().toISOString()
    }
  })

  // Return the public URL
  return `https://images.dave.io/${key}`
}

async function processImageOptimisation(
  imageBuffer: Buffer,
  options: OptimisationOptions,
  env: Env
): Promise<OptimisedImage> {
  const startTime = Date.now()

  // Generate filename based on original image hash
  const filename = generateFilename(imageBuffer)

  // Optimise the image
  const { buffer: optimisedBuffer, originalMimeType } = await optimiseImage(imageBuffer, options)

  // Upload to R2 bucket
  const url = await uploadToR2(env, optimisedBuffer, filename, originalMimeType)

  const processingTime = Date.now() - startTime
  console.log(
    `Image optimisation completed in ${processingTime}ms: ${imageBuffer.length} → ${optimisedBuffer.length} bytes`
  )

  return {
    buffer: optimisedBuffer,
    originalSize: imageBuffer.length,
    optimisedSize: optimisedBuffer.length,
    format: "webp",
    hash: filename.split("-")[1]?.split(".")[0] || "",
    url
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    // Require API authentication for image optimisation
    const auth = await requireAPIAuth(event, "images")

    const env = getCloudflareEnv(event)

    let imageBuffer: Buffer
    let imageSource: string
    const options: OptimisationOptions = {}

    if (method === "GET") {
      // Handle URL-based image processing
      const query = getQuery(event)
      const imageUrl = query.url as string

      if (!imageUrl) {
        throw createApiError(400, "Image URL is required (url parameter)")
      }

      // Parse optimisation options from query parameters
      options.quality = validateNumericParam(query.quality, "quality", { min: 0, max: 100, integer: true })

      const arrayBuffer = await validateImageURL(imageUrl)
      imageBuffer = Buffer.from(arrayBuffer)
      imageSource = imageUrl
    } else if (method === "POST") {
      // Handle base64 image processing
      const body = await readBody(event)

      if (typeof body === "string") {
        // Raw base64 string
        imageBuffer = await validateBase64Image(body)
      } else if (body && typeof body === "object") {
        // JSON object with options
        if (!body.image) {
          throw createApiError(400, "Base64 image data is required (image field)")
        }

        imageBuffer = await validateBase64Image(body.image)
        options.quality = validateNumericParam(body.quality, "quality", { min: 0, max: 100, integer: true })
      } else {
        throw createApiError(400, "Invalid request body format")
      }

      imageSource = "uploaded-file"
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image
    const result = await processImageOptimisation(imageBuffer, options, env as Env)

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "images/optimise", method, 200, {
      user: auth.payload?.sub || "anonymous",
      originalSize: result.originalSize,
      optimisedSize: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
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
        imageSource,
        timestamp: new Date().toISOString()
      },
      "Image optimised successfully"
    )
  } catch (error: unknown) {
    console.error("Image optimisation error:", error)

    // Record failed request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "images/optimise", method, statusCode, {
      user: "unknown",
      originalSize: 0,
      optimisedSize: 0,
      compressionRatio: 0,
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Image optimisation failed")
  }
})
