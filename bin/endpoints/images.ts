import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Response format for image optimization operations
 */
interface ImageOptimiseResponse {
  optimisedImage: string
  originalSize: number
  optimisedSize: number
  compressionRatio: number
  format: string
  quality: number
  processingTime?: number
}

/**
 * Adapter for image optimization operations (/api/images/*)
 * Requires 'api:images' scope or higher for authentication
 */
export class ImagesAdapter extends BaseAdapter {
  /**
   * Create a new images adapter instance
   * @param config Configuration for the adapter
   */
  constructor(config: RequestConfig) {
    super(config)
  }

  /**
   * Optimize an image from a URL
   * @param imageUrl URL of the image to optimize
   * @param quality Optional quality setting (0-100)
   * @returns Optimized image data with compression metrics
   */
  async optimiseFromUrl(imageUrl: string, quality?: number): Promise<ApiResponse<ImageOptimiseResponse>> {
    const params: Record<string, string | number> = { url: imageUrl }
    if (quality !== undefined) {
      params.quality = quality
    }

    return this.uploadImageFromUrl("/api/images/optimise", imageUrl, params) as Promise<
      ApiResponse<ImageOptimiseResponse>
    >
  }

  /**
   * Optimize a local image file
   * @param filePath Path to the local image file
   * @param quality Optional quality setting (0-100)
   * @returns Optimized image data with compression metrics
   */
  async optimiseFromFile(filePath: string, quality?: number): Promise<ApiResponse<ImageOptimiseResponse>> {
    const additionalData: Record<string, unknown> = {}
    if (quality !== undefined) {
      additionalData.quality = quality
    }

    return this.uploadFile("/api/images/optimise", filePath, additionalData) as Promise<
      ApiResponse<ImageOptimiseResponse>
    >
  }

  /**
   * Optimize base64 encoded image data
   * @param base64Data Base64 encoded image data (without data URL prefix)
   * @param quality Optional quality setting (0-100)
   * @returns Optimized image data with compression metrics
   */
  async optimiseFromBase64(base64Data: string, quality?: number): Promise<ApiResponse<ImageOptimiseResponse>> {
    const body: Record<string, unknown> = { image: base64Data }
    if (quality !== undefined) {
      body.quality = quality
    }

    return this.makeRequest("/api/images/optimise", {
      method: "POST",
      body
    })
  }
}
