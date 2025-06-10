import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for AI alt-text generation
 */
interface AltTextResponse {
  altText: string
  confidence?: number
  processingTime?: number
}

/**
 * Adapter for AI-powered operations (/api/ai/*)
 * Requires 'ai:alt' scope or higher for authentication
 */
export class AIAdapter extends BaseAdapter {
  /**
   * Generate alt-text description from an image URL
   * @param imageUrl URL of the image to analyze
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromUrl(imageUrl: string): Promise<ApiResponse<AltTextResponse>> {
    return this.uploadImageFromUrl("/api/ai/alt", imageUrl) as Promise<ApiResponse<AltTextResponse>>
  }

  /**
   * Generate alt-text description from a local image file
   * @param filePath Path to the local image file
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromFile(filePath: string): Promise<ApiResponse<AltTextResponse>> {
    return this.uploadFile("/api/ai/alt", filePath) as Promise<ApiResponse<AltTextResponse>>
  }

  /**
   * Generate alt-text description from base64 encoded image data
   * @param base64Data Base64 encoded image data (without data URL prefix)
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromBase64(base64Data: string): Promise<ApiResponse<AltTextResponse>> {
    return this.makeRequest("/api/ai/alt", {
      method: "POST",
      body: { image: base64Data }
    })
  }
}
