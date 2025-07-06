import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { AiSocialRequestSchema } from "~/server/utils/schemas"
import type { AiSocialNetwork } from "~/server/utils/schemas"

const DEFAULT_CHARACTER_LIMITS: Record<AiSocialNetwork, number> = {
  bluesky: 300,
  mastodon: 4096,
  threads: 500,
  x: 280
}

export default defineEventHandler(async (event) => {
  try {
    // Check authorization for AI social text generation using helper
    const auth = await requireAIAuth(event, "social")

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)

    const startTime = Date.now()

    // Parse and validate request body
    const body = await readBody(event)
    const validatedRequest = AiSocialRequestSchema.parse(body)

    // Fetch character limits from KV with fallback to defaults
    const characterLimits: Record<AiSocialNetwork, number> = { ...DEFAULT_CHARACTER_LIMITS }

    if (env?.KV) {
      await Promise.all(
        validatedRequest.networks.map(async (network) => {
          const kvKey = `ai:social:characters:${network}`
          const limit = await env.KV!.get(kvKey)
          if (limit) {
            characterLimits[network] = Number.parseInt(limit, 10)
          }
        })
      )
    }

    // Use Cloudflare AI for text splitting
    const aiModel = "@cf/meta/llama-4-scout-17b-16e-instruct"

    if (!env?.AI) {
      throw createApiError(503, "AI service not available")
    }

    let _aiSuccess = false
    let _aiErrorType: string | undefined

    // Build strategy descriptions for the prompt
    const strategyDescriptions = {
      sentence_boundary: "Split at sentence endings to maintain complete thoughts",
      word_boundary: "Split at word boundaries without breaking words",
      paragraph_preserve: "Keep paragraphs intact when possible",
      thread_optimize: "Optimize for thread continuity with numbered posts",
      hashtag_preserve: "Keep hashtags with their relevant content"
    }

    const selectedStrategies = validatedRequest.strategies.map((s) => strategyDescriptions[s]).join(", ")

    // Create JSON schema for structured output
    const jsonSchema = {
      type: "object",
      properties: {
        networks: {
          type: "object",
          properties: Object.fromEntries(
            validatedRequest.networks.map((network) => [
              network,
              {
                type: "array",
                items: { type: "string" },
                description: `Posts for ${network} (max ${characterLimits[network]} chars each)`
              }
            ])
          ),
          required: validatedRequest.networks
        }
      },
      required: ["networks"]
    }

    const systemPrompt = `You are a social media content splitter. Split the given text into posts for the specified social networks.

Character limits:
${validatedRequest.networks.map((n) => `- ${n}: ${characterLimits[n]} characters`).join("\n")}

Splitting strategies to use: ${selectedStrategies}

${validatedRequest.markdown && validatedRequest.networks.includes("mastodon") ? "For Mastodon, preserve or add appropriate Markdown formatting." : ""}

Rules:
1. Each post must fit within the character limit
2. Maintain the flow and coherence of the original content
3. Don't cut words in the middle
4. For threads, number the posts (e.g., "1/5", "2/5")
5. Preserve important context in each post
6. Keep hashtags with relevant content when possible

Return a JSON object with a "networks" property containing arrays of posts for each network.`

    try {
      const result = (await env.AI.run(aiModel as "@cf/meta/llama-4-scout-17b-16e-instruct", {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: validatedRequest.input
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: jsonSchema
        },
        max_tokens: 4096
      })) as { response: string }

      // Parse the AI response
      const aiResponse = JSON.parse(result.response)

      // Validate that all requested networks are present
      for (const network of validatedRequest.networks) {
        if (!aiResponse.networks?.[network] || !Array.isArray(aiResponse.networks[network])) {
          throw new Error(`Missing or invalid response for network: ${network}`)
        }
      }

      _aiSuccess = true

      const processingTime = Date.now() - startTime

      // Record successful AI request
      recordAPIMetrics(event, 200)

      // Log successful request
      logRequest(event, "ai/social", "POST", 200, {
        user: auth.payload?.sub || "anonymous",
        inputLength: validatedRequest.input.length,
        networksCount: validatedRequest.networks.length,
        processingTime,
        success: true
      })

      return createApiResponse({
        result: {
          networks: aiResponse.networks
        },
        message: "Text split successfully for social media",
        error: null
      })
    } catch (error) {
      console.error("AI processing failed:", error)
      _aiSuccess = false
      _aiErrorType = error instanceof Error ? error.name : "UnknownError"
      throw createApiError(500, "Failed to process text with AI")
    }
  } catch (error: unknown) {
    console.error("AI social error:", error)

    // Record failed AI request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "ai/social", "POST", statusCode, {
      user: "unknown",
      inputLength: 0,
      networksCount: 0,
      processingTime: 0,
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Failed to split text for social media")
  }
})
