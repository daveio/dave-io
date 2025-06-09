import { processImageWithCloudflareImages } from "./cloudflare-images"
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
 * Process image optimisation for a specific preset using Cloudflare Images
 * @param imageBuffer - Original image buffer
 * @param presetName - Name of the preset to apply
 * @param env - Cloudflare environment
 * @returns Promise<OptimisedImageResult> - Complete processing result
 */
export async function processPresetOptimisation(
  imageBuffer: Buffer,
  presetName: string,
  env: Env
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
  const preset = PRESETS[presetName]
  if (!preset) {
    const availablePresets = Object.keys(PRESETS).join(", ")
    throw createApiError(400, `Unknown preset '${presetName}'. Available presets: ${availablePresets}`)
  }

  const startTime = Date.now()

  // For AI processing, we want high quality since it's for analysis
  // Cloudflare Images will handle the size optimization automatically
  const quality = presetName === "alt" ? 85 : undefined

  const result = await processImageWithCloudflareImages(imageBuffer, { quality }, env, { preset: presetName })

  const processingTime = Date.now() - startTime
  console.log(`Preset '${presetName}' optimisation completed in ${processingTime}ms`)

  return result
}

/**
 * Direct optimisation for AI processing without HTTP calls
 * Uses Cloudflare Images instead of Sharp
 * @param imageBuffer - Image buffer to optimise
 * @param env - Cloudflare environment
 * @returns Promise<OptimisedImageResult> - Optimisation result
 */
export async function optimiseImageForAI(
  imageBuffer: Buffer,
  env: Env
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
  return processPresetOptimisation(imageBuffer, "alt", env)
}
