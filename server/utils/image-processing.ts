import { blake3 } from "@noble/hashes/blake3"
import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"
import { createApiError } from "./response"

/**
 * Valid image MIME types supported by the image processing system
 */
export const VALID_IMAGE_FORMATS = [
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
 * Image formats that use lossy compression by default
 * Note: webp removed from here as it can be either lossy or lossless
 */
export const LOSSY_FORMATS = ["image/jpeg", "image/jpg", "image/heic", "image/heif"] as const

/**
 * Options for image optimisation
 */
export interface OptimisationOptions {
  quality?: number
  lossless?: boolean
}

/**
 * Result of image optimisation processing
 */
export interface OptimisedImageResult {
  buffer: Buffer
  originalSize: number
  optimisedSize: number
  format: string
  hash: string
  url: string
  quality?: number
  originalMimeType: string
}

/**
 * Validates image buffer and detects MIME type
 * @param buffer - Image buffer to validate
 * @returns Promise<string> - Detected MIME type
 * @throws ApiError if invalid image format
 */
export async function validateAndDetectMimeType(buffer: Buffer): Promise<string> {
  const fileType = await fileTypeFromBuffer(buffer)

  // biome-ignore lint/suspicious/noExplicitAny: fileType.mime comes from external library with loose typing
  if (!fileType || !VALID_IMAGE_FORMATS.includes(fileType.mime as any)) {
    throw createApiError(406, `Unsupported file type. Expected image, got: ${fileType?.mime || "unknown"}`)
  }

  return fileType.mime
}

/**
 * Generates filename based on image content hash and optimisation parameters
 * Format: {BLAKE3_HEX}-q{QUALITY}.webp or {BLAKE3_HEX}-ll.webp for lossless
 * @param originalBuffer - Original image buffer for hash generation
 * @param quality - Quality setting (undefined for lossless)
 * @returns Generated filename
 */
export function generateOptimisedFilename(originalBuffer: Buffer, quality?: number): string {
  const hash = blake3(originalBuffer, { dkLen: 16 }) // 128 bits = 16 bytes
  const hexHash = Buffer.from(hash).toString("hex")

  const qualitySuffix = quality !== undefined ? `q${quality}` : "ll"
  return `${hexHash}-${qualitySuffix}.webp`
}

/**
 * Extracts hash from optimised filename
 * Handles new format ({HASH}-q{QUALITY}.webp), old format (q{QUALITY}-{HASH}.webp), and legacy format ({TIMESTAMP}-{HASH}.webp)
 * @param filename - Filename to extract hash from
 * @returns Extracted hash or empty string if extraction fails
 */
export function extractHashFromFilename(filename: string): string {
  // Remove .webp extension
  const nameWithoutExt = filename.replace(/\.webp$/, "")

  // Handle new format: {HASH}-q{QUALITY} or {HASH}-ll
  if (nameWithoutExt.match(/-(q\d+|ll)$/)) {
    return nameWithoutExt.split("-").slice(0, -1).join("-")
  }

  // Handle old format: q{QUALITY}-{HASH} or ll-{HASH}
  if (nameWithoutExt.match(/^(q\d+|ll)-/)) {
    return nameWithoutExt.split("-").slice(1).join("-")
  }

  // Handle legacy format: {TIMESTAMP}-{HASH}
  const parts = nameWithoutExt.split("-")
  if (parts.length >= 2) {
    return parts.slice(1).join("-")
  }

  return ""
}

/**
 * Optimises image using Sharp with WebP conversion
 * @param inputBuffer - Input image buffer
 * @param options - Optimisation options
 * @returns Promise<{buffer: Buffer, originalMimeType: string, quality?: number}>
 */
export async function optimiseImageBuffer(
  inputBuffer: Buffer,
  options: OptimisationOptions = {}
): Promise<{ buffer: Buffer; originalMimeType: string; quality?: number }> {
  const originalMimeType = await validateAndDetectMimeType(inputBuffer)

  let sharpImage = sharp(inputBuffer)

  // Preserve transparency and original image orientation
  const _metadata = await sharpImage.metadata()

  let actualQuality: number | undefined

  // Determine compression strategy based on input format and options
  if (options.quality !== undefined) {
    // Explicit quality specified - use lossy WebP
    actualQuality = options.quality
    sharpImage = sharpImage.webp({
      quality: options.quality,
      lossless: false,
      effort: 6 // Maximum compression effort
    })
  } else if (options.lossless === true) {
    // Force lossless compression
    sharpImage = sharpImage.webp({
      lossless: true,
      effort: 6
    })
    // biome-ignore lint/suspicious/noExplicitAny: LOSSY_FORMATS requires flexible string comparison
  } else if (LOSSY_FORMATS.includes(originalMimeType as any)) {
    // Input is lossy format (JPEG, HEIC) - use lossy WebP
    actualQuality = 80
    sharpImage = sharpImage.webp({
      quality: 80,
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
    originalMimeType,
    quality: actualQuality
  }
}

/**
 * Uploads optimised image to R2 storage
 * @param env - Cloudflare environment with R2 binding
 * @param buffer - Optimised image buffer
 * @param filename - Generated filename
 * @param originalMimeType - Original MIME type of source image
 * @param metadata - Additional metadata to store
 * @returns Promise<string> - Public URL of uploaded image
 */
export async function uploadOptimisedImageToR2(
  env: Env,
  buffer: Buffer,
  filename: string,
  originalMimeType: string,
  metadata: Record<string, string> = {}
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
      uploadedAt: new Date().toISOString(),
      ...metadata
    }
  })

  // Return the public URL
  return `https://images.dave.io/${key}`
}

