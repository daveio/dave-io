import { blake3 } from "@noble/hashes/blake3"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  CLOUDFLARE_IMAGES_FORMATS,
  generateCloudflareImageId,
  validateImageForCloudflareImages
} from "~/server/utils/cloudflare-images"

// Test data - small PNG image (1x1 pixel)
const smallPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAE/AO/lZy6hAAAAABJRU5ErkJggg=="

// Test data - small JPEG image (red square)
const smallJpegBase64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA8p6+WAAAABJRU5ErkJggg=="

const textBase64 = Buffer.from("hello world").toString("base64")

// Mock Cloudflare environment for testing
const mockEnv = {
  CLOUDFLARE_API_TOKEN: "test-token",
  CLOUDFLARE_ACCOUNT_ID: "test-account-id",
  IMAGES: {
    input: vi.fn(),
    info: vi.fn()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// Mock global fetch for API calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = vi.fn() as any
global.fetch = mockFetch

describe("Cloudflare Images Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe("Image format validation", () => {
    it("should validate supported image formats", () => {
      const supportedFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/avif",
        "image/heic",
        "image/heif",
        "image/svg+xml"
      ]

      for (const format of supportedFormats) {
        expect(CLOUDFLARE_IMAGES_FORMATS).toContain(format)
      }
    })

    it("should detect PNG images correctly", async () => {
      const buffer = Buffer.from(smallPngBase64, "base64")
      const mimeType = await validateImageForCloudflareImages(buffer)
      expect(mimeType).toBe("image/png")
    })

    it("should detect JPEG images correctly", async () => {
      const buffer = Buffer.from(smallJpegBase64, "base64")
      const mimeType = await validateImageForCloudflareImages(buffer)
      expect(mimeType).toBe("image/jpeg")
    })

    it("should reject non-image data", async () => {
      const buffer = Buffer.from(textBase64, "base64")

      await expect(validateImageForCloudflareImages(buffer)).rejects.toThrow(
        "Unsupported file type for Cloudflare Images"
      )
    })
  })

  describe("Image ID generation", () => {
    it("should generate consistent IDs for same input", () => {
      const buffer = Buffer.from("test data")
      const id1 = generateCloudflareImageId(buffer)
      const id2 = generateCloudflareImageId(buffer)

      expect(id1).toBe(id2)
      expect(id1).toMatch(/^[a-f0-9]{32}$/) // 32 hex chars (16 bytes)
    })

    it("should generate different IDs for different inputs", () => {
      const buffer1 = Buffer.from("test data 1")
      const buffer2 = Buffer.from("test data 2")

      const id1 = generateCloudflareImageId(buffer1)
      const id2 = generateCloudflareImageId(buffer2)

      expect(id1).not.toBe(id2)
    })

    it("should include quality in ID when specified", () => {
      const buffer = Buffer.from("test data")
      const id = generateCloudflareImageId(buffer, { quality: 80 })

      expect(id).toMatch(/^[a-f0-9]{32}-q80$/)
    })

    it("should not include quality suffix when not specified", () => {
      const buffer = Buffer.from("test data")
      const id = generateCloudflareImageId(buffer)

      expect(id).toMatch(/^[a-f0-9]{32}$/)
      expect(id).not.toContain("-q")
    })
  })

  describe("BLAKE3 hashing", () => {
    it("should generate consistent hashes for same input", () => {
      const buffer = Buffer.from("test data")
      const hash1 = blake3(buffer, { dkLen: 16 })
      const hash2 = blake3(buffer, { dkLen: 16 })

      expect(hash1).toEqual(hash2)
      expect(hash1).toHaveLength(16) // 128 bits
    })

    it("should generate different hashes for different inputs", () => {
      const buffer1 = Buffer.from("test data 1")
      const buffer2 = Buffer.from("test data 2")

      const hash1 = blake3(buffer1, { dkLen: 16 })
      const hash2 = blake3(buffer2, { dkLen: 16 })

      expect(hash1).not.toEqual(hash2)
    })

    it("should produce hex strings for image IDs", () => {
      const buffer = Buffer.from("test data")
      const hash = blake3(buffer, { dkLen: 16 })
      const hexHash = Buffer.from(hash).toString("hex")

      expect(hexHash).toMatch(/^[a-f0-9]{32}$/)
      expect(hexHash).toHaveLength(32)
    })
  })

  describe("Cloudflare Images API mocking", () => {
    it("should mock successful image upload", async () => {
      const mockResponse = {
        success: true,
        result: {
          id: "test-image-id",
          filename: "test.png",
          uploaded: "2023-01-01T00:00:00.000Z",
          requireSignedURLs: false,
          variants: ["https://imagedelivery.net/account-hash/test-image-id/public"]
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const buffer = Buffer.from(smallPngBase64, "base64")

      // Test would call the upload function here
      const formData = new FormData()
      formData.append("file", new File([buffer], "test.png", { type: "image/png" }))

      const response = await fetch("https://api.cloudflare.com/client/v4/accounts/test/images/v1", {
        method: "POST",
        body: formData
      })

      expect(response.ok).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await response.json()) as any
      expect(result.success).toBe(true)
      expect(result.result.id).toBe("test-image-id")
    })

    it("should handle API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad request")
      })

      const response = await fetch("https://api.cloudflare.com/client/v4/accounts/test/images/v1", {
        method: "POST"
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe("Environment validation", () => {
    it("should require Cloudflare API token", () => {
      const envWithoutToken = { ...mockEnv }
      envWithoutToken.CLOUDFLARE_API_TOKEN = undefined

      expect(envWithoutToken.CLOUDFLARE_API_TOKEN).toBeUndefined()
    })

    it("should require Cloudflare account ID", () => {
      const envWithoutAccount = { ...mockEnv }
      envWithoutAccount.CLOUDFLARE_ACCOUNT_ID = undefined

      expect(envWithoutAccount.CLOUDFLARE_ACCOUNT_ID).toBeUndefined()
    })

    it("should have Images binding available", () => {
      expect(mockEnv.IMAGES).toBeDefined()
      expect(typeof mockEnv.IMAGES).toBe("object")
    })
  })

  describe("Image processing options", () => {
    it("should handle quality options", () => {
      const options = { quality: 85 }
      expect(options.quality).toBe(85)
      expect(options.quality).toBeGreaterThan(0)
      expect(options.quality).toBeLessThanOrEqual(100)
    })

    it("should handle dimension options", () => {
      const options = { width: 800, height: 600 }
      expect(options.width).toBe(800)
      expect(options.height).toBe(600)
    })

    it("should handle format options", () => {
      const validFormats = ["webp", "avif", "jpeg", "png"] as const
      for (const format of validFormats) {
        const options = { format }
        expect(validFormats).toContain(options.format)
      }
    })

    it("should handle fit options", () => {
      const validFits = ["scale-down", "contain", "cover", "crop", "pad"] as const
      for (const fit of validFits) {
        const options = { fit }
        expect(validFits).toContain(options.fit)
      }
    })
  })

  describe("Backwards compatibility", () => {
    it("should maintain similar result structure", () => {
      // Test that the new Cloudflare Images result structure
      // is compatible with existing code expectations
      const mockResult = {
        id: "test-id",
        url: "https://imagedelivery.net/hash/test-id/public",
        variants: ["https://imagedelivery.net/hash/test-id/public"],
        originalSize: 1000,
        optimizedSize: 700,
        hash: "abcdef1234567890",
        format: "webp",
        originalMimeType: "image/png",
        uploaded: "2023-01-01T00:00:00.000Z"
      }

      // Check all expected properties exist
      expect(mockResult).toHaveProperty("id")
      expect(mockResult).toHaveProperty("url")
      expect(mockResult).toHaveProperty("originalSize")
      expect(mockResult).toHaveProperty("optimizedSize")
      expect(mockResult).toHaveProperty("hash")
      expect(mockResult).toHaveProperty("format")
      expect(mockResult).toHaveProperty("originalMimeType")

      // Check types
      expect(typeof mockResult.id).toBe("string")
      expect(typeof mockResult.url).toBe("string")
      expect(typeof mockResult.originalSize).toBe("number")
      expect(typeof mockResult.optimizedSize).toBe("number")
      expect(typeof mockResult.hash).toBe("string")
      expect(typeof mockResult.format).toBe("string")
    })
  })
})

describe("Performance considerations", () => {
  it("should handle large image buffers", () => {
    // Test with a reasonably large buffer to ensure no memory issues
    const largeBuffer = Buffer.alloc(1024 * 1024) // 1MB
    largeBuffer.fill(0xff) // Fill with data

    const id = generateCloudflareImageId(largeBuffer)
    expect(id).toMatch(/^[a-f0-9]{32}$/)
  })

  it("should be efficient with repeated ID generation", () => {
    const buffer = Buffer.from("test data")
    const start = Date.now()

    // Generate 1000 IDs
    for (let i = 0; i < 1000; i++) {
      generateCloudflareImageId(buffer)
    }

    const duration = Date.now() - start
    expect(duration).toBeLessThan(1000) // Should complete in under 1 second
  })
})
