import type { H3Event } from "h3"
import { createApiError } from "./response"

interface OptimisationResult {
  url: string
  originalSizeBytes: number
  optimisedSizeBytes: number
  compressionRatio: number
  format: string
  hash: string
  quality?: number
}

/**
 * Call the internal image optimisation service with the 'alt' preset
 * This ensures images are ≤ 4MB for AI processing
 */
export async function optimiseImageForAI(event: H3Event, imageBuffer: Buffer): Promise<OptimisationResult> {
  try {
    // Create base64 representation for internal API call
    const base64Image = imageBuffer.toString("base64")

    // Get the request origin to construct internal URL
    const headers = getHeaders(event)
    const protocol = headers["x-forwarded-proto"] || "https"
    const host = headers.host || headers["x-forwarded-host"] || "localhost"
    const baseUrl = `${protocol}://${host}`

    // Call internal optimisation API with 'alt' preset
    const optimisationResponse = await $fetch<{
      success: boolean
      data?: OptimisationResult
      error?: string
    }>(`${baseUrl}/api/images/optimise/preset/alt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header for internal call
        ...(headers.authorization && { authorization: headers.authorization })
      },
      body: JSON.stringify({
        image: base64Image
      })
    })

    if (!optimisationResponse.success || !optimisationResponse.data) {
      console.error("Image optimisation failed:", optimisationResponse.error)
      throw createApiError(500, "Failed to optimise image for AI processing")
    }

    return optimisationResponse.data
  } catch (error) {
    console.error("Internal image optimisation error:", error)

    // If it's already an API error, re-throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }

    throw createApiError(500, "Image optimisation service unavailable")
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
      throw createApiError(500, `Failed to fetch optimised image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("Failed to fetch optimised image:", error)
    throw createApiError(500, "Failed to retrieve optimised image")
  }
}
