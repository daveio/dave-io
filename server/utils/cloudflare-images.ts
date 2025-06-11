import { blake3 } from "@noble/hashes/blake3"
import { fileTypeFromBuffer } from "file-type"
import { createApiError } from "./response"

// Import the global Env type for TypeScript compatibility
declare global {
  interface Env extends Cloudflare.Env {}
}

/**
 * Valid image MIME types supported by Cloudflare Images
 */
export const CLOUDFLARE_IMAGES_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/svg+xml"
] as const

/**
 * Options for Cloudflare Images optimization
 */
export interface CloudflareImagesOptions {
  quality?: number
  width?: number
  height?: number
  format?: "webp" | "avif" | "jpeg" | "png"
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad"
}

/**
 * Result of Cloudflare Images processing
 */
export interface CloudflareImagesResult {
  id: string
  url: string
  variants: string[]
  originalSize: number
  optimizedSize: number
  hash: string
  format: string
  originalMimeType: string
  uploaded: string
}

/**
 * Validates image buffer and detects MIME type for Cloudflare Images
 * @param buffer - Image buffer to validate
 * @returns Promise<string> - Detected MIME type
 * @throws ApiError if invalid image format
 */
export async function validateImageForCloudflareImages(buffer: Buffer): Promise<string> {
  const fileType = await fileTypeFromBuffer(buffer)

  // biome-ignore lint/suspicious/noExplicitAny: fileType.mime comes from external library with loose typing
  if (!fileType || !CLOUDFLARE_IMAGES_FORMATS.includes(fileType.mime as any)) {
    throw createApiError(
      406,
      `Unsupported file type for Cloudflare Images. Expected image, got: ${fileType?.mime || "unknown"}`
    )
  }

  return fileType.mime
}

/**
 * Generates a unique ID for Cloudflare Images based on content hash
 * @param buffer - Image buffer
 * @param options - Processing options
 * @returns Unique image ID
 */
export function generateCloudflareImageId(buffer: Buffer, options: CloudflareImagesOptions = {}): string {
  const hash = blake3(buffer, { dkLen: 16 }) // 128 bits = 16 bytes
  const hexHash = Buffer.from(hash).toString("hex")

  // Include quality in ID for cache differentiation
  const qualitySuffix = options.quality ? `-q${options.quality}` : ""
  return `${hexHash}${qualitySuffix}`
}

/**
 * Uploads image to Cloudflare Images service
 * @param env - Cloudflare environment with Images binding
 * @param buffer - Image buffer to upload
 * @param id - Custom ID for the image
 * @param metadata - Additional metadata
 * @returns Promise<CloudflareImagesResult>
 */
export async function uploadToCloudflareImages(
  env: Env,
  buffer: Buffer,
  id: string,
  metadata: Record<string, string> = {}
): Promise<CloudflareImagesResult> {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw createApiError(503, "Cloudflare API token not configured")
  }

  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    throw createApiError(503, "Cloudflare account ID not configured")
  }

  const originalMimeType = await validateImageForCloudflareImages(buffer)
  const originalSize = buffer.length

  // Upload via Cloudflare Images API
  const formData = new FormData()
  // Convert Buffer to Uint8Array for File constructor compatibility
  formData.append("file", new File([new Uint8Array(buffer)], "image", { type: originalMimeType }))
  formData.append("id", id)
  formData.append("metadata", JSON.stringify(metadata))
  formData.append("requireSignedURLs", "false")

  const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Cloudflare Images upload failed:", errorText)
    throw createApiError(response.status, `Failed to upload to Cloudflare Images: ${errorText}`)
  }

  const result = (await response.json()) as {
    success: boolean
    result?: {
      id: string
      variants: string[]
      uploaded?: string
    }
    errors?: Array<{ message: string }>
  }

  if (!result.success || !result.result) {
    throw createApiError(500, `Cloudflare Images upload failed: ${result.errors?.[0]?.message || "Unknown error"}`)
  }

  const imageData = result.result

  // Since we can't get the exact optimized size from Cloudflare Images API,
  // we'll estimate based on format conversion to WebP
  const estimatedOptimizedSize = Math.floor(originalSize * 0.7) // Rough WebP compression estimate

  return {
    id: imageData.id,
    url: imageData.variants[0] ?? "", // Use first variant as primary URL
    variants: imageData.variants,
    originalSize,
    optimizedSize: estimatedOptimizedSize,
    hash: id.split("-")[0] ?? "", // Extract hash from ID
    format: "webp", // Cloudflare Images serves WebP by default
    originalMimeType,
    uploaded: imageData.uploaded ?? new Date().toISOString()
  }
}

/**
 * Optimizes image using Cloudflare Images with quality transformations
 * @param env - Cloudflare environment with Images binding
 * @param buffer - Image buffer to process
 * @param options - Optimization options
 * @returns Promise<CloudflareImagesResult>
 */
