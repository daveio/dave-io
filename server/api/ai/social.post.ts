import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAIAuth } from "~/server/utils/auth-helpers"
import { createAnthropicClient, parseClaudeResponse, sendClaudeMessage } from "~/server/utils/ai-helpers"
import { createApiError, isApiError, logRequest } from "~/server/utils/response"
import { createTypedApiResponse } from "~/server/utils/response-types"
import { AiSocialRequestSchema, AiSocialNetworkEnum } from "~/server/utils/schemas"
import type { AiSocialNetwork } from "~/server/utils/schemas"

const DEFAULT_CHARACTER_LIMITS: Record<AiSocialNetwork, number> = {
  bluesky: 300,
  mastodon: 4096,
  threads: 500,
  x: 280
}

// Define the result schema for the AI social endpoint
const AiSocialResultSchema = z.object({
  networks: z.record(AiSocialNetworkEnum, z.array(z.string()).max(100, "Maximum 100 posts per network"))
})

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

    // Reserve space for threading indicators (e.g., "\n\n🧵 1/5" = 8 chars + max thread count digits)
    // Assume maximum 99 posts in a thread, so "🧵 99/99" = 8 chars + 2 newlines = 10 chars total
    const THREAD_INDICATOR_SPACE = 10

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

    // Create Anthropic client using shared helper
    const anthropic = createAnthropicClient(env)

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

    // Calculate effective character limits (reserving space for threading indicators)
    const effectiveCharacterLimits: Record<string, number> = {}
    for (const network of validatedRequest.networks) {
      effectiveCharacterLimits[network] = characterLimits[network] - THREAD_INDICATOR_SPACE
    }

    const systemPrompt = `You are a social media content splitter. Split the given text into posts for the specified social networks.

Character limits (threading indicators will be added automatically):
${validatedRequest.networks.map((n) => `- ${n}: ${effectiveCharacterLimits[n]} characters`).join("\n")}

Splitting strategies to use: ${selectedStrategies}

${validatedRequest.markdown && validatedRequest.networks.includes("mastodon") ? "For Mastodon, preserve or add appropriate Markdown formatting." : ""}

Rules:
1. Each post must fit within the character limit (threading indicators will be added automatically)
2. Maintain the flow and coherence of the original content
3. Don't cut words in the middle
4. Preserve important context in each post
5. Keep hashtags with relevant content when possible
6. Do NOT add thread numbering - this will be handled automatically
7. You may need to re-word the text. Try to do this minimally. Ensure each post is coherent and complete.
8. Ensure you have a full understanding of the entire text before you start splitting it.

Return a JSON object with a "networks" property containing arrays of posts for each network.`

    try {
      // Send message to Claude using shared helper
      const textContent = await sendClaudeMessage(
        anthropic,
        systemPrompt,
        validatedRequest.input,
        "claude-4-sonnet-20250514"
      )

      // Parse Claude's response using shared helper
      const aiResponse = parseClaudeResponse<{ networks: Record<string, string[]> }>(textContent)

      // Validate that all requested networks are present
      for (const network of validatedRequest.networks) {
        if (!aiResponse.networks?.[network] || !Array.isArray(aiResponse.networks[network])) {
          throw new Error(`Missing or invalid response for network: ${network}`)
        }
      }

      // Add threading indicators for multi-post threads
      for (const network of validatedRequest.networks) {
        const posts = aiResponse.networks[network]
        if (posts && posts.length > 1) {
          // Add threading indicators to each post
          for (let i = 0; i < posts.length; i++) {
            const postNumber = i + 1
            const totalPosts = posts.length
            const threadIndicator = `\n\n🧵 ${postNumber}/${totalPosts}`
            posts[i] += threadIndicator
          }
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

      return createTypedApiResponse({
        result: {
          networks: aiResponse.networks
        },
        message: "Text split successfully for social media",
        error: null,
        resultSchema: AiSocialResultSchema
      })
    } catch (error) {
      console.error("Anthropic Claude processing failed:", error)
      _aiSuccess = false
      _aiErrorType = error instanceof Error ? error.name : "UnknownError"
      throw createApiError(500, "Failed to process text with Anthropic Claude")
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
