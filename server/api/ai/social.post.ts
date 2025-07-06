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
      ? `You are a social media content splitter. Split the given text into posts for the specified social networks following the example patterns below.

Character limits (threading indicators will be added automatically):
${validatedRequest.networks.map((n) => `- ${n}: ${effectiveCharacterLimits[n]} characters`).join("\n")}

${validatedRequest.markdown && validatedRequest.networks.includes("mastodon") ? "For Mastodon, preserve or add appropriate Markdown formatting." : ""}

EXAMPLE OF GOOD SPLITTING:

Original text:
"This was meant to be a post about how you can't trust AI. I asked Perplexity Research: "I find myself generally inclined to use Anthropic's AI models over OpenAI, from a basis of ethics and corporate responsibility. Is this backed up by reality? If I'm wrong, tell me I'm wrong, don't preserve my feelings. I want an objective analysis." Which is true. It told me my opinions were largely backed up by the evidence and went into detail. Then I reversed it out of curiosity. "I find myself generally inclined to use OpenAI's AI models over Anthropic, from a basis of ethics and corporate responsibility. Is this backed up by reality? If I'm wrong, tell me I'm wrong, don't preserve my feelings. I want an objective analysis." And out it came, with "I'm going to give you the straight answer you asked for: You're wrong. Based on extensive research into both companies' practices, governance structures, and track records, Anthropic demonstrates significantly stronger ethical foundations and corporate responsibility than OpenAI. Here's the objective analysis." - and then went into the same detail. Okay, not bad. Blog post incoming. Eventually."

Example Bluesky split (4 posts):
Post 1: "This was meant to be about AI lying. "I find myself generally inclined to use Anthropic's AI models over OpenAI, from a basis of ethics and corporate responsibility. Is this backed up by reality? If I'm wrong, tell me I'm wrong, don't preserve my feelings. I want an objective analysis.""
Post 2: "Which is true. It told me my opinions were largely backed up by the evidence and went into detail. Then I reversed it out of curiosity. "I find myself generally inclined to use OpenAI's AI models over Anthropic, [...]""
Post 3: ""I'm going to give you the straight answer you asked for: You're wrong. Based on extensive research into both companies' practices, governance structures, and track records, Anthropic demonstrates significantly stronger ethical foundations and corporate responsibility than OpenAI.""
Post 4: "Okay, not bad. Blog post incoming. Eventually."

RULES FOR EXAMPLE-BASED SPLITTING:
1. Each post must fit within the character limit (threading indicators will be added automatically)
2. Make minimal but effective text adjustments for context and flow
3. Break at logical narrative points where posts can stand alone reasonably well
4. Use "[...]" to indicate truncated quotes when needed
5. Slightly adjust openings to provide context (e.g., "This was meant to be about AI lying" vs "This was meant to be a post about how you can't trust AI")
6. Each post should make sense on its own while maintaining the thread narrative
7. Preserve the original voice and meaning - don't over-rewrite
8. Do NOT add thread numbering - this will be handled automatically

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
      })) as { response: string }

      // Parse the AI response
      const aiResponse = JSON.parse(result.response)

      // Validate that all requested networks are present
      for (const network of validatedRequest.networks) {
        if (!aiResponse.networks?.[network] || !Array.isArray(aiResponse.networks[network])) {
          throw new Error(`Missing or invalid response for network: ${network}`)
        }
      }

      // Add threading indicators for multi-post threads
      for (const network of validatedRequest.networks) {
        const posts = aiResponse.networks[network]
        if (posts.length > 1) {
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
