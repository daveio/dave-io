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
 * Optimizes image to fit within Claude's limits
 * For now, this function throws an error as a stub
 * @param imageData - Image data to optimize
 * @param _targetSize - Target size in bytes (unused for now)
 * @returns Promise resolving to optimized image data
 * @throws {Error} Always throws as this is a stub implementation
 */

// TODO: (29fa91) Implement image optimization to reduce size to under 5MB. Use Cloudflare Images... somehow.

export async function optimizeImageStub(imageData: Buffer, _targetSize: number = 5 * 1024 * 1024): Promise<Buffer> {
  // Stub implementation - will be replaced with actual optimization later
  throw createApiError(
    413,
    `Image size ${imageData.length} bytes exceeds 5MB limit. Image optimization not yet implemented.`
  )
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
