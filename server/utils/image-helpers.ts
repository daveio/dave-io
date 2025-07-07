import type { CloudflareEnv } from "./cloudflare"
import { createApiError } from "./response"

/**
 * Validates image size against Claude's 5MB limit
 * @param imageData - Image data as Buffer or Uint8Array
 * @returns True if image is within size limits
 * @throws {Error} If image exceeds size limit
 */
export function validateImageSize(imageData: Buffer | Uint8Array): boolean {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB limit for Claude
  const size = imageData.length

  if (size > MAX_SIZE) {
    throw createApiError(413, `Image size ${size} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes`)
  }

  return true
}

/**
 * Validates image URL to prevent SSRF attacks
 * @param url - Image URL to validate
 * @returns True if URL is safe to fetch
 * @throws {Error} If URL is unsafe
 */
export function validateImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)

    // Only allow HTTP/HTTPS protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw createApiError(400, "Only HTTP and HTTPS URLs are allowed")
    }

    // Block localhost and private IP ranges
    const hostname = parsedUrl.hostname.toLowerCase()
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      throw createApiError(400, "URLs pointing to local or private networks are not allowed")
    }

    return true
  } catch (error) {
    if (error instanceof TypeError) {
      throw createApiError(400, "Invalid URL format")
    }
    throw error
  }
}

/**
 * Fetches image from URL with size validation
 * @param url - Image URL to fetch
 * @returns Promise resolving to image buffer and content type
 * @throws {Error} If fetch fails or image is invalid
 */
export async function fetchImageFromUrl(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  validateImageUrl(url)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "dave.io/1.0 (Image Alt Text Generator)"
      }
    })

    if (!response.ok) {
      throw createApiError(400, `Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "image/jpeg"
    if (!contentType.startsWith("image/")) {
      throw createApiError(400, "URL does not point to an image")
    }

    // Convert to buffer and validate size
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    validateImageSize(buffer)

    return { buffer, contentType }
  } catch (error) {
    if (error instanceof Error && error.message.includes("fetch")) {
      throw createApiError(400, "Failed to fetch image from URL")
    }
    throw error
  }
}

/**
 * Validates image size with optimization support
 * @param imageData - Image data as Buffer or Uint8Array
 * @param env - Cloudflare environment bindings (optional, for optimization)
 * @returns Promise<Buffer> - Original buffer if valid, or optimized buffer if needed
 * @throws {Error} If image cannot be made valid
 */
export async function validateImageSizeWithOptimization(
  imageData: Buffer | Uint8Array,
  env?: CloudflareEnv
): Promise<Buffer> {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB limit for Claude
  const buffer = Buffer.from(imageData)

  // If already within limits, return as-is
  if (buffer.length <= MAX_SIZE) {
    return buffer
  }

  // If environment is available and image exceeds limit, try optimization
  if (env?.IMAGES) {
    return await optimizeImageForClaude(buffer, env)
  }

  // If no optimization available, throw error
  throw createApiError(
    413,
    `Image size ${buffer.length} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes and optimization is not available`
  )
}

/**
 * Optimizes image using Cloudflare Images to reduce size for Claude
 * @param imageData - Original image data as Buffer
 * @param env - Cloudflare environment bindings (for IMAGES binding)
 * @param targetSize - Target size in bytes (default 4MB to leave headroom)
 * @returns Promise resolving to optimized image buffer
 * @throws {Error} If optimization fails or image is still too large
 */
export async function optimizeImageForClaude(
  imageData: Buffer,
  env: CloudflareEnv,
  targetSize: number = 4 * 1024 * 1024 // 4MB to leave headroom under Claude's 5MB limit
): Promise<Buffer> {
  if (!env.IMAGES) {
    throw createApiError(503, "Image optimization service not available")
  }

  // If already within target size, return as-is
  if (imageData.length <= targetSize) {
    return imageData
  }

  try {
    // Helper function to create a new stream from buffer
    const createStream = (data: Buffer): ReadableStream<Uint8Array> => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(data))
          controller.close()
        }
      })
    }

    console.log(`Optimizing image: original size ${(imageData.length / (1024 * 1024)).toFixed(2)}MB`)

    // Progressive optimization strategy
    const strategies = [
      // Strategy 1: Moderate compression with WebP
      { width: 2048, height: 2048, format: "image/webp" as const, quality: 85 },
      // Strategy 2: More aggressive WebP compression
      { width: 1536, height: 1536, format: "image/webp" as const, quality: 75 },
      // Strategy 3: JPEG with reduced dimensions
      { width: 1536, height: 1536, format: "image/jpeg" as const, quality: 85 },
      // Strategy 4: Aggressive JPEG compression
      { width: 1024, height: 1024, format: "image/jpeg" as const, quality: 70 }
    ]

    for (const strategy of strategies) {
      console.log(`Trying optimization: ${strategy.width}x${strategy.height} ${strategy.format} q${strategy.quality}`)

      const stream = createStream(imageData)
      const result = await env.IMAGES.input(stream)
        .transform({
          width: strategy.width,
          height: strategy.height,
          fit: "scale-down", // Don't enlarge, only shrink
          background: "#FFFFFF" // White background for transparency
        })
        .output({ format: strategy.format, quality: strategy.quality })

      const response = result.response()
      const arrayBuffer = await response.arrayBuffer()
      const optimizedBuffer = Buffer.from(arrayBuffer)

      console.log(`Optimized size: ${(optimizedBuffer.length / (1024 * 1024)).toFixed(2)}MB`)

      if (optimizedBuffer.length <= targetSize) {
        return optimizedBuffer
      }
    }

    // If we still can't get it small enough, throw an error
    throw createApiError(
      413,
      `Unable to optimize image below ${(targetSize / (1024 * 1024)).toFixed(2)}MB. ` +
        `Original size: ${(imageData.length / (1024 * 1024)).toFixed(2)}MB`
    )
  } catch (error) {
    // If it's already our API error, re-throw it
    if (error instanceof Error && error.name === "ApiError") {
      throw error
    }

    // Otherwise, wrap in a new API error
    console.error("Image optimization error:", error)
    throw createApiError(500, `Image optimization failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Detects image format from buffer header
 * @param buffer - Image data buffer
 * @returns MIME type string
 */
export function detectImageFormat(buffer: Buffer): string {
  // Check magic bytes to determine format
  if (buffer.length < 4) {
    return "image/jpeg" // Default fallback
  }

  // JPEG: FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg"
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png"
  }

  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif"
  }

  // WebP: Check for "WEBP" at offset 8
  if (buffer.length >= 12 && buffer.subarray(8, 12).toString() === "WEBP") {
    return "image/webp"
  }

  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp"
  }

  // Default to JPEG if unknown
  return "image/jpeg"
}

/**
 * Validates that buffer contains valid image data
 * @param buffer - Image data buffer
 * @param expectedType - Expected MIME type (optional)
 * @returns True if image is valid
 * @throws {Error} If image data is invalid
 */
export function validateImageFormat(buffer: Buffer, expectedType?: string): boolean {
  if (!buffer || buffer.length === 0) {
    throw createApiError(400, "Empty image data")
  }

  const detectedType = detectImageFormat(buffer)

  // If expected type is provided, check if it matches
  if (expectedType && expectedType !== detectedType) {
    throw createApiError(400, `Image format mismatch: expected ${expectedType}, detected ${detectedType}`)
  }

  // Check if it's a supported format
  const supportedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!supportedFormats.includes(detectedType)) {
    throw createApiError(400, `Unsupported image format: ${detectedType}`)
  }

  return true
}
