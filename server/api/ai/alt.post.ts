import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { fetchOptimisedImage, optimiseImageForAI } from "~/server/utils/image-optimisation"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { AiAltTextRequestSchema } from "~/server/utils/schemas"
import { validateBase64Image, validateImageURL } from "~/server/utils/validation"

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI alt text generation using helper
    const auth = await requireAIAuth(event, "alt")

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)

    // Parse and validate request body
    const body = await readBody(event)
    const request = AiAltTextRequestSchema.parse(body)

    const startTime = Date.now()

    // Process the image data and optimise for AI
    let originalImageData: Buffer

    if (request.url) {
      // Fetch and validate image from URL
      const buffer = await validateImageURL(request.url)
      originalImageData = Buffer.from(buffer)
    } else if (request.image) {
      originalImageData = await validateBase64Image(request.image)
    } else {
      throw createApiError(400, "Either url or image must be provided")
    }

    // Optimise the image using the 'alt' preset (≤ 4MB)
    const optimisationResult = await optimiseImageForAI(event, originalImageData)

    // Fetch the optimised image for AI processing
    const imageData = await fetchOptimisedImage(optimisationResult.url)

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
      compressionRatio: optimisationResult.compressionRatio,
      processingTime,
      success: true
    })

    return createApiResponse(
      {
        altText,
        imageSource: request.url || "uploaded-file",
        model: aiModel,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        originalImageSizeBytes: originalImageData.length,
        optimisedImageSizeBytes: imageData.length,
        compressionRatio: optimisationResult.compressionRatio,
        optimisedImageUrl: optimisationResult.url
      },
      "Alt text generated successfully"
    )
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
