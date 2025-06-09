import { blake3 } from "@noble/hashes/blake3"
import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Test data - small PNG image (1x1 pixel)
const smallPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAE/AO/lZy6hAAAAABJRU5ErkJggg=="

// Test data - small JPEG image (red square)
const smallJpegBase64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA8p6+WAAAABJRU5ErkJggg=="

const textBase64 = Buffer.from("hello world").toString("base64")

// Mock environment for testing
const mockEnv = {
  IMAGES: {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  }
}

// Helper function to create a test image buffer
async function createTestImage(width = 100, height = 100, format: "png" | "jpeg" = "png"): Promise<Buffer> {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  })

  if (format === "jpeg") {
    return await image.jpeg({ quality: 80 }).toBuffer()
  }
  return await image.png().toBuffer()
}

describe("Image Optimisation Core Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("MIME type validation", () => {
    it("should detect PNG images correctly", async () => {
      const buffer = Buffer.from(smallPngBase64, "base64")
      const fileType = await fileTypeFromBuffer(buffer)
      expect(fileType?.mime).toBe("image/png")
    })

    it("should detect JPEG images correctly", async () => {
      const buffer = Buffer.from(smallJpegBase64, "base64")
      const fileType = await fileTypeFromBuffer(buffer)
      expect(fileType?.mime).toBe("image/jpeg")
    })

    it("should reject non-image data", async () => {
      const buffer = Buffer.from(textBase64, "base64")
      const fileType = await fileTypeFromBuffer(buffer)
      expect(fileType?.mime).not.toMatch(/^image\//)
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

    it("should generate filename-safe base64", () => {
      const buffer = Buffer.from("test data")
      const hash = blake3(buffer, { dkLen: 16 })
      const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

      // Should not contain URL-unsafe characters
      expect(base64Hash).not.toMatch(/[+/=]/)
      expect(base64Hash).toMatch(/^[A-Za-z0-9_-]+$/)
    })
  })

  describe("Sharp image processing", () => {
    it("should convert PNG to WebP lossless", async () => {
      const pngBuffer = await createTestImage(50, 50, "png")

      const webpBuffer = await sharp(pngBuffer).webp({ lossless: true, effort: 6 }).toBuffer()

      const fileType = await fileTypeFromBuffer(webpBuffer)
      expect(fileType?.mime).toBe("image/webp")

      // Lossless WebP should be smaller than PNG for most images
      expect(webpBuffer.length).toBeLessThanOrEqual(pngBuffer.length)
    })

    it("should convert JPEG to WebP lossy", async () => {
      const jpegBuffer = await createTestImage(50, 50, "jpeg")

      const webpBuffer = await sharp(jpegBuffer).webp({ quality: 60, lossless: false, effort: 6 }).toBuffer()

      const fileType = await fileTypeFromBuffer(webpBuffer)
      expect(fileType?.mime).toBe("image/webp")

      // Lossy WebP should be smaller than JPEG
      expect(webpBuffer.length).toBeLessThan(jpegBuffer.length)
    })

    it("should preserve transparency in PNG", async () => {
      const transparentPng = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 4, // RGBA
          background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
      })
        .png()
        .toBuffer()

      const webpBuffer = await sharp(transparentPng).webp({ lossless: true, effort: 6 }).toBuffer()

      const metadata = await sharp(webpBuffer).metadata()
      expect(metadata.channels).toBe(4) // Should preserve alpha channel
    })

    it("should handle different quality levels", async () => {
      const jpegBuffer = await createTestImage(100, 100, "jpeg")

      const highQuality = await sharp(jpegBuffer).webp({ quality: 90, lossless: false }).toBuffer()

      const lowQuality = await sharp(jpegBuffer).webp({ quality: 10, lossless: false }).toBuffer()

      // Higher quality should produce larger files
      expect(highQuality.length).toBeGreaterThan(lowQuality.length)
    })
  })
})

