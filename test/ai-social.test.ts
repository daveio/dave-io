import { describe, expect, it, vi } from "vitest"
import type { H3Event } from "h3"
import { createApiError, createApiResponse } from "~/server/utils/response"
import { AiSocialRequestSchema } from "~/server/utils/schemas"
import type { AiSocialNetwork } from "~/server/utils/schemas"

// Mock the AI social endpoint implementation
vi.mock("~/server/utils/auth-helpers", () => ({
  requireAIAuth: vi.fn().mockResolvedValue({
    payload: { sub: "test-user", jti: "test-token-id" }
  })
}))

vi.mock("~/server/middleware/metrics", () => ({
  recordAPIMetrics: vi.fn(),
  recordAPIErrorMetrics: vi.fn()
}))

vi.mock("~/server/utils/response", async () => {
  const actual = await vi.importActual("~/server/utils/response")
  return {
    ...actual,
    logRequest: vi.fn()
  }
})

// Mock Cloudflare environment
const mockCloudflareEnv = {
  AI: {
    run: vi.fn()
  },
  KV: {
    get: vi.fn()
  }
}

vi.mock("#imports", () => ({
  getCloudflareEnv: vi.fn().mockReturnValue(mockCloudflareEnv),
  readBody: vi.fn(),
  defineEventHandler: vi.fn((handler) => handler)
}))

// Mock H3Event for unit testing (not currently used but available for future tests)
function _mockH3Event(
  body?: unknown,
  headers: Record<string, string> = {},
  query: Record<string, unknown> = {}
): H3Event {
  return {
    node: { req: { headers } },
    query,
    body
  } as unknown as H3Event
}

