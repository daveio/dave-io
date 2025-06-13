import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import { optimiseImageForAI } from "~/server/utils/image-presets"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { parseImageUpload } from "~/server/utils/validation"

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI alt text generation using helper
    const auth = await requireAIAuth(event, "alt")

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)

    const startTime = Date.now()

    const { buffer: originalImageData, source: imageSource } = await parseImageUpload(event, { allowUrl: true })

    // Optimise the image using the 'alt' preset (≤ 4MB)
    const optimisationResult = await optimiseImageForAI(originalImageData, env as Env)

    // Use the optimized buffer directly - no HTTP fetch needed!
    const imageData = optimisationResult.buffer
    const compressionRatio = Math.round((1 - optimisationResult.optimisedSize / optimisationResult.originalSize) * 100)

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
        image: Array.from(new Uint8Array(imageData)),
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

    const processingTime = Date.now() - startTime

    // Record successful AI request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "ai/alt", "POST", 200, {
      user: auth.payload?.sub || "anonymous",
      originalImageSize: originalImageData.length,
      optimisedImageSize: imageData.length,
      compressionRatio,
      processingTime,
      success: true
    })

    return createApiResponse({
      result: {
        altText,
        imageSource,
        model: aiModel,
        processingTimeMs: processingTime,
        originalImageSizeBytes: originalImageData.length,
        optimisedImageSizeBytes: imageData.length,
        compressionRatio,
        optimisedImageUrl: optimisationResult.url
      },
      message: "Alt text generated successfully",
      error: null
    })
  } catch (error: unknown) {
    console.error("AI alt-text error:", error)

    // Record failed AI request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "ai/alt", "POST", statusCode, {
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

    throw createApiError(500, "Failed to generate alt text")
  }
})
