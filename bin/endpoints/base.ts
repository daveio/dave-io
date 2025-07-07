/// <reference types="bun-types" />

/**
 * Standard API response format used across all endpoints
 */
export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  message?: string
  meta?: {
    total?: number
    page?: number
    per_page?: number
    total_pages?: number
    request_id?: string
    timestamp?: string
    cfRay?: string
    datacenter?: string
    country?: string
  }
  timestamp?: string
  error?: string
  details?: unknown
}

/**
 * Configuration for API requests
 */
export interface RequestConfig {
  /** JWT token for authentication */
  token?: string
  /** Base URL for API requests */
  baseUrl: string
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable verbose logging */
  verbose?: boolean
  /** Enable dry run mode (no actual requests) */
  dryRun?: boolean
}

/**
 * Options for individual requests
 */
export interface RequestOptions {
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  /** Additional headers */
  headers?: Record<string, string>
  /** Request body */
  body?: unknown
  /** Query parameters */
  params?: Record<string, string | number | boolean>
}

/**
 * Base adapter class providing common functionality for API interactions
 */
export abstract class BaseAdapter {
  protected config: RequestConfig

  /**
   * Create a new adapter instance
   * @param config Configuration for the adapter
   */
  constructor(config: RequestConfig) {
    this.config = config
  }

  /**
   * Build complete URL with query parameters and authentication
   * @param path API endpoint path
   * @param params Query parameters to include
   * @returns Complete URL string
   */
  protected buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseUrl)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }
    }

    if (this.config.token && !url.searchParams.has("token")) {
      url.searchParams.set("token", this.config.token)
    }

    return url.toString()
  }

  /**
   * Build request headers with authentication and user agent
   * @param additionalHeaders Extra headers to include
   * @returns Complete headers object
   */
  protected buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "dave-io-try-cli/1.0.0",
      ...additionalHeaders
    }

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`
    }

    return headers
  }

  /**
   * Make an HTTP request to the API
   * @param path API endpoint path
   * @param options Request options
   * @returns API response
   */
  protected async makeRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = "GET", headers: additionalHeaders, body, params } = options

    const url = this.buildUrl(path, params)
    const headers = this.buildHeaders(additionalHeaders)

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
        if (body instanceof FormData) {
          requestInit.body = body
          // Remove Content-Type header for FormData to let fetch set it automatically
          delete headers["Content-Type"]
        } else {
          requestInit.body = JSON.stringify(body)
        }
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
   * Upload a file as base64 encoded data
   * @param path API endpoint path
   * @param filePath Local file path to upload
   * @param additionalData Extra data to include in request
   * @returns API response
   */
  protected async uploadFile(
    path: string,
    filePath: string,
    additionalData?: Record<string, unknown>
  ): Promise<ApiResponse> {
    const file = Bun.file(filePath)

    if (!(await file.exists())) {
      return {
        ok: false,
        error: `File not found: ${filePath}`
      }
    }

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")

    const body = {
      image: base64,
      ...additionalData
    }

    return this.makeRequest(path, {
      method: "POST",
      body
    })
  }

  /**
   * Process an image from a URL
   * @param path API endpoint path
   * @param imageUrl URL of the image to process
   * @param params Additional query parameters
   * @returns API response
   */
  protected async uploadImageFromUrl(
    path: string,
    imageUrl: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse> {
    return this.makeRequest(path, {
      method: "GET",
      params: {
        url: imageUrl,
        ...params
      }
    })
  }
}
