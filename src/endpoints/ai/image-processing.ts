import type { Context } from "hono"
import { AiAltBase, VALID_IMAGE_EXTENSIONS } from "./base"

/**
 * Utility class for image processing operations
 */
export class ImageProcessor extends AiAltBase {
  /**
   * Process image URL and return image data or error response
   */
  async processImageFromUrl(c: Context, imageUrl: string): Promise<Uint8Array | Response> {
    try {
      // Basic URL validation
      const url = new URL(imageUrl)
      const pathname = url.pathname.toLowerCase()
      const hasValidExtension = VALID_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))

      if (!hasValidExtension) {
        return this.createErrorResponse(
          c,
          "Invalid image URL - URL must point to a valid image file",
          "INVALID_IMAGE_URL"
        )
      }

      // Fetch the image
      const response = await fetch(imageUrl)

      if (!response.ok) {
        return this.createErrorResponse(
          c,
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          "FETCH_ERROR"
        )
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.startsWith("image/")) {
        return this.createErrorResponse(c, "URL does not point to a valid image", "INVALID_CONTENT_TYPE")
      }

      // Get image data
      const imageData = new Uint8Array(await response.arrayBuffer())

      // Check file size
      const sizeError = this.validateImageSize(c, imageData)
      if (sizeError) { return sizeError }

      return imageData
    } catch (_error) {
      return this.createErrorResponse(c, "Invalid image URL format", "INVALID_URL_FORMAT")
    }
  }

  /**
   * Process base64 image data and return image data or error response
   */
  processBase64Image(c: Context, imageDataUrl: string): Uint8Array | Response {
    // Check if it's a valid data URL
    if (!imageDataUrl.startsWith("data:image/")) {
      return this.createErrorResponse(
        c,
        "Invalid image data. Must be a base64 data URL starting with 'data:image/'",
        "INVALID_IMAGE_DATA"
      )
    }

    // Extract the base64 content
    const [header, base64Data] = imageDataUrl.split(",")
    if (!header || !base64Data) {
      return this.createErrorResponse(c, "Invalid image data format", "INVALID_IMAGE_FORMAT")
    }

    // Decode base64 data
    try {
      const imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

      // Check file size
      const sizeError = this.validateImageSize(c, imageData)
      if (sizeError) { return sizeError }

      return imageData
    } catch (_error) {
      return this.createErrorResponse(c, "Invalid base64 encoding", "INVALID_BASE64")
    }
  }
}
