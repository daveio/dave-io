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

    // Convert to buffer and validate size against 10MB limit
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check against 10MB limit (same as Cloudflare Images limit)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (buffer.length > MAX_SIZE) {
      throw createApiError(413, `Image size ${buffer.length} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes`)
    }

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
 * @returns Promise<Buffer> - Always returns optimized buffer resized to max 1024px on long edge
 * @throws {Error} If image cannot be processed or exceeds 10MB
 */
export async function validateImageSizeWithOptimization(
  imageData: Buffer | Uint8Array,
  env?: CloudflareEnv
): Promise<Buffer> {
  const MAX_CLOUDFLARE_SIZE = 10 * 1024 * 1024 // 10MB limit for Cloudflare Images
  const buffer = Buffer.from(imageData)

  // Check against Cloudflare Images limit first
  if (buffer.length > MAX_CLOUDFLARE_SIZE) {
    throw createApiError(
      413,
      `Image size ${buffer.length} bytes exceeds maximum allowed size of ${MAX_CLOUDFLARE_SIZE} bytes (10MB limit for image processing)`
    )
  }

  // Always optimize images to ensure consistent 1024px max dimensions for Claude
  if (env?.IMAGES) {
    const optimizedBuffer = await optimizeImageForClaude(buffer, env)

    // Validate optimized image meets Claude's 5MB limit
    validateImageSize(optimizedBuffer)

    return optimizedBuffer
  }

  // If no optimization available, throw error since we always want to resize
  throw createApiError(503, "Image optimization service not available - required for processing images")
}

/**
 * Optimizes image using Cloudflare Images to ensure max 1024px on long edge for Claude
 * @param imageData - Original image data as Buffer
 * @param env - Cloudflare environment bindings (for IMAGES binding)
 * @returns Promise resolving to optimized WebP image buffer (max 1024px on long edge, quality 60)
 * @throws {Error} If optimization fails
 */
export async function optimizeImageForClaude(imageData: Buffer, env: CloudflareEnv): Promise<Buffer> {
  if (!env.IMAGES) {
    throw createApiError(503, "Image optimization service not available")
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

    // Always resize to max 1024px on long edge with lossy WebP
    // Using scale-down ensures the image is never enlarged, only shrunk if needed
    // Setting both width and height to 1024 with scale-down preserves aspect ratio
    const stream = createStream(imageData)
    const result = await env.IMAGES.input(stream)
      .transform({
        width: 1024,
        height: 1024,
        fit: "scale-down", // Preserves aspect ratio, never enlarges
        background: "#FFFFFF" // White background for transparent areas
      })
      .output({
        format: "image/webp", // Always output as WebP for better compression
        quality: 60 // Lossy WebP at quality 60 for optimal size/quality balance
      })

    const response = result.response()
    const arrayBuffer = await response.arrayBuffer()
    const optimizedBuffer = Buffer.from(arrayBuffer)

    console.log(
      `Optimized image: final size ${(optimizedBuffer.length / (1024 * 1024)).toFixed(2)}MB, max 1024px on long edge, WebP format`
    )

    return optimizedBuffer
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
