import type { H3Event } from "h3"
import { getCloudflareEnv } from "./cloudflare"
import { optimiseImageForAI as directOptimiseImageForAI } from "./image-presets"
import { isApiError } from "./response"

interface OptimisationResult {
  buffer: Buffer
  url: string
  originalSizeBytes: number
  optimisedSizeBytes: number
  compressionRatio: number
  format: string
  hash: string
  quality?: number
}

/**
 * Optimise image for AI processing using direct function invocation
 * This replaces the HTTP-based approach for better performance and reduces complexity
 * Returns the optimized buffer directly instead of requiring HTTP fetch
 */
export async function optimiseImageForAI(event: H3Event, imageBuffer: Buffer): Promise<OptimisationResult> {
  try {
    const env = getCloudflareEnv(event)

    // Use direct function invocation instead of HTTP calls
    const result = await directOptimiseImageForAI(imageBuffer, env as Env)

    return {
      buffer: result.buffer, // Return the buffer directly - no HTTP fetch needed!
      url: result.url,
      originalSizeBytes: result.originalSize,
      optimisedSizeBytes: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
      format: result.format,
      hash: result.hash,
      quality: result.quality
    }
  } catch (error) {
    console.error("Direct image optimisation error:", error)

    // If it's already an API error, re-throw it
    if (isApiError(error)) {
      throw error
    }

    throw new Error("Image optimisation service unavailable")
  }
}

/**
 * Fetch optimised image data from URL
 * Returns buffer of the optimised image for AI processing
 */
export async function fetchOptimisedImage(optimisedUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(optimisedUrl, {
      headers: {
        "User-Agent": "dave.io/1.0 (AI Internal Service)"
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch optimised image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("Failed to fetch optimised image:", error)
    throw new Error("Failed to retrieve optimised image")
  }
}
