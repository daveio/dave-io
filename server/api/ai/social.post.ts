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

    // Use Cloudflare AI for text splitting
    const aiModel = "@cf/meta/llama-4-scout-17b-16e-instruct"

    if (!env?.AI) {
      throw createApiError(503, "AI service not available")
    }

    let _aiSuccess = false
    let _aiErrorType: string | undefined

    // Determine if we're using example-based or strategy-based approach
    const useExampleBased = !validatedRequest.strategies || validatedRequest.strategies.length === 0

    // Build strategy descriptions for the prompt (if using strategy-based approach)
    let selectedStrategies = ""
    if (!useExampleBased) {
      const strategyDescriptions = {
        sentence_boundary: "Split at sentence endings to maintain complete thoughts",
        word_boundary: "Split at word boundaries without breaking words",
        paragraph_preserve: "Keep paragraphs intact when possible",
        thread_optimize: "Optimize for thread continuity with numbered posts",
        hashtag_preserve: "Keep hashtags with their relevant content"
      }
      selectedStrategies = validatedRequest.strategies!.map((s) => strategyDescriptions[s]).join(", ")
    }

    // Calculate effective character limits (reserving space for threading indicators)
    const effectiveCharacterLimits: Record<string, number> = {}
    for (const network of validatedRequest.networks) {
      effectiveCharacterLimits[network] = characterLimits[network] - THREAD_INDICATOR_SPACE
    }

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
                description: `Posts for ${network} (max ${effectiveCharacterLimits[network]} chars each, threading indicators added automatically)`
              }
            ])
          ),
          required: validatedRequest.networks
        }
      },
      required: ["networks"]
    }

    const systemPrompt = useExampleBased
      ? `You are a social media content splitter. Your PRIMARY GOAL is to optimize content for each network's character limits by using the MAXIMUM space available and minimizing the number of posts.

Character limits (threading indicators will be added automatically):
${validatedRequest.networks.map((n) => `- ${n}: ${effectiveCharacterLimits[n]} characters`).join("\n")}

${validatedRequest.markdown && validatedRequest.networks.includes("mastodon") ? "For Mastodon, preserve or add appropriate Markdown formatting." : ""}
${validatedRequest.networks.includes("threads") ? "For Threads, you can use basic formatting like **bold** and *italic* when appropriate." : ""}

MANDATORY OPTIMIZATION PRINCIPLES:

1. **MAXIMIZE CHARACTER USAGE**: Always use as much of the character limit as possible for each network. Do NOT split content into more posts than absolutely necessary.

2. **NETWORK-SPECIFIC APPROACH**:
   - **High-limit networks** (Mastodon ~4000+ chars): Try to fit ALL content in ONE post unless it's genuinely too long
   - **Medium-limit networks** (Threads ~500 chars): Use 1-2 posts maximum for typical content
   - **Low-limit networks** (Bluesky/X ~300 chars): Split as needed, but still maximize each post

3. **SMART SPLITTING LOGIC**: Balance character optimization with logical narrative flow:
   - **Primary goal**: Use character limits efficiently (fewer posts when possible)
   - **Secondary goal**: Split at logical narrative boundaries so each post can stand alone
   - For high-limit networks: Only split if content has distinct logical sections OR exceeds character limit
   - For low-limit networks: Split as needed but maintain logical groupings within character constraints

4. **CONTENT INTEGRITY**: When splitting occurs:
   - Break at natural story/argument boundaries (complete thoughts, dialogue breaks, topic shifts)
   - Ensure each post tells a coherent part of the story that makes sense independently
   - Add minimal context to post openings when needed for standalone clarity
   - Use "[...]" to indicate truncated quotes or content
   - Preserve the original voice and meaning
   - Make subtle adjustments for flow (e.g., "This was about..." vs "This was meant to be a post about...")

5. **TECHNICAL REQUIREMENTS**:
   - Do NOT add thread numbering (handled automatically)
   - Account for threading indicators being added (already factored into limits above)
   - Maintain proper formatting for each platform

SPLITTING PRINCIPLES EXAMPLE:
For a story about "I tested an AI by asking it the same question twice with opposite biases":
- **Logical grouping**: Post 1 (setup + first question), Post 2 (first response), Post 3 (second question), Post 4 (second response + conclusion)
- **Standalone clarity**: Each post makes sense independently with minimal context
- **Narrative flow**: Complete thoughts, not arbitrary character-based cuts
- **Network adaptation**: Different networks will need different post counts based on their character limits - Mastodon might fit the whole story in 1-2 posts, Threads might need 2-3 posts, Bluesky might need all 4 logical sections as separate posts

IMPORTANT: Post counts vary with content length and complexity. Don't target specific numbers - optimize for each network's character limits and logical narrative structure.

REMEMBER: Balance efficiency (fewer posts) with narrative coherence (logical breaks). Each post should tell a complete part of the story.

Return a JSON object with a "networks" property containing arrays of posts for each network.`
      : `You are a social media content splitter. Split the given text into posts for the specified social networks using the specified strategies.

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
      })) as { response: string | object }

      // Handle AI response - it might be already parsed or need parsing
      let aiResponse: { networks: Record<string, string[]> }
      if (typeof result.response === "string") {
        aiResponse = JSON.parse(result.response)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aiResponse = result.response as any
      }

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
