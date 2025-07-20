import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "../../middleware/metrics"
import { requireAIAuth } from "../../utils/auth-helpers"
import { createOpenRouterClient, parseAIResponse, sendAIMessage, getAIModelFromKV } from "../../utils/ai-helpers"
import { createApiError, isApiError, logRequest } from "../../utils/response"
import { createTypedApiResponse } from "../../utils/response-types"
import { AiWordRequestSchema, AiWordSuggestionSchema } from "../../utils/schemas"
import type { AiWordSuggestion } from "../../utils/schemas"

// Define the result schema for the AI word endpoint
const AiWordResultSchema = z.object({
  suggestions: z
    .array(AiWordSuggestionSchema)
    .min(5)
    .max(10)
    .describe("Array of word suggestions ordered by likelihood")
})

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI word alternative generation using helper
    const auth = await requireAIAuth(event, "word")

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)

    const startTime = Date.now()

    // Parse and validate request body
    const body = await readBody(event)
    const validatedRequest = AiWordRequestSchema.parse(body)

    // Create OpenRouter client using shared helper
    const openai = await createOpenRouterClient(env)

    // Get AI model from KV with fallback
    const aiModel = await getAIModelFromKV(env, "word")

    let _aiSuccess = false
    let _aiErrorType: string | undefined

    // Build system prompt based on mode
    let systemPrompt: string
    let userMessage: string

    if (validatedRequest.mode === "single") {
      systemPrompt = `You are an expert at finding alternative words and synonyms. Your task is to suggest words that could replace the given word.

Rules:
1. Provide 5-10 alternative words
2. Order them by likelihood of being the right replacement
3. Consider different contexts where the word might be used
4. Include both exact synonyms and contextually related words
5. Focus on commonly used, accessible alternatives

Return a JSON object with this exact format:
{
  "suggestions": [
    {"word": "alternative1", "confidence": 0.95},
    {"word": "alternative2", "confidence": 0.90},
    {"word": "alternative3", "confidence": 0.85},
    {"word": "alternative4", "confidence": 0.80},
    {"word": "alternative5", "confidence": 0.75}
  ]
}

The confidence score should be between 0 and 1, representing how likely this word is to be what the user is looking for.`

      userMessage = `Find alternatives for the word: "${validatedRequest.word}"`
    } else {
      systemPrompt = `You are an expert at finding the right word in context. Your task is to suggest better alternatives for a specific word within a given text.

Rules:
1. Analyze the context to understand the intended meaning
2. Provide 5-10 alternative words that would work better in this context
3. Order them by how well they fit the context and improve the text
4. Consider tone, formality, and nuance
5. Focus on words that enhance clarity and precision

Return a JSON object with this exact format:
{
  "suggestions": [
    {"word": "alternative1", "confidence": 0.95},
    {"word": "alternative2", "confidence": 0.90},
    {"word": "alternative3", "confidence": 0.85},
    {"word": "alternative4", "confidence": 0.80},
    {"word": "alternative5", "confidence": 0.75}
  ]
}

The confidence score should be between 0 and 1, representing how well this word fits the context.`

      userMessage = `Text: "${validatedRequest.text}"

The word "${validatedRequest.target_word}" needs a better alternative. What would work better in this context?`
    }

    try {
      // Send message to AI using shared helper
      const textContent = await sendAIMessage(openai, systemPrompt, userMessage, aiModel)

      // Parse AI's response using shared helper
      const aiResponse = parseAIResponse<{ suggestions: AiWordSuggestion[] }>(textContent)

      // Validate that we got the expected response format
      if (!aiResponse.suggestions || !Array.isArray(aiResponse.suggestions)) {
        throw new Error("Invalid response format from AI: missing or invalid suggestions array")
      }

      // Validate each suggestion
      for (const suggestion of aiResponse.suggestions) {
        if (!suggestion.word || typeof suggestion.word !== "string") {
          throw new Error("Invalid suggestion format: missing or invalid word")
        }
        // Ensure confidence is within valid range if provided
        if (suggestion.confidence !== undefined && (suggestion.confidence < 0 || suggestion.confidence > 1)) {
          suggestion.confidence = undefined
        }
      }

      // Ensure we have 5-10 suggestions
      if (aiResponse.suggestions.length < 5) {
        throw new Error(`Not enough suggestions provided: ${aiResponse.suggestions.length}`)
      }
      if (aiResponse.suggestions.length > 10) {
        aiResponse.suggestions = aiResponse.suggestions.slice(0, 10)
      }

      _aiSuccess = true

      const processingTime = Date.now() - startTime

      // Record successful AI request
      recordAPIMetrics(event, 200)

      // Log successful request
      logRequest(event, "ai/word", "POST", 200, {
        user: auth.payload?.sub || "anonymous",
        mode: validatedRequest.mode,
        inputWord: validatedRequest.mode === "single" ? validatedRequest.word : validatedRequest.target_word,
        processingTime,
        success: true
      })

      return createTypedApiResponse({
        result: {
          suggestions: aiResponse.suggestions
        },
        message: "Word alternatives generated successfully",
        error: null,
        resultSchema: AiWordResultSchema
      })
    } catch (error) {
      console.error("OpenRouter AI processing failed:", error)
      _aiSuccess = false
      _aiErrorType = error instanceof Error ? error.name : "UnknownError"
      throw createApiError(500, "Failed to process word alternatives with OpenRouter AI")
    }
  } catch (error: unknown) {
    console.error("AI word error:", error)

    // Record failed AI request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "ai/word", "POST", statusCode, {
      user: "unknown",
      mode: "unknown",
      inputWord: "",
      processingTime: 0,
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Failed to generate word alternatives")
  }
})
