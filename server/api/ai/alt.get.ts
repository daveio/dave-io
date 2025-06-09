import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { optimiseImageForAI } from "~/server/utils/image-optimisation"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { validateImageURL } from "~/server/utils/validation"

// Local function removed - using shared helper from auth-helpers

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI alt text generation using helper
    const auth = await requireAIAuth(event, "alt")

    const query = getQuery(event)
    const imageUrl = query.url as string

    if (!imageUrl) {
      throw createApiError(400, "Image URL is required (url parameter)")
    }

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)

    // Validate, fetch and optimise image for AI processing
    const processingStart = Date.now()
    const originalImageBuffer = await validateImageURL(imageUrl)
    const originalBuffer = Buffer.from(originalImageBuffer)

    // Optimise the image using the 'alt' preset (≤ 4MB)
    const optimisationResult = await optimiseImageForAI(event, originalBuffer)

    // Use the optimized buffer directly - no HTTP fetch needed!
    const imageBuffer = optimisationResult.buffer

    // Use Cloudflare AI for image analysis
    let altText: string
    const aiModel = "@cf/llava-hf/llava-1.5-7b-hf"

    if (!env?.AI) {
      throw createApiError(503, "AI service not available")
    }

    let _aiSuccess = false
    let _aiErrorType: string | undefined

    try {
      const result = (await env.AI.run(aiModel as "@cf/llava-hf/llava-1.5-7b-hf", {
        image: Array.from(new Uint8Array(imageBuffer)),
        prompt:
          "Describe this image in detail for use as alt text. Focus on the main subjects, actions, and important visual elements that would help someone understand the image content. Be concise but descriptive.",
        max_tokens: 150
      })) as { description?: string; text?: string }

      altText = result.description || result.text || "Unable to generate description"

      // Clean up the AI response
      altText = altText.trim()
      if (altText.length > 300) {
        altText = `${altText.substring(0, 297)}...`
      }

      _aiSuccess = true
    } catch (error) {
      console.error("AI processing failed:", error)
      _aiSuccess = false
      _aiErrorType = error instanceof Error ? error.name : "UnknownError"
      throw createApiError(500, "Failed to process image with AI")
    }

    const processingTime = Date.now() - processingStart

    // Record successful AI request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "ai/alt", "GET", 200, {
      user: auth.payload?.sub || "anonymous",
      originalImageSize: originalBuffer.length,
      optimisedImageSize: imageBuffer.length,
      compressionRatio: optimisationResult.compressionRatio,
      processingTime,
      success: true
    })

    return createApiResponse(
      {
        altText,
        imageSource: imageUrl,
        model: aiModel,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        originalImageSizeBytes: originalBuffer.length,
        optimisedImageSizeBytes: imageBuffer.length,
        compressionRatio: optimisationResult.compressionRatio,
        optimisedImageUrl: optimisationResult.url
      },
      "Alt text generated successfully"
    )
  } catch (error: unknown) {
    console.error("AI alt text error:", error)

    // Record failed AI request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "ai/alt", "GET", statusCode, {
      user: "unknown",
      originalImageSize: 0,
      optimisedImageSize: 0,
      compressionRatio: 0,
      processingTime: 0,
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Alt text generation failed")
  }
})
