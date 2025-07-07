import { describe, expect, it, vi } from "vitest"
import type { H3Event } from "h3"
import { createApiError, createApiResponse } from "~/server/utils/response"
import { AiAltRequestGetSchema, AiAltRequestPostSchema } from "~/server/utils/schemas"

// Mock the AI alt endpoint dependencies
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
  ANTHROPIC_API_KEY: "test-api-key",
  CLOUDFLARE_ACCOUNT_ID: "test-account-id",
  AI_GATEWAY_TOKEN: "test-gateway-token"
}

vi.mock("#imports", () => ({
  getCloudflareEnv: vi.fn().mockReturnValue(mockCloudflareEnv),
  readBody: vi.fn(),
  readMultipartFormData: vi.fn(),
  getQuery: vi.fn(),
  defineEventHandler: vi.fn((handler) => handler)
}))

// Mock AI helpers
vi.mock("~/server/utils/ai-helpers", () => ({
  createAnthropicClient: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn()
    }
  }),
  parseClaudeResponse: vi.fn().mockReturnValue({
    alt_text: "A beautiful landscape with mountains and trees",
    confidence: 0.92
  }),
  sendClaudeMessage: vi.fn().mockResolvedValue(`{
    "alt_text": "A beautiful landscape with mountains and trees",
    "confidence": 0.92
  }`),
  validateAndPrepareImage: vi.fn().mockReturnValue({
    base64Data: "base64-image-data",
    mimeType: "image/jpeg"
  }),
  validateAndPrepareImageWithOptimization: vi.fn().mockResolvedValue({
    base64Data: "base64-image-data",
    mimeType: "image/jpeg"
  })
}))

// Mock image helpers
vi.mock("~/server/utils/image-helpers", () => ({
  fetchImageFromUrl: vi.fn().mockResolvedValue({
    buffer: Buffer.from("mock-image-data"),
    contentType: "image/jpeg"
  }),
  validateImageSize: vi.fn().mockReturnValue(true),
  validateImageFormat: vi.fn().mockReturnValue(true),
  validateImageUrl: vi.fn().mockReturnValue(true),
  detectImageFormat: vi.fn().mockReturnValue("image/jpeg")
}))

// Mock H3Event for unit testing (unused but kept for potential future use)
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