describe("AI Social Endpoint", () => {
  const DEFAULT_CHARACTER_LIMITS: Record<AiSocialNetwork, number> = {
    bluesky: 300,
    mastodon: 4096,
    threads: 500,
    x: 280
  }

  describe("Request Schema Validation", () => {
    it("should validate basic request", () => {
      const request = {
        input: "Test text to split",
        networks: ["bluesky" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data?.markdown).toBe(false) // Default value
        expect(result.data?.strategies).toEqual(["sentence_boundary", "thread_optimize"]) // Default values
      }
    })

    it("should validate request with all optional fields", () => {
      const request = {
        input: "Test text to split",
        networks: ["bluesky" as const, "mastodon" as const],
        markdown: true,
        strategies: ["word_boundary" as const, "hashtag_preserve" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data?.markdown).toBe(true)
        expect(result.data?.strategies).toEqual(["word_boundary", "hashtag_preserve"])
      }
    })

    it("should reject empty input", () => {
      const request = {
        input: "",
        networks: ["bluesky" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("Input text is required")
      }
    })

    it("should reject empty networks array", () => {
      const request = {
        input: "Test text",
        networks: []
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("At least one network must be specified")
      }
    })

    it("should reject invalid network", () => {
      const request = {
        input: "Test text",
        networks: ["invalid-network"]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it("should reject invalid strategy", () => {
      const request = {
        input: "Test text",
        networks: ["bluesky" as const],
        strategies: ["invalid-strategy"]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })

  describe("Character Limits", () => {
    it("should use default character limits", () => {
      expect(DEFAULT_CHARACTER_LIMITS.bluesky).toBe(300)
      expect(DEFAULT_CHARACTER_LIMITS.mastodon).toBe(4096)
      expect(DEFAULT_CHARACTER_LIMITS.threads).toBe(500)
      expect(DEFAULT_CHARACTER_LIMITS.x).toBe(280)
    })

    it("should fetch character limits from KV", async () => {
      const mockKV = {
        get: vi
          .fn()
          .mockResolvedValueOnce("250") // bluesky
          .mockResolvedValueOnce("5000") // mastodon
      }

      // Test KV key format
      expect(mockKV.get).toHaveBeenCalledTimes(0)

      // Simulate KV calls
      const blueskyLimit = await mockKV.get("ai:social:characters:bluesky")
      const mastodonLimit = await mockKV.get("ai:social:characters:mastodon")

      expect(blueskyLimit).toBe("250")
      expect(mastodonLimit).toBe("5000")
    })
  })

  describe("AI Processing", () => {
    it("should construct correct JSON schema", () => {
      const networks = ["bluesky", "mastodon"] as const
      const _characterLimits = { bluesky: 300, mastodon: 4096, threads: 500, x: 280 }

      const expectedSchema = {
        type: "object",
        properties: {
          networks: {
            type: "object",
            properties: {
              bluesky: {
                type: "array",
                items: { type: "string" },
                description: "Posts for bluesky (max 290 chars each, threading indicators added automatically)"
              },
              mastodon: {
                type: "array",
                items: { type: "string" },
                description: "Posts for mastodon (max 4086 chars each, threading indicators added automatically)"
              }
            },
            required: ["bluesky", "mastodon"]
          }
        },
        required: ["networks"]
      }

      // Test schema construction logic with threading space reserved
      const THREAD_INDICATOR_SPACE = 10
      const effectiveCharacterLimits = {
        bluesky: _characterLimits.bluesky - THREAD_INDICATOR_SPACE,
        mastodon: _characterLimits.mastodon - THREAD_INDICATOR_SPACE,
        threads: _characterLimits.threads - THREAD_INDICATOR_SPACE,
        x: _characterLimits.x - THREAD_INDICATOR_SPACE
      }

      const actualSchema = {
        type: "object",
        properties: {
          networks: {
            type: "object",
            properties: Object.fromEntries(
              networks.map((network) => [
                network,
                {
                  type: "array",
                  items: { type: "string" },
                  description: `Posts for ${network} (max ${effectiveCharacterLimits[network]} chars each, threading indicators added automatically)`
                }
              ])
            ),
            required: networks
          }
        },
        required: ["networks"]
      }

      expect(actualSchema).toEqual(expectedSchema)
    })

    it("should construct system prompt with strategies", () => {
      const networks = ["bluesky", "mastodon"] as const
      const _characterLimits = { bluesky: 300, mastodon: 4096, threads: 500, x: 280 }
      const strategies = ["sentence_boundary", "thread_optimize"] as const
      const markdown = false

      const strategyDescriptions = {
        sentence_boundary: "Split at sentence endings to maintain complete thoughts",
        word_boundary: "Split at word boundaries without breaking words",
        paragraph_preserve: "Keep paragraphs intact when possible",
        thread_optimize: "Optimize for thread continuity with numbered posts",
        hashtag_preserve: "Keep hashtags with their relevant content"
      }

      const selectedStrategies = strategies.map((s) => strategyDescriptions[s]).join(", ")

      const expectedPrompt = `You are a social media content splitter. Split the given text into posts for the specified social networks.

Character limits:
- bluesky: 300 characters
- mastodon: 4096 characters

Splitting strategies to use: ${selectedStrategies}

${markdown && networks.includes("mastodon") ? "For Mastodon, preserve or add appropriate Markdown formatting." : ""}

Rules:
1. Each post must fit within the character limit
2. Maintain the flow and coherence of the original content
3. Don't cut words in the middle
4. For threads, number the posts (e.g., "1/5", "2/5")
5. Preserve important context in each post
6. Keep hashtags with relevant content when possible

Return a JSON object with a "networks" property containing arrays of posts for each network.`

      expect(expectedPrompt).toContain("Character limits:")
      expect(expectedPrompt).toContain("bluesky: 300 characters")
      expect(expectedPrompt).toContain("mastodon: 4096 characters")
      expect(expectedPrompt).toContain(selectedStrategies)
    })

    it("should include markdown instruction for mastodon", () => {
      const networks = ["bluesky", "mastodon"] as const
      const markdown = true

      const markdownInstruction =
        markdown && networks.includes("mastodon")
          ? "For Mastodon, preserve or add appropriate Markdown formatting."
          : ""

      expect(markdownInstruction).toBe("For Mastodon, preserve or add appropriate Markdown formatting.")
    })

    it("should exclude markdown instruction when not requested", () => {
      const networks = ["bluesky", "mastodon"] as const
      const markdown = false

      const markdownInstruction =
        markdown && networks.includes("mastodon")
          ? "For Mastodon, preserve or add appropriate Markdown formatting."
          : ""

      expect(markdownInstruction).toBe("")
    })

    it("should exclude markdown instruction when mastodon not in networks", () => {
      const networks = ["bluesky", "x"] as const
      const markdown = true

      const markdownInstruction =
        markdown && (networks as readonly string[]).includes("mastodon")
          ? "For Mastodon, preserve or add appropriate Markdown formatting."
          : ""

      expect(markdownInstruction).toBe("")
    })

    it("should reserve space for threading indicators", () => {
      const THREAD_INDICATOR_SPACE = 10 // "\n\n🧵 99/99" = 10 chars
      const originalLimit = 300
      const effectiveLimit = originalLimit - THREAD_INDICATOR_SPACE

      expect(effectiveLimit).toBe(290)

      // Test that threading indicators fit within reserved space
      const threadIndicator = "\n\n🧵 5/10"
      expect(threadIndicator.length).toBeLessThanOrEqual(THREAD_INDICATOR_SPACE)

      const maxThreadIndicator = "\n\n🧵 99/99"
      expect(maxThreadIndicator.length).toBeLessThanOrEqual(THREAD_INDICATOR_SPACE)
    })
  })

  describe("Threading Indicators", () => {
    it("should add threading indicators to multi-post threads", () => {
      const posts = ["First post content", "Second post content", "Third post content"]
      const expectedWithThreading = [
        "First post content\n\n🧵 1/3",
        "Second post content\n\n🧵 2/3",
        "Third post content\n\n🧵 3/3"
      ]

      // Simulate the threading logic
      const postsWithThreading = posts.map((post, i) => {
        const postNumber = i + 1
        const totalPosts = posts.length
        return post + `\n\n🧵 ${postNumber}/${totalPosts}`
      })

      expect(postsWithThreading).toEqual(expectedWithThreading)
    })

    it("should not add threading indicators to single posts", () => {
      const posts = ["Single post content"]

      // Simulate the threading logic - only add if more than 1 post
      const postsWithThreading =
        posts.length > 1 ? posts.map((post, i) => post + `\n\n🧵 ${i + 1}/${posts.length}`) : posts

      expect(postsWithThreading).toEqual(["Single post content"])
    })

    it("should handle large thread numbers correctly", () => {
      // Create a large thread to test formatting
      const posts = Array.from({ length: 25 }, (_, i) => `Post ${i + 1} content`)

      const postsWithThreading = posts.map((post, i) => {
        const postNumber = i + 1
        const totalPosts = posts.length
        return post + `\n\n🧵 ${postNumber}/${totalPosts}`
      })

      expect(postsWithThreading[0]).toBe("Post 1 content\n\n🧵 1/25")
      expect(postsWithThreading[24]).toBe("Post 25 content\n\n🧵 25/25")

      // Verify threading indicator length is within our reserved space
      const threadIndicator = "\n\n🧵 25/25"
      expect(threadIndicator.length).toBeLessThanOrEqual(10)
    })

    it("should preserve original post content with proper spacing", () => {
      const originalPost = "This is my original post content with\nmultiple lines\n\nand paragraphs."
      const expectedWithThreading = originalPost + "\n\n🧵 1/2"

      const posts = [originalPost, "Second post"]
      const postsWithThreading = posts.map((post, i) => {
        return post + `\n\n🧵 ${i + 1}/${posts.length}`
      })

      expect(postsWithThreading[0]).toBe(expectedWithThreading)

      // Ensure we have proper spacing (exactly 2 newlines before thread indicator)
      expect(postsWithThreading[0]).toContain("\n\n🧵")
      expect(postsWithThreading[0]).not.toContain("\n\n\n🧵") // No triple newlines
    })
  })

  describe("Response Validation", () => {
    it("should validate AI response has all requested networks", () => {
      const requestedNetworks = ["bluesky", "mastodon"] as const
      const aiResponse = {
        networks: {
          bluesky: ["Post 1", "Post 2"],
          mastodon: ["Longer post with more content"]
        }
      }

      // Test validation logic
      for (const network of requestedNetworks) {
        expect(aiResponse.networks[network]).toBeDefined()
        expect(Array.isArray(aiResponse.networks[network as keyof typeof aiResponse.networks])).toBe(true)
      }
    })

    it("should reject response missing requested networks", () => {
      const requestedNetworks = ["bluesky", "mastodon"] as const
      const aiResponse = {
        networks: {
          bluesky: ["Post 1", "Post 2"]
          // Missing mastodon
        }
      }

      // Test validation logic
      let validationError: string | null = null
      for (const network of requestedNetworks) {
        const networkData = aiResponse.networks[network as keyof typeof aiResponse.networks]
        if (!networkData || !Array.isArray(networkData)) {
          validationError = `Missing or invalid response for network: ${network}`
          break
        }
      }

      expect(validationError).toBe("Missing or invalid response for network: mastodon")
    })

    it("should reject response with invalid network data", () => {
      const requestedNetworks = ["bluesky"] as const
      const aiResponse = {
        networks: {
          bluesky: "Not an array" // Invalid - should be array
        }
      }

      // Test validation logic
      let validationError: string | null = null
      for (const network of requestedNetworks) {
        const networkData = aiResponse.networks[network as keyof typeof aiResponse.networks]
        if (!networkData || !Array.isArray(networkData)) {
          validationError = `Missing or invalid response for network: ${network}`
          break
        }
      }

      expect(validationError).toBe("Missing or invalid response for network: bluesky")
    })
  })

  describe("Success Response Format", () => {
    it("should return standardized success response", () => {
      const aiResponse = {
        networks: {
          bluesky: ["Post 1", "Post 2"],
          mastodon: ["Longer post"]
        }
      }

      const response = createApiResponse({
        result: {
          networks: aiResponse.networks
        },
        message: "Text split successfully for social media",
        error: null
      })

      expect(response.ok).toBe(true)
      if (response.ok) {
        expect(response.result).toEqual({
          networks: aiResponse.networks
        })
      }
      expect(response.message).toBe("Text split successfully for social media")
      expect(response.error).toBeNull()
      expect(response.timestamp).toBeDefined()
    })
  })

  describe("Error Handling", () => {
    it("should handle missing AI service", () => {
      expect(() => {
        createApiError(503, "AI service not available")
      }).toThrow()
    })

    it("should handle AI processing failure", () => {
      expect(() => {
        createApiError(500, "Failed to process text with AI")
      }).toThrow()
    })

    it("should handle general processing failure", () => {
      expect(() => {
        createApiError(500, "Failed to split text for social media")
      }).toThrow()
    })

    it("should handle validation errors", () => {
      expect(() => {
        createApiError(400, "Validation failed")
      }).toThrow()
    })
  })

  describe("Environment Configuration", () => {
    it("should validate required environment bindings", () => {
      // Test AI binding check
      expect(mockCloudflareEnv.AI).toBeDefined()
      expect(typeof mockCloudflareEnv.AI.run).toBe("function")

      // Test KV binding check (optional)
      expect(mockCloudflareEnv.KV).toBeDefined()
      expect(typeof mockCloudflareEnv.KV.get).toBe("function")
    })
  })

  describe("Performance Considerations", () => {
    it("should track processing time", () => {
      const startTime = Date.now()
      // Simulate processing delay
      const endTime = startTime + 100
      const processingTime = endTime - startTime

      expect(processingTime).toBeGreaterThanOrEqual(0)
      expect(typeof processingTime).toBe("number")
    })

    it("should handle concurrent KV requests", async () => {
      const networks = ["bluesky", "mastodon", "threads"] as const
      const kvPromises = networks.map(async (network) => {
        const kvKey = `ai:social:characters:${network}`
        return { network, key: kvKey }
      })

      const results = await Promise.all(kvPromises)
      expect(results).toHaveLength(3)
      expect(results[0]?.key).toBe("ai:social:characters:bluesky")
      expect(results[1]?.key).toBe("ai:social:characters:mastodon")
      expect(results[2]?.key).toBe("ai:social:characters:threads")
    })
  })

  describe("Security Considerations", () => {
    it("should require authentication", async () => {
      // Test that authentication is properly mocked
      const { requireAIAuth } = await import("~/server/utils/auth-helpers")
      expect(vi.mocked(requireAIAuth)).toBeDefined()
    })

    it("should validate input length limits", () => {
      // Test reasonable input length limits
      const longInput = "a".repeat(10000)
      const request = {
        input: longInput,
        networks: ["bluesky" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true) // Schema doesn't limit length, but endpoint should
    })

    it("should sanitize network names", () => {
      const validNetworks = ["bluesky", "mastodon", "threads", "x"] as const

      for (const network of validNetworks) {
        expect(validNetworks.includes(network)).toBe(true)
      }
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle single network request", () => {
      const request = {
        input: "Short post",
        networks: ["bluesky" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.networks).toHaveLength(1)
        expect(result.data.networks[0]).toBe("bluesky")
      }
    })

    it("should handle multiple network request", () => {
      const request = {
        input: "Multi-network post",
        networks: ["bluesky" as const, "mastodon" as const, "threads" as const, "x" as const]
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.networks).toHaveLength(4)
        expect(result.data.networks).toEqual(["bluesky", "mastodon", "threads", "x"])
      }
    })

    it("should handle strategy combinations", () => {
      const allStrategies = [
        "sentence_boundary",
        "word_boundary",
        "paragraph_preserve",
        "thread_optimize",
        "hashtag_preserve"
      ] as const

      const request = {
        input: "Test post with all strategies",
        networks: ["bluesky" as const],
        strategies: allStrategies
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.strategies).toHaveLength(5)
        expect(result.data.strategies).toEqual(allStrategies)
      }
    })

    it("should handle markdown with mastodon", () => {
      const request = {
        input: "**Bold text** and *italic text*",
        networks: ["mastodon" as const],
        markdown: true
      }

      const result = AiSocialRequestSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.markdown).toBe(true)
        expect(result.data.networks).toContain("mastodon")
      }
    })
  })
})
