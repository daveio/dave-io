import {
  type AdvancedOptimisationOptions,
  type OptimisedImageResult,
  optimiseImageBufferAdvanced,
  processImageOptimisation
} from "./image-processing"
import { createApiError } from "./response"

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

  // Use the advanced optimisation from image-processing.ts with preset-specific options
  const options: AdvancedOptimisationOptions = {
    targetSizeBytes: preset.maxSizeBytes,
    minQuality: 10,
    maxQuality: 95
  }

  const { buffer: optimisedBuffer, originalMimeType, quality } = await optimiseImageBufferAdvanced(
    imageBuffer,
    options
  )

  // Use the standard processing workflow with preset-specific options
  const result = await processImageOptimisation(imageBuffer, { quality }, env, { preset: presetName })

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