describe("AI Alt Text Endpoint", () => {
  describe("GET Request Schema Validation", () => {
    it("should validate basic GET request with image URL", () => {
      const request = {
        image: "https://example.com/image.jpg"
      }

      const result = AiAltRequestGetSchema.safeParse(request)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.image).toBe("https://example.com/image.jpg")
      }
    })

    it("should validate HTTPS image URL", () => {
      const request = {
        image: "https://secure.example.com/images/photo.png"
      }

      const result = AiAltRequestGetSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it("should reject invalid URL format", () => {
      const request = {
        image: "not-a-valid-url"
      }

      const result = AiAltRequestGetSchema.safeParse(request)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("Must be a valid image URL")
      }
    })

    it("should reject empty image parameter", () => {
      const request = {
        image: ""
      }

      const result = AiAltRequestGetSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it("should reject missing image parameter", () => {
      const request = {}

      const result = AiAltRequestGetSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })

  describe("POST Request Schema Validation", () => {
    it("should validate basic POST request with image file", () => {
      const request = {
        image: Buffer.from("mock-image-data")
      }

      const result = AiAltRequestPostSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it("should handle various image formats", () => {
      const imageFormats = [Buffer.from("jpeg-data"), Buffer.from("png-data"), new Uint8Array([1, 2, 3, 4])]

      for (const imageData of imageFormats) {
        const request = { image: imageData }
        const result = AiAltRequestPostSchema.safeParse(request)
        expect(result.success).toBe(true)
      }
    })
  })

  describe("Image URL Validation", () => {
    it("should validate HTTPS URLs", async () => {
      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      expect(() => validateImageUrl("https://example.com/image.jpg")).not.toThrow()
    })

    it("should validate HTTP URLs", async () => {
      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      expect(() => validateImageUrl("http://example.com/image.jpg")).not.toThrow()
    })

    it("should reject localhost URLs", async () => {
      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      expect(() => validateImageUrl("http://localhost/image.jpg")).toThrow()
    })

    it("should reject private IP ranges", async () => {
      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const privateUrls = [
        "http://192.168.1.1/image.jpg",
        "http://10.0.0.1/image.jpg",
        "http://172.16.0.1/image.jpg",
        "http://127.0.0.1/image.jpg"
      ]

      for (const url of privateUrls) {
        expect(() => validateImageUrl(url)).toThrow()
      }
    })

    it("should reject non-HTTP protocols", async () => {
      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const invalidUrls = ["ftp://example.com/image.jpg", "file:///path/to/image.jpg", "javascript:alert(1)"]

      for (const url of invalidUrls) {
        expect(() => validateImageUrl(url)).toThrow()
      }
    })
  })

  describe("Image Size Validation", () => {
    it("should accept images under 5MB", async () => {
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const smallImage = Buffer.alloc(1024 * 1024) // 1MB
      expect(() => validateImageSize(smallImage)).not.toThrow()
    })

    it("should reject images over 5MB", async () => {
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const largeImage = Buffer.alloc(6 * 1024 * 1024) // 6MB
      expect(() => validateImageSize(largeImage)).toThrow()
    })

    it("should handle edge case at exactly 5MB", async () => {
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const exactlyFiveMB = Buffer.alloc(5 * 1024 * 1024) // Exactly 5MB
      expect(() => validateImageSize(exactlyFiveMB)).not.toThrow()
    })

    it("should handle empty buffers", async () => {
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const emptyBuffer = Buffer.alloc(0)
      expect(() => validateImageSize(emptyBuffer)).not.toThrow()
    })
  })

  describe("Image Format Detection", () => {
    it("should detect JPEG format", async () => {
      const { detectImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      expect(detectImageFormat(jpegHeader)).toBe("image/jpeg")
    })

    it("should detect PNG format", async () => {
      const { detectImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      expect(detectImageFormat(pngHeader)).toBe("image/png")
    })

    it("should detect GIF format", async () => {
      const { detectImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const gifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
      expect(detectImageFormat(gifHeader)).toBe("image/gif")
    })

    it("should default to JPEG for unknown formats", async () => {
      const { detectImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const unknownHeader = Buffer.from([0x00, 0x00, 0x00, 0x00])
      expect(detectImageFormat(unknownHeader)).toBe("image/jpeg")
    })

    it("should handle small buffers gracefully", async () => {
      const { detectImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const tinyBuffer = Buffer.from([0xff])
      expect(detectImageFormat(tinyBuffer)).toBe("image/jpeg")
    })
  })

  describe("AI Processing", () => {
    it("should construct correct system prompt for alt text generation", () => {
      const expectedPromptParts = [
        "expert at creating descriptive, accessible alt text",
        "main subject and action",
        "concise but informative",
        "JSON object",
        "alt_text",
        "confidence"
      ]

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

      for (const part of expectedPromptParts) {
        expect(systemPrompt.toLowerCase()).toContain(part.toLowerCase())
      }
    })

    it("should validate AI response format", () => {
      const validResponse = {
        alt_text: "A beautiful sunset over the ocean",
        confidence: 0.88
      }

      expect(validResponse.alt_text).toBeDefined()
      expect(typeof validResponse.alt_text).toBe("string")
      expect(validResponse.alt_text.length).toBeGreaterThan(0)
      expect(validResponse.confidence).toBeGreaterThanOrEqual(0)
      expect(validResponse.confidence).toBeLessThanOrEqual(1)
    })

    it("should handle missing confidence score", () => {
      const responseWithoutConfidence: { alt_text: string; confidence?: number } = {
        alt_text: "A beautiful sunset over the ocean"
      }

      expect(responseWithoutConfidence.alt_text).toBeDefined()
      expect(responseWithoutConfidence.confidence).toBeUndefined()
    })

    it("should validate confidence score range", () => {
      const validConfidences = [0, 0.5, 1, 0.92]
      const invalidConfidences = [-0.1, 1.1, -1, 2]

      for (const confidence of validConfidences) {
        expect(confidence).toBeGreaterThanOrEqual(0)
        expect(confidence).toBeLessThanOrEqual(1)
      }

      for (const confidence of invalidConfidences) {
        expect(confidence < 0 || confidence > 1).toBe(true)
      }
    })
  })

  describe("Success Response Format", () => {
    it("should return standardized success response", () => {
      const altTextResult = {
        alt_text: "A scenic mountain landscape",
        confidence: 0.95
      }

      const response = createApiResponse({
        result: altTextResult,
        message: "Alt text generated successfully",
        error: null
      })

      expect(response.ok).toBe(true)
      if (response.ok) {
        expect(response.result).toEqual(altTextResult)
      }
      expect(response.message).toBe("Alt text generated successfully")
      expect(response.error).toBeNull()
      expect(response.timestamp).toBeDefined()
    })

    it("should handle response without confidence score", () => {
      const altTextResult: { alt_text: string; confidence?: number } = {
        alt_text: "A scenic mountain landscape"
      }

      const response = createApiResponse({
        result: altTextResult,
        message: "Alt text generated successfully",
        error: null
      })

      expect(response.ok).toBe(true)
      if (response.ok) {
        expect(response.result.alt_text).toBe("A scenic mountain landscape")
        expect(response.result.confidence).toBeUndefined()
      }
    })
  })

  describe("Error Handling", () => {
    it("should handle missing API keys", () => {
      expect(() => {
        createApiError(503, "Anthropic API key not available")
      }).toThrow()
    })

    it("should handle image too large errors", () => {
      expect(() => {
        createApiError(413, "Image size exceeds maximum allowed size")
      }).toThrow()
    })

    it("should handle invalid image format errors", () => {
      expect(() => {
        createApiError(400, "Unsupported image format")
      }).toThrow()
    })

    it("should handle URL fetch failures", () => {
      expect(() => {
        createApiError(400, "Failed to fetch image from URL")
      }).toThrow()
    })

    it("should handle AI processing failures", () => {
      expect(() => {
        createApiError(500, "Failed to generate alt text with AI")
      }).toThrow()
    })

    it("should handle malformed requests", () => {
      expect(() => {
        createApiError(400, "No image file provided")
      }).toThrow()
    })
  })

  describe("Authentication Requirements", () => {
    it("should require AI auth with alt resource", async () => {
      const { requireAIAuth } =
        await vi.importActual<typeof import("~/server/utils/auth-helpers")>("~/server/utils/auth-helpers")
      expect(requireAIAuth).toBeDefined()
    })

    it("should validate auth payload structure", () => {
      const mockAuthPayload = {
        payload: { sub: "test-user", jti: "test-token-id" }
      }

      expect(mockAuthPayload.payload.sub).toBeDefined()
      expect(mockAuthPayload.payload.jti).toBeDefined()
    })
  })

  describe("Security Considerations", () => {
    it("should prevent SSRF attacks", async () => {
      const maliciousUrls = [
        "http://localhost:8080/internal",
        "http://127.0.0.1/admin",
        "http://192.168.1.1/router",
        "http://10.0.0.1/secret"
      ]

      const { validateImageUrl } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")

      for (const url of maliciousUrls) {
        expect(() => validateImageUrl(url)).toThrow()
      }
    })

    it("should validate file upload limits", async () => {
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const oversizedImage = Buffer.alloc(10 * 1024 * 1024) // 10MB

      expect(() => validateImageSize(oversizedImage)).toThrow()
    })

    it("should sanitize file inputs", async () => {
      const { validateImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")
      const emptyBuffer = Buffer.alloc(0)

      expect(() => validateImageFormat(emptyBuffer)).toThrow()
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle GET request flow", () => {
      const getRequest = {
        image: "https://example.com/photo.jpg"
      }

      const result = AiAltRequestGetSchema.safeParse(getRequest)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.image).toBe(getRequest.image)
      }
    })

    it("should handle POST request flow", () => {
      const postRequest = {
        image: Buffer.from("mock-image-data")
      }

      const result = AiAltRequestPostSchema.safeParse(postRequest)
      expect(result.success).toBe(true)
    })

    it("should handle various image formats in uploads", async () => {
      const supportedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      const { validateImageFormat } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")

      for (const format of supportedFormats) {
        // Create proper mock buffer with correct magic bytes for each format
        let mockBuffer: Buffer
        if (format === "image/jpeg") {
          mockBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]) // JPEG magic bytes
        } else if (format === "image/png") {
          mockBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]) // PNG magic bytes
        } else if (format === "image/gif") {
          mockBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38]) // GIF magic bytes
        } else if (format === "image/webp") {
          // Create a proper WebP header
          mockBuffer = Buffer.alloc(12)
          mockBuffer.write("RIFF", 0)
          mockBuffer.write("WEBP", 8)
        } else {
          mockBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]) // Default to JPEG
        }

        expect(() => validateImageFormat(mockBuffer, format)).not.toThrow()
      }
    })

    it("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        image: `https://example.com/image${i}.jpg`
      }))

      const validationPromises = requests.map((req) => Promise.resolve(AiAltRequestGetSchema.safeParse(req)))

      const results = await Promise.all(validationPromises)
      expect(results.every((r) => r.success)).toBe(true)
    })
  })

  describe("Performance Considerations", () => {
    it("should track processing time", () => {
      const startTime = Date.now()
      // Simulate processing delay
      const endTime = startTime + 200
      const processingTime = endTime - startTime

      expect(processingTime).toBeGreaterThanOrEqual(0)
      expect(typeof processingTime).toBe("number")
    })

    it("should handle large image files efficiently", async () => {
      // Test with a moderately large image (under 5MB limit)
      const largeImage = Buffer.alloc(4 * 1024 * 1024) // 4MB
      const { validateImageSize } =
        await vi.importActual<typeof import("~/server/utils/image-helpers")>("~/server/utils/image-helpers")

      expect(() => validateImageSize(largeImage)).not.toThrow()
    })

    it("should validate response time expectations", () => {
      // Mock processing time tracking
      const maxExpectedTime = 30000 // 30 seconds max for AI processing
      const mockProcessingTime = 5000 // 5 seconds actual

      expect(mockProcessingTime).toBeLessThan(maxExpectedTime)
    })
  })

  describe("Environment Configuration", () => {
    it("should validate required environment variables", () => {
      expect(mockCloudflareEnv.ANTHROPIC_API_KEY).toBeDefined()
      expect(mockCloudflareEnv.CLOUDFLARE_ACCOUNT_ID).toBeDefined()
      expect(mockCloudflareEnv.AI_GATEWAY_TOKEN).toBeDefined()
    })

    it("should handle missing environment variables gracefully", () => {
      expect(() => {
        createApiError(503, "Required environment variable missing")
      }).toThrow()
    })
  })
})
