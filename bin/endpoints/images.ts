import { type ApiResponse, BaseAdapter, type RequestConfig } from "./base"

/**
 * Options for public requests (without authentication)
 */
interface PublicRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number>
}

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
 * Public endpoint - authentication optional
 */
export class ImagesAdapter extends BaseAdapter {
  /**
   * Build URL without authentication for public endpoints
   * @param path API endpoint path
   * @param params Query parameters to include
   * @returns Complete URL string without token
   */
  protected buildPublicUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseUrl)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }
    }

    return url.toString()
  }

  /**
   * Make a public request without authentication
   * @param path API endpoint path
   * @param options Request options
   * @returns API response
   */
  protected async makePublicRequest<T = unknown>(
    path: string,
    options: PublicRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers: additionalHeaders, body, params } = options

    const url = this.buildPublicUrl(path, params)
    const headers = this.buildHeaders(additionalHeaders)

    // Remove Authorization header for public requests
    // biome-ignore lint/performance/noDelete: known scope
    delete headers.Authorization

    if (this.config.dryRun) {
      return {
        ok: true,
        message: `DRY RUN: Would ${method} ${url}`,
        data: { url, headers, body } as T
      }
    }

    if (this.config.verbose) {
      console.log(`🌐 ${method} ${url}`)
      if (body && this.config.verbose) {
        console.log("📤 Body:", JSON.stringify(body, null, 2))
      }
    }

    try {
      const requestInit: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      }

      if (body && method !== "GET") {
        requestInit.body = JSON.stringify(body)
      }

      const response = await fetch(url, requestInit)
      const data = (await response.json()) as ApiResponse<T>

      if (this.config.verbose) {
        console.log("📥 Response (%d):", response.status, JSON.stringify(data, null, 2))
      }

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: data,
          meta: data.meta
        }
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (this.config.verbose) {
        console.error("❌ Request failed:", error)
      }

      return {
        ok: false,
        error: errorMessage,
        details: error
      }
    }
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

    return this.makePublicRequest("/api/images/optimise", {
      method: "GET",
      params
    }) as Promise<ApiResponse<ImageOptimiseResponse>>
  }

  /**
   * Optimize a local image file
   * @param filePath Path to the local image file
   * @param quality Optional quality setting (0-100)
   * @returns Optimized image data with compression metrics
   */
  async optimiseFromFile(filePath: string, quality?: number): Promise<ApiResponse<ImageOptimiseResponse>> {
    const file = Bun.file(filePath)

    if (!(await file.exists())) {
      return {
        ok: false,
        error: `File not found: ${filePath}`
      }
    }

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    const body: Record<string, unknown> = {
      image: base64
    }
    if (quality !== undefined) {
      body.quality = quality
    }

    return this.makePublicRequest("/api/images/optimise", {
      method: "POST",
      body
    }) as Promise<ApiResponse<ImageOptimiseResponse>>
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

    return this.makePublicRequest("/api/images/optimise", {
      method: "POST",
      body
    })
  }
}
