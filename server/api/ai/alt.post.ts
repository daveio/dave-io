import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "../../middleware/metrics"
import { requireAIAuth } from "../../utils/auth-helpers"
import {
  createOpenRouterClient,
  parseAIResponse,
  sendAIMessage,
  validateAndPrepareImageWithOptimization,
  getAIModelFromKV
} from "../../utils/ai-helpers"
import { getCloudflareEnv } from "../../utils/cloudflare"
import { validateImageFormat } from "../../utils/image-helpers"
import { createApiError, isApiError, logRequest } from "../../utils/response"
import { createTypedApiResponse } from "../../utils/response-types"

// Define the result schema for the AI alt endpoint (same as GET)
const AiAltResultSchema = z.object({
  alt_text: z.string().describe("Generated alt text for the image"),
  confidence: z.number().min(0).max(1).optional().describe("Confidence score for the generated alt text")
})

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

    // Validate image format (size validation will be handled by optimization function)
    const contentType = imageFile.type || imageFile.filename?.split(".").pop() || "image/jpeg"
    validateImageFormat(imageFile.data, contentType.startsWith("image/") ? contentType : undefined)

    // Create OpenRouter client
    const openai = createOpenRouterClient(env)

    // Get AI model from KV with fallback
    const aiModel = await getAIModelFromKV(env, "alt")

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
      // Validate and prepare image for AI with optimization if needed
      const { base64Data, mimeType } = await validateAndPrepareImageWithOptimization(
        imageFile.data,
        env, // Pass environment for Images binding access
        contentType
      )

      // Send image to AI for alt text generation
      const textContent = await sendAIMessage(
        openai,
        systemPrompt,
        "Please generate alt text for this image.",
        aiModel,
        base64Data,
        mimeType
      )

      // Parse AI's response
      const aiResponse = parseAIResponse<{ alt_text: string; confidence?: number }>(textContent)

      // Validate that we got the expected response format
      if (!aiResponse.alt_text || typeof aiResponse.alt_text !== "string") {
        throw new Error("Invalid response format from AI: missing or invalid alt_text")
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

      return createTypedApiResponse({
        result: {
          alt_text: aiResponse.alt_text,
          confidence: aiResponse.confidence
        },
        message: "Alt text generated successfully",
        error: null,
        resultSchema: AiAltResultSchema
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