/**
 * Checks if optimised image already exists in R2 storage
 * @param env - Cloudflare environment with R2 binding
 * @param filename - Filename to check
 * @returns Promise<boolean> - True if file exists
 */
export async function checkOptimisedImageExists(env: Env, filename: string): Promise<boolean> {
  if (!env.IMAGES) {
    return false
  }

  try {
    const key = `opt/${filename}`
    const object = await env.IMAGES.head(key)
    return object !== null
  } catch {
    return false
  }
}

/**
 * Complete image processing workflow with caching
 * @param imageBuffer - Original image buffer
 * @param options - Optimisation options
 * @param env - Cloudflare environment
 * @param metadata - Additional metadata for storage
 * @returns Promise<OptimisedImageResult> - Complete processing result
 */
export async function processImageOptimisation(
  imageBuffer: Buffer,
  options: OptimisationOptions,
  env: Env,
  metadata: Record<string, string> = {}
): Promise<OptimisedImageResult> {
  const startTime = Date.now()

  // Generate filename based on original image hash and quality
  const filename = generateOptimisedFilename(imageBuffer, options.quality)

  // Check if already optimised and cached
  const exists = await checkOptimisedImageExists(env, filename)
  if (exists) {
    const url = `https://images.dave.io/opt/${filename}`
    console.log(`Using cached optimised image: ${filename}`)

    // For cached images, we need to optimise locally to get the buffer and sizes
    const { buffer: optimisedBuffer, originalMimeType, quality } = await optimiseImageBuffer(imageBuffer, options)

    return {
      buffer: optimisedBuffer,
      originalSize: imageBuffer.length,
      optimisedSize: optimisedBuffer.length,
      format: "webp",
      hash: extractHashFromFilename(filename),
      url,
      quality,
      originalMimeType
    }
  }

  // Optimise the image
  const { buffer: optimisedBuffer, originalMimeType, quality } = await optimiseImageBuffer(imageBuffer, options)

  // Upload to R2 bucket
  const url = await uploadOptimisedImageToR2(env, optimisedBuffer, filename, originalMimeType, metadata)

  const processingTime = Date.now() - startTime
  console.log(
    `Image optimisation completed in ${processingTime}ms: ${imageBuffer.length} → ${optimisedBuffer.length} bytes`
  )

  return {
    buffer: optimisedBuffer,
    originalSize: imageBuffer.length,
    optimisedSize: optimisedBuffer.length,
    format: "webp",
    hash: extractHashFromFilename(filename),
    url,
    quality,
    originalMimeType
  }
}