export async function optimizeWithCloudflareImages(
  env: Env,
  buffer: Buffer,
  options: CloudflareImagesOptions = {}
): Promise<CloudflareImagesResult> {
  const id = generateCloudflareImageId(buffer, options)

  // Check if image already exists
  const existingImage = await getCloudflareImage(env, id)
  if (existingImage) {
    console.log(`Using existing Cloudflare Images: ${id}`)
    return existingImage
  }

  // Upload new image
  const metadata = {
    originalSize: buffer.length.toString(),
    quality: options.quality?.toString() || "auto",
    uploadedAt: new Date().toISOString()
  }

  return await uploadToCloudflareImages(env, buffer, id, metadata)
}

/**
 * Retrieves existing image from Cloudflare Images
 * @param env - Cloudflare environment
 * @param id - Image ID
 * @returns Promise<CloudflareImagesResult | null>
 */
export async function getCloudflareImage(env: Env, id: string): Promise<CloudflareImagesResult | null> {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    return null
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${id}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      }
    })

    if (!response.ok) {
      return null
    }

    const result = (await response.json()) as {
      success: boolean
      result?: {
        id: string
        variants: string[]
        uploaded: string
        metadata?: Record<string, string>
      }
    }

    if (!result.success || !result.result) {
      return null
    }

    const imageData = result.result
    const originalSize = Number.parseInt(imageData.metadata?.originalSize || "0")
    const estimatedOptimizedSize = Math.floor(originalSize * 0.7)

    return {
      id: imageData.id,
      url: imageData.variants[0] ?? "",
      variants: imageData.variants,
      originalSize,
      optimizedSize: estimatedOptimizedSize,
      hash: id.split("-")[0] ?? "",
      format: "webp",
      originalMimeType: imageData.metadata?.originalMimeType || "unknown",
      uploaded: imageData.uploaded
    }
  } catch (error) {
    console.error("Error checking existing Cloudflare Images:", error)
    return null
  }
}

/**
 * Processes image using Cloudflare Images with optional transformations via binding
 * @param env - Cloudflare environment with Images binding
 * @param buffer - Image buffer
 * @param options - Processing options
 * @returns Promise<CloudflareImagesResult>
 */
export async function processWithCloudflareImagesBinding(
  env: Env,
  buffer: Buffer,
  options: CloudflareImagesOptions = {}
): Promise<{ buffer: Buffer; result: CloudflareImagesResult }> {
  if (!env.IMAGES) {
    throw createApiError(503, "Cloudflare Images binding not available")
  }

  // First upload to Cloudflare Images service for storage
  const result = await optimizeWithCloudflareImages(env, buffer, options)

  try {
    // Use the Images binding for additional transformations if needed
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer)
        controller.close()
      }
    })

    // Apply transformations using the binding
    // biome-ignore lint/suspicious/noExplicitAny: Images binding API not fully typed
    let imagesChain = (env.IMAGES as any).input(stream)

    if (options.width || options.height) {
      imagesChain = imagesChain.transform({
        width: options.width,
        height: options.height,
        fit: options.fit || "scale-down"
      })
    }

    if (options.quality) {
      // Note: quality transformations are handled via the API upload, not the binding
    }

    const processedResponse = await imagesChain
      .output({
        format: options.format || "image/webp"
      })
      .response()

    const processedBuffer = Buffer.from(await processedResponse.arrayBuffer())

    return {
      buffer: processedBuffer,
      result: {
        ...result,
        optimizedSize: processedBuffer.length
      }
    }
  } catch (bindingError) {
    console.warn("Images binding processing failed, using API result:", bindingError)
    // Fallback to original buffer if binding fails
    return {
      buffer: buffer,
      result
    }
  }
}

/**
 * Complete image processing workflow using Cloudflare Images
 * Replaces the Sharp-based processImageOptimisation function
 * @param imageBuffer - Original image buffer
 * @param options - Processing options
 * @param env - Cloudflare environment
 * @param metadata - Additional metadata
 * @returns Promise<OptimisedImageResult> - Compatible result format
 */
export async function processImageWithCloudflareImages(
  imageBuffer: Buffer,
  options: { quality?: number },
  env: Env,
  _metadata: Record<string, string> = {}
): Promise<{
  buffer: Buffer
  originalSize: number
  optimisedSize: number
  format: string
  hash: string
  url: string
  quality?: number
  originalMimeType: string
}> {
  const startTime = Date.now()

  const cloudflareOptions: CloudflareImagesOptions = {
    quality: options.quality,
    format: "webp"
  }

  // Process with Cloudflare Images
  const { buffer: processedBuffer, result } = await processWithCloudflareImagesBinding(
    env,
    imageBuffer,
    cloudflareOptions
  )

  const processingTime = Date.now() - startTime
  console.log(
    `Cloudflare Images processing completed in ${processingTime}ms: ${result.originalSize} → ${result.optimizedSize} bytes`
  )

  return {
    buffer: processedBuffer,
    originalSize: result.originalSize,
    optimisedSize: result.optimizedSize,
    format: result.format,
    hash: result.hash,
    url: result.url,
    quality: options.quality,
    originalMimeType: result.originalMimeType
  }
}
