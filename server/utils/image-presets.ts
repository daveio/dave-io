import sharp from "sharp"
import { createApiError } from "./response"
import { LOSSY_FORMATS, OptimisationOptions, OptimisedImageResult, optimiseImageBuffer, processImageOptimisation, validateAndDetectMimeType } from "./image-processing"

/**
 * Configuration for image optimisation presets
 */
export interface PresetConfig {
  maxSizeBytes: number
  description: string
}

/**
 * Available optimisation presets
 */
export const PRESETS: Record<string, PresetConfig> = {
  alt: {
    maxSizeBytes: 4 * 1024 * 1024, // 4MB
    description: "Optimise image for AI alt text processing (≤ 4MB)"
  }
} as const

/**
 * Optimises image with quality targeting to meet size constraints
 * Uses binary search to find optimal quality setting
 * @param inputBuffer - Image buffer to optimise
 * @param originalMimeType - Original MIME type
 * @param targetSize - Target file size in bytes
 * @returns Promise<{buffer: Buffer, originalMimeType: string, quality: number}>
 */
export async function optimiseWithQualityTargeting(
  inputBuffer: Buffer,
  originalMimeType: string,
  targetSize: number
): Promise<{ buffer: Buffer; originalMimeType: string; quality: number }> {
  // Start with a reasonable quality and adjust based on output size
  let quality = LOSSY_FORMATS.includes(originalMimeType as any) ? 60 : 80
  let optimisedBuffer: Buffer
  let attempts = 0
  const maxAttempts = 10

  // Binary search approach to find optimal quality
  const minQuality = 10  // Enforce minimum quality of 10
  let maxQuality = 95

  do {
    attempts++

    let sharpImage = sharp(inputBuffer)

    if (LOSSY_FORMATS.includes(originalMimeType as any) || quality < 95) {
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
        quality = minQuality  // Ensure we never go below 10
        break // Can't reduce further
      }
    }
  } while (attempts < maxAttempts && Math.abs(maxQuality - minQuality) > 1)

  // Final attempt with minimum quality if still over target
  if (optimisedBuffer.length > targetSize && quality > minQuality) {
    const sharpImage = sharp(inputBuffer).webp({
      quality: minQuality,
      lossless: false,
      effort: 6
    })
    optimisedBuffer = await sharpImage.toBuffer()
    quality = minQuality
  }

  return {
    buffer: optimisedBuffer,
    originalMimeType,
    quality
  }
}

/**
 * Optimises image for a specific preset with aggressive size reduction
 * Combines quality optimisation with dimension reduction if needed
 * @param inputBuffer - Image buffer to optimise
 * @param preset - Preset configuration
 * @returns Promise<{buffer: Buffer, originalMimeType: string, quality: number}>
 */
export async function optimiseForPreset(
  inputBuffer: Buffer,
  preset: PresetConfig
): Promise<{ buffer: Buffer; originalMimeType: string; quality: number }> {
  const originalMimeType = await validateAndDetectMimeType(inputBuffer)

  // Get original image metadata for resizing logic
  const originalMetadata = await sharp(inputBuffer).metadata()
  const originalWidth = originalMetadata.width || 0
  const originalHeight = originalMetadata.height || 0

  console.log(`Original image: ${originalWidth}x${originalHeight} (${inputBuffer.length} bytes)`)

  let currentBuffer = inputBuffer
  let currentWidth = originalWidth
  let currentHeight = originalHeight
  let resizeAttempts = 0
  const minLongEdge = 1024

  // Phase 1: Try quality optimisation first without resizing
  let result = await optimiseWithQualityTargeting(currentBuffer, originalMimeType, preset.maxSizeBytes)

  // Phase 2: If still too large, start reducing dimensions
  while (result.buffer.length > preset.maxSizeBytes && Math.max(currentWidth, currentHeight) > minLongEdge) {
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
    result = await optimiseWithQualityTargeting(currentBuffer, originalMimeType, preset.maxSizeBytes)

    // Safety check to prevent infinite loops
    if (resizeAttempts >= 10) {
      console.warn(`Reached maximum resize attempts (${resizeAttempts})`)
      break
    }
  }

  // Final check - if we're at minimum dimensions and still over target, throw error
  if (result.buffer.length > preset.maxSizeBytes) {
    const currentLongEdge = Math.max(currentWidth, currentHeight)
    if (currentLongEdge <= minLongEdge) {
      throw createApiError(
        422,
        `Unable to compress image below ${preset.maxSizeBytes} bytes even at minimum dimensions (${currentWidth}x${currentHeight}). Current size: ${result.buffer.length} bytes`
      )
    }
  }

  console.log(
    `Preset optimisation completed: ${inputBuffer.length} → ${result.buffer.length} bytes ` +
      `(${originalWidth}x${originalHeight} → ${currentWidth}x${currentHeight}) ` +
      `at quality ${result.quality}${resizeAttempts > 0 ? ` after ${resizeAttempts} resize attempts` : ""}`
  )

  return result
}

/**
 * Process image optimisation for a specific preset
 * @param imageBuffer - Original image buffer
 * @param presetName - Name of the preset to apply
 * @param env - Cloudflare environment
 * @returns Promise<OptimisedImageResult> - Complete processing result
 */
export async function processPresetOptimisation(
  imageBuffer: Buffer,
  presetName: string,
  env: Env
): Promise<OptimisedImageResult> {
  const preset = PRESETS[presetName]
  if (!preset) {
    const availablePresets = Object.keys(PRESETS).join(", ")
    throw createApiError(400, `Unknown preset '${presetName}'. Available presets: ${availablePresets}`)
  }

  const startTime = Date.now()

  // Optimise the image for the preset
  const { buffer: optimisedBuffer, originalMimeType, quality } = await optimiseForPreset(imageBuffer, preset)

  // Use the standard processing workflow with preset-specific options
  const result = await processImageOptimisation(
    imageBuffer,
    { quality },
    env,
    { preset: presetName }
  )

  const processingTime = Date.now() - startTime
  console.log(`Preset '${presetName}' optimisation completed in ${processingTime}ms`)

  // Override the buffer with our preset-optimised version
  return {
    ...result,
    buffer: optimisedBuffer,
    optimisedSize: optimisedBuffer.length,
    quality
  }
}

/**
 * Direct optimisation for AI processing without HTTP calls
 * Replaces the HTTP-based optimiseImageForAI function
 * @param imageBuffer - Image buffer to optimise
 * @param env - Cloudflare environment
 * @returns Promise<OptimisedImageResult> - Optimisation result
 */
export async function optimiseImageForAI(imageBuffer: Buffer, env: Env): Promise<OptimisedImageResult> {
  return processPresetOptimisation(imageBuffer, "alt", env)
}