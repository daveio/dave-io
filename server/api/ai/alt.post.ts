import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import {
  createAnthropicClient,
  parseClaudeResponse,
  sendClaudeMessage,
  validateAndPrepareImage
} from "~/server/utils/ai-helpers"
import { validateImageFormat, validateImageSize } from "~/server/utils/image-helpers"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI alt text generation
    const auth = await requireAIAuth(event, "alt")

    // Get environment bindings
    const env = getCloudflareEnv(event)

    const startTime = Date.now()

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createApiError(400, "No form data provided")
    }

    // Find the image file in form data
    const imageFile = formData.find((field) => field.name === "image")

    if (!imageFile || !imageFile.data) {
      throw createApiError(400, "No image file provided in 'image' field")
    }

    // Validate image size
    validateImageSize(imageFile.data)

    // Validate image format
    const contentType = imageFile.type || imageFile.filename?.split(".").pop() || "image/jpeg"
    validateImageFormat(imageFile.data, contentType.startsWith("image/") ? contentType : undefined)

    // Create Anthropic client
    const anthropic = createAnthropicClient(env)

    let _aiSuccess = false
    let _aiErrorType: string | undefined

    const systemPrompt = `You are an expert at creating descriptive, accessible alt text for images.

Your task is to analyze the provided image and generate concise, descriptive alt text that:
1. Describes the main subject and action in the image
2. Includes important visual details that provide context
3. Is concise but informative (typically 1-2 sentences)
4. Focuses on what's relevant for understanding the image's content and purpose
5. Avoids redundant phrases like "image of" or "picture showing"

Return your response as a JSON object with this exact format:
{
  "alt_text": "Your generated alt text here",
  "confidence": 0.95
}

The confidence score should be between 0 and 1, representing how confident you are in the accuracy and quality of the alt text.`

    try {
      // Validate and prepare image for Claude
      const { base64Data, mimeType } = validateAndPrepareImage(imageFile.data, contentType)

      // Send image to Claude for alt text generation
      const textContent = await sendClaudeMessage(
        anthropic,
        systemPrompt,
        "Please generate alt text for this image.",
        3.5,
        "haiku",
        base64Data,
        mimeType
      )

      // Parse Claude's response
      const aiResponse = parseClaudeResponse<{ alt_text: string; confidence?: number }>(textContent)

      // Validate that we got the expected response format
      if (!aiResponse.alt_text || typeof aiResponse.alt_text !== "string") {
        throw new Error("Invalid response format from Claude: missing or invalid alt_text")
      }

      // Ensure confidence is within valid range if provided
      if (aiResponse.confidence !== undefined && (aiResponse.confidence < 0 || aiResponse.confidence > 1)) {
        aiResponse.confidence = undefined
      }

      _aiSuccess = true

      const processingTime = Date.now() - startTime

      // Record successful AI request
      recordAPIMetrics(event, 200)

      // Log successful request
      logRequest(event, "ai/alt", "POST", 200, {
        user: auth.payload?.sub || "anonymous",
        imageSize: imageFile.data.length,
        imageType: mimeType,
        filename: imageFile.filename || "unknown",
        processingTime,
        success: true
      })

      return createApiResponse({
        result: {
          alt_text: aiResponse.alt_text,
          confidence: aiResponse.confidence
        },
        message: "Alt text generated successfully",
        error: null
      })
    } catch (error) {
      console.error("AI alt text generation failed:", error)
      _aiSuccess = false
      _aiErrorType = error instanceof Error ? error.name : "UnknownError"

      // If it's already an API error, re-throw it
      if (isApiError(error)) {
        throw error
      }

      throw createApiError(500, "Failed to generate alt text with AI")
    }
  } catch (error: unknown) {
    console.error("AI alt error:", error)

    // Record failed AI request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "ai/alt", "POST", statusCode, {
      user: "unknown",
      imageSize: 0,
      imageType: "",
      filename: "",
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