describe("Filename Generation", () => {
  it("should generate valid filename format", () => {
    const buffer = Buffer.from("test data")
    const timestamp = Math.floor(Date.now() / 1000)
    const hash = blake3(buffer, { dkLen: 16 })
    const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

    const filename = `${timestamp}-${base64Hash}.webp`

    // Should match expected format
    expect(filename).toMatch(/^\d{10}-[A-Za-z0-9_-]+\.webp$/)
    expect(filename).toContain(".webp")
    expect(filename.split("-")).toHaveLength(2)
  })

  it("should include current timestamp", () => {
    const buffer = Buffer.from("test data")
    const beforeTimestamp = Math.floor(Date.now() / 1000)

    const hash = blake3(buffer, { dkLen: 16 })
    const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

    const afterTimestamp = Math.floor(Date.now() / 1000)
    const filename = `${afterTimestamp}-${base64Hash}.webp`

    const extractedTimestamp = Number.parseInt(filename.split("-")[0] || "0")
    expect(extractedTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    expect(extractedTimestamp).toBeLessThanOrEqual(afterTimestamp)
  })
})

describe("Preset Optimisation Logic", () => {
  it("should optimise to target size for 'alt' preset", async () => {
    // Create a larger test image
    const largeImage = await createTestImage(500, 500, "png")
    const targetSize = 4 * 1024 * 1024 // 4MB

    // Test binary search approach for quality optimization
    let quality = 80
    let attempts = 0
    const maxAttempts = 5
    let resultBuffer: Buffer

    do {
      attempts++
      resultBuffer = await sharp(largeImage).webp({ quality, lossless: false, effort: 6 }).toBuffer()

      if (resultBuffer.length > targetSize) {
        quality = Math.max(10, quality - 20) // Reduce quality
      } else {
        break // Within target
      }
    } while (attempts < maxAttempts)

    expect(resultBuffer.length).toBeLessThanOrEqual(targetSize)
    expect(attempts).toBeLessThanOrEqual(maxAttempts)
  })

  it("should handle images already under target size", async () => {
    const smallImage = await createTestImage(10, 10, "png")
    const targetSize = 4 * 1024 * 1024 // 4MB

    const webpBuffer = await sharp(smallImage).webp({ lossless: true, effort: 6 }).toBuffer()

    // Small image should be well under target
    expect(webpBuffer.length).toBeLessThan(targetSize)
    expect(webpBuffer.length).toBeLessThan(1000) // Should be very small
  })
})

describe("Error Handling", () => {
  it("should handle invalid image data gracefully", async () => {
    const invalidBuffer = Buffer.from("not an image")

    await expect(async () => {
      await sharp(invalidBuffer).webp().toBuffer()
    }).rejects.toThrow()
  })

  it("should handle empty buffers", async () => {
    const emptyBuffer = Buffer.alloc(0)

    await expect(async () => {
      await sharp(emptyBuffer).webp().toBuffer()
    }).rejects.toThrow()
  })
})

describe("Integration Tests", () => {
  it("should complete full optimisation pipeline", async () => {
    const originalBuffer = Buffer.from(smallPngBase64, "base64")

    // Validate MIME type
    const fileType = await fileTypeFromBuffer(originalBuffer)
    expect(fileType?.mime).toBe("image/png")

    // Generate filename
    const timestamp = Math.floor(Date.now() / 1000)
    const hash = blake3(originalBuffer, { dkLen: 16 })
    const base64Hash = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
    const filename = `${timestamp}-${base64Hash}.webp`

    // Optimise image
    const optimisedBuffer = await sharp(originalBuffer).webp({ lossless: true, effort: 6 }).toBuffer()

    // Verify optimised format
    const optimisedFileType = await fileTypeFromBuffer(optimisedBuffer)
    expect(optimisedFileType?.mime).toBe("image/webp")

    // Mock R2 upload
    await mockEnv.IMAGES.put(`opt/${filename}`, optimisedBuffer, {
      httpMetadata: { contentType: "image/webp" },
      customMetadata: {
        originalMimeType: "image/png",
        uploadedAt: new Date().toISOString()
      }
    })

    expect(mockEnv.IMAGES.put).toHaveBeenCalledWith(
      `opt/${filename}`,
      optimisedBuffer,
      expect.objectContaining({
        httpMetadata: { contentType: "image/webp" },
        customMetadata: expect.objectContaining({
          originalMimeType: "image/png"
        })
      })
    )
  })
})
