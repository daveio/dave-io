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
 * Advanced optimisation options with size targeting
 */
export interface AdvancedOptimisationOptions extends OptimisationOptions {
  targetSizeBytes?: number
  maxDimension?: number
  minQuality?: number
  maxQuality?: number
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
  // Return empty string for invalid/empty filenames
  if (!filename) {
    return ""
  }

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
  // Ensure the first part looks like a timestamp (all digits, 10 chars)
  const parts = nameWithoutExt.split("-")
  if (parts.length >= 2 && /^\d{10}$/.test(parts[0])) {
    return parts.slice(1).join("-")
  }

  // If none of the expected formats match, return empty string
  return ""
}

/**
 * Shared WebP compression logic for consistent quality handling across all image processing
 * Consolidates compression strategy that was duplicated in image-presets.ts
 * @param sharpImage - Sharp image instance
 * @param originalMimeType - Original MIME type
 * @param quality - Specific quality setting (overrides automatic detection)
 * @param lossless - Force lossless compression
 * @returns Promise<{buffer: Buffer, actualQuality?: number}>
 */
export async function applyWebPCompression(
  sharpImage: sharp.Sharp,
  originalMimeType: string,
  quality?: number,
  lossless?: boolean
): Promise<{ buffer: Buffer; actualQuality?: number }> {
  let actualQuality: number | undefined

  // Determine compression strategy based on input format and options
  if (quality !== undefined) {
    // Explicit quality specified - use lossy WebP
    actualQuality = quality
    sharpImage = sharpImage.webp({
      quality,
      lossless: false,
      effort: 6 // Maximum compression effort
    })
  } else if (lossless === true) {
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

  const buffer = await sharpImage.toBuffer()
  return { buffer, actualQuality }
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

  const { buffer: optimisedBuffer, actualQuality } = await applyWebPCompression(
    sharpImage,
    originalMimeType,
    options.quality,
    options.lossless
  )

  return {
    buffer: optimisedBuffer,
    originalMimeType,
    quality: actualQuality
  }
}

/**
 * Advanced image optimisation with quality targeting and dimension reduction
 * Consolidates the sophisticated optimisation logic from image-presets.ts
 * @param inputBuffer - Input image buffer
 * @param options - Advanced optimisation options including size targeting
 * @returns Promise<{buffer: Buffer, originalMimeType: string, quality: number}>
 */
export async function optimiseImageBufferAdvanced(
  inputBuffer: Buffer,
  options: AdvancedOptimisationOptions = {}
): Promise<{ buffer: Buffer; originalMimeType: string; quality: number }> {
  const originalMimeType = await validateAndDetectMimeType(inputBuffer)

  // If no size targeting, use standard optimisation
  if (!options.targetSizeBytes) {
    const result = await optimiseImageBuffer(inputBuffer, options)
    return {
      ...result,
      quality: result.quality || 80 // Provide default quality
    }
  }

  // Get original image metadata for resizing logic
  const originalMetadata = await sharp(inputBuffer).metadata()
  const originalWidth = originalMetadata.width || 0
  const originalHeight = originalMetadata.height || 0

  console.log(`Original image: ${originalWidth}x${originalHeight} (${inputBuffer.length} bytes)`)

  let currentBuffer = inputBuffer
  let currentWidth = originalWidth
  let currentHeight = originalHeight
  let resizeAttempts = 0
  const minLongEdge = options.maxDimension || 1024

  // Phase 1: Try quality optimisation first without resizing
  let result = await optimiseWithQualityTargeting(
    currentBuffer,
    originalMimeType,
    options.targetSizeBytes,
    options.minQuality,
    options.maxQuality
  )

  // Phase 2: If still too large, start reducing dimensions
  while (result.buffer.length > options.targetSizeBytes && Math.max(currentWidth, currentHeight) > minLongEdge) {
    resizeAttempts++
    console.log(`Attempt ${resizeAttempts}: Image still ${result.buffer.length} bytes, trying dimension reduction`)

    // Reduce dimensions by 15% each iteration (more aggressive than quality reduction)
    const scaleFactor = 0.85
    currentWidth = Math.floor(currentWidth * scaleFactor)
    currentHeight = Math.floor(currentHeight * scaleFactor)

    // Ensure we don't go below minimum dimensions, but don't enlarge
    const currentLongEdge = Math.max(currentWidth, currentHeight)
    if (currentLongEdge < minLongEdge) {
      // Clamp to minimum instead of enlarging
      const originalLongEdge = Math.max(originalWidth, originalHeight)
      if (originalLongEdge >= minLongEdge) {
        const scale = minLongEdge / currentLongEdge
        currentWidth = Math.min(Math.floor(currentWidth * scale), originalWidth)
        currentHeight = Math.min(Math.floor(currentHeight * scale), originalHeight)
      }
      // If original was smaller than minLongEdge, exit the loop
      if (originalLongEdge < minLongEdge) {
        break
      }
    }

    console.log(`Resizing to ${currentWidth}x${currentHeight}`)

    // Resize the image
    currentBuffer = await sharp(inputBuffer)
      .resize(currentWidth, currentHeight, {
        fit: "inside",
        withoutEnlargement: true
      })
      .toBuffer()

    // Try quality optimisation again with the smaller image
    result = await optimiseWithQualityTargeting(
      currentBuffer,
      originalMimeType,
      options.targetSizeBytes,
      options.minQuality,
      options.maxQuality
    )

    // Safety check to prevent infinite loops
    if (resizeAttempts >= 10) {
      console.warn(`Reached maximum resize attempts (${resizeAttempts})`)
      break
    }
  }

  // Final check - if we're at minimum dimensions and still over target, throw error
  if (result.buffer.length > options.targetSizeBytes) {
    const currentLongEdge = Math.max(currentWidth, currentHeight)
    if (currentLongEdge <= minLongEdge) {
      throw createApiError(
        422,
        `Unable to compress image below ${options.targetSizeBytes} bytes even at minimum dimensions (${currentWidth}x${currentHeight}). Current size: ${result.buffer.length} bytes`
      )
    }
  }

  console.log(
    `Advanced optimisation completed: ${inputBuffer.length} → ${result.buffer.length} bytes ` +
      `(${originalWidth}x${originalHeight} → ${currentWidth}x${currentHeight}) ` +
      `at quality ${result.quality}${resizeAttempts > 0 ? ` after ${resizeAttempts} resize attempts` : ""}`
  )

  return result
}

/**
 * Optimises image with quality targeting to meet size constraints
 * Uses binary search to find optimal quality setting
 * Consolidated from image-presets.ts to eliminate duplication
 * @param inputBuffer - Image buffer to optimise
 * @param originalMimeType - Original MIME type
 * @param targetSize - Target file size in bytes
 * @param minQuality - Minimum quality (default: 10)
 * @param maxQuality - Maximum quality (default: 95)
 * @returns Promise<{buffer: Buffer, originalMimeType: string, quality: number}>
 */
export async function optimiseWithQualityTargeting(
  inputBuffer: Buffer,
  originalMimeType: string,
  targetSize: number,
  minQuality = 10,
  maxQuality = 95
): Promise<{ buffer: Buffer; originalMimeType: string; quality: number }> {
  // Start with a reasonable quality and adjust based on output size
  // biome-ignore lint/suspicious/noExplicitAny: LOSSY_FORMATS requires flexible string comparison
  let quality = LOSSY_FORMATS.includes(originalMimeType as any) ? 60 : 80
  let optimisedBuffer: Buffer
  let attempts = 0
  const maxAttempts = 10

  // Binary search approach to find optimal quality
  let currentMinQuality = minQuality
  let currentMaxQuality = maxQuality

  do {
    attempts++

    const sharpImage = sharp(inputBuffer)
    const { buffer } = await applyWebPCompression(sharpImage, originalMimeType, quality)
    optimisedBuffer = buffer

    // If we're within 10% of target size or under target, we're done
    const tolerance = targetSize * 0.1

    if (optimisedBuffer.length <= targetSize) {
      // Under target - try to increase quality if possible
      if (optimisedBuffer.length <= targetSize - tolerance && quality < currentMaxQuality && attempts < maxAttempts) {
        currentMinQuality = quality
        quality = Math.ceil((quality + currentMaxQuality) / 2)
      } else {
        break // Close enough or at max quality
      }
    } else {
      // Over target - reduce quality
      currentMaxQuality = quality
      quality = Math.floor((currentMinQuality + quality) / 2)

      if (quality <= currentMinQuality) {
        quality = currentMinQuality // Ensure we never go below minimum
        break // Can't reduce further
      }
    }
  } while (attempts < maxAttempts && Math.abs(currentMaxQuality - currentMinQuality) > 1)

  // Final attempt with minimum quality if still over target
  if (optimisedBuffer.length > targetSize && quality > currentMinQuality) {
    const sharpImage = sharp(inputBuffer)
    const { buffer } = await applyWebPCompression(sharpImage, originalMimeType, currentMinQuality)
    optimisedBuffer = buffer
    quality = currentMinQuality
  }

  return {
    buffer: optimisedBuffer,
    originalMimeType,
    quality
  }
}

/**
 * Uploads optimised image to R2 storage
 * @param env - Cloudflare environment with R2 binding and IMAGES_BASE_URL
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

  // Use environment variable for base URL instead of hardcoded value
  const baseUrl = env.IMAGES_BASE_URL || "https://images.dave.io"
  return `${baseUrl}/${key}`
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
    const baseUrl = env.IMAGES_BASE_URL || "https://images.dave.io"
    const url = `${baseUrl}/opt/${filename}`
    console.log(`Using cached optimised image: ${filename}`)

    // Fetch the cached image from R2 to get accurate metadata and buffer
    const key = `opt/${filename}`
    const cachedObject = await env.IMAGES.get(key)

    if (!cachedObject) {
      throw createApiError(503, "Failed to retrieve cached image from storage")
    }

    const cachedBuffer = await cachedObject.arrayBuffer()
    const cachedBufferAsBuffer = Buffer.from(cachedBuffer)

    // Extract metadata from the cached object
    const originalMimeType = cachedObject.customMetadata?.originalMimeType || "unknown"

    // Parse quality from filename for consistency
    const nameWithoutExt = filename.replace(/\.webp$/, "")
    let quality: number | undefined
    if (nameWithoutExt.includes("-q")) {
      const qualityMatch = nameWithoutExt.match(/-q(\d+)$/)
      quality = qualityMatch ? parseInt(qualityMatch[1], 10) : undefined
    }

    return {
      buffer: cachedBufferAsBuffer,
      originalSize: imageBuffer.length,
      optimisedSize: cachedBufferAsBuffer.length,
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
