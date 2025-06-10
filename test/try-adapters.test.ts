/// <reference types="bun-types" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AIAdapter,
  BaseAdapter,
  DashboardAdapter,
  ImagesAdapter,
  InternalAdapter,
  type RequestConfig,
  TokensAdapter
} from "../bin/endpoints"

// Mock fetch globally
// biome-ignore lint/suspicious/noExplicitAny: mock function type
const mockFetch = vi.fn() as any
global.fetch = mockFetch

// TODO: (37c7b2) Skip Bun mocking for now - we'll test these methods separately

describe("BaseAdapter", () => {
  let adapter: BaseAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }

    // Create a concrete implementation for testing
    class TestAdapter extends BaseAdapter {
      async testMethod() {
        return this.makeRequest("/test")
      }
    }

    adapter = new TestAdapter(config)
    mockFetch.mockClear()
  })

  describe("buildUrl", () => {
    it("should build URL with base URL and path", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test")
      expect(url).toBe("https://test.example.com/api/test?token=test-token")
    })

    it("should add query parameters", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test", { param1: "value1", param2: 123 })
      expect(url).toBe("https://test.example.com/api/test?param1=value1&param2=123&token=test-token")
    })

    it("should not add token if already in params", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test", { token: "custom-token" })
      expect(url).toBe("https://test.example.com/api/test?token=custom-token")
    })
  })

  describe("buildHeaders", () => {
    it("should build headers with auth token", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const testAdapter = adapter as any
      const headers = testAdapter.buildHeaders()
      expect(headers).toEqual({
        "Content-Type": "application/json",
        "User-Agent": "dave-io-try-cli/1.0.0",
        Authorization: "Bearer test-token"
      })
    })

    it("should merge additional headers", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const testAdapter = adapter as any
      const headers = testAdapter.buildHeaders({ "Custom-Header": "value" })
      expect(headers).toEqual({
        "Content-Type": "application/json",
        "User-Agent": "dave-io-try-cli/1.0.0",
        Authorization: "Bearer test-token",
        "Custom-Header": "value"
      })
    })

    it("should not add auth header when no token", () => {
      const noTokenConfig = { ...config, token: undefined }
      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const noTokenAdapter = new TestAdapter(noTokenConfig) as any
      const headers = noTokenAdapter.buildHeaders()
      expect(headers).toEqual({
        "Content-Type": "application/json",
        "User-Agent": "dave-io-try-cli/1.0.0"
      })
    })
  })

  describe("makeRequest", () => {
    it("should return dry run response when dryRun is true", async () => {
      const dryRunConfig = { ...config, dryRun: true }
      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      const dryRunAdapter = new TestAdapter(dryRunConfig)
      // biome-ignore lint/suspicious/noExplicitAny: cast for test access
      const result = await (dryRunAdapter as any).testMethod()

      expect(result.success).toBe(true)
      expect(result.message).toContain("DRY RUN: Would GET")
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should make successful API request", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { test: "value" } })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      const testAdapter = new TestAdapter(config)
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const result = await (testAdapter as any).testMethod()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ test: "value" })
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/test?token=test-token",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token"
          })
        })
      )
    })

    it("should handle HTTP error responses", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ success: false, error: "Invalid request" })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      const testAdapter = new TestAdapter(config)
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const result = await (testAdapter as any).testMethod()

      expect(result.success).toBe(false)
      expect(result.error).toBe("HTTP 400: Bad Request")
    })

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      const testAdapter = new TestAdapter(config)
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const result = await (testAdapter as any).testMethod()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Network error")
    })

    it("should make POST request with body", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test", {
            method: "POST",
            body: { test: "data" }
          })
        }
      }
      const testAdapter = new TestAdapter(config)
      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const result = await (testAdapter as any).testMethod()

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/test?token=test-token",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ test: "data" })
        })
      )
    })
  })

  // TODO: (37c7b2) Fix uploadFile tests - they require Bun.file mocking.
  // describe("uploadFile", () => { ... })

  describe("uploadImageFromUrl", () => {
    it("should upload image from URL", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { processed: true } })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      const result = await (adapter as any).uploadImageFromUrl("/process", "https://example.com/image.jpg")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ processed: true })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("url=https%3A%2F%2Fexample.com%2Fimage.jpg"),
        expect.objectContaining({
          method: "GET"
        })
      )
    })

    it("should include additional parameters", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      // biome-ignore lint/suspicious/noExplicitAny: Testing private method
      await (adapter as any).uploadImageFromUrl("/process", "https://example.com/image.jpg", { quality: 75 })

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("quality=75"), expect.any(Object))
    })
  })
})

describe("AIAdapter", () => {
  let adapter: AIAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new AIAdapter(config)
    mockFetch.mockClear()
  })

  it("should generate alt text from URL", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { altText: "A beautiful landscape", confidence: 0.95 }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.generateAltTextFromUrl("https://example.com/image.jpg")

    expect(result.success).toBe(true)
    expect(result.data?.altText).toBe("A beautiful landscape")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ai/alt"),
      expect.objectContaining({ method: "GET" })
    )
  })

  it("should generate alt text from base64", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { altText: "A test image" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.generateAltTextFromBase64("base64data")

    expect(result.success).toBe(true)
    expect(result.data?.altText).toBe("A test image")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ image: "base64data" })
      })
    )
  })
})

describe("ImagesAdapter", () => {
  let adapter: ImagesAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new ImagesAdapter(config)
    mockFetch.mockClear()
  })

  it("should optimize image from URL", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          optimisedImage: "optimized-base64",
          originalSize: 1000,
          optimisedSize: 500,
          compressionRatio: 0.5
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.optimiseFromUrl("https://example.com/image.jpg", 80)

    expect(result.success).toBe(true)
    expect(result.data?.compressionRatio).toBe(0.5)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("quality=80"),
      expect.objectContaining({ method: "GET" })
    )
  })

  it("should optimize image from base64", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { optimisedImage: "optimized-base64" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.optimiseFromBase64("base64data", 75)

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ image: "base64data", quality: 75 })
      })
    )
  })

  it("should omit token when not provided", async () => {
    const noTokenConfig = { ...config, token: undefined }
    adapter = new ImagesAdapter(noTokenConfig)

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    await adapter.optimiseFromUrl("https://example.com/test.png")

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).not.toContain("token=")
  })
})

describe("InternalAdapter", () => {
  let adapter: InternalAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new InternalAdapter(config)
    mockFetch.mockClear()
  })

  it("should check health", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { status: "ok", timestamp: "2023-01-01T00:00:00Z" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.health()

    expect(result.success).toBe(true)
    expect(result.data?.status).toBe("ok")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/internal/health"), expect.any(Object))
  })

  it("should ping server", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { message: "pong", timestamp: "2023-01-01T00:00:00Z" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.ping()

    expect(result.success).toBe(true)
    expect(result.data?.message).toBe("pong")
  })

  it("should validate auth", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { valid: true, sub: "test-user" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.auth()

    expect(result.success).toBe(true)
    expect(result.data?.valid).toBe(true)
    expect(result.data?.sub).toBe("test-user")
  })

  it("should get metrics with format", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { metrics: { requests: 100 }, format: "yaml" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.metrics("yaml")

    expect(result.success).toBe(true)
    expect(result.data?.format).toBe("yaml")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("format=yaml"), expect.any(Object))
  })
})

describe("TokensAdapter", () => {
  let adapter: TokensAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new TokensAdapter(config)
    mockFetch.mockClear()
  })

  it("should get token info", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          uuid: "test-uuid",
          usage: { total: 100, success: 95, error: 5 }
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.getTokenInfo("test-uuid")

    expect(result.success).toBe(true)
    expect(result.data?.uuid).toBe("test-uuid")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/tokens/test-uuid"), expect.any(Object))
  })

  it("should revoke token", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { revoked: true, uuid: "test-uuid" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.revokeToken("test-uuid")

    expect(result.success).toBe(true)
    expect(result.data?.revoked).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tokens/test-uuid/revoke"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ revoked: true })
      })
    )
  })

  it("should unrevoke token", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { revoked: false, uuid: "test-uuid" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.unrevokeToken("test-uuid")

    expect(result.success).toBe(true)
    expect(result.data?.revoked).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ revoked: false })
      })
    )
  })
})

describe("DashboardAdapter", () => {
  let adapter: DashboardAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new DashboardAdapter(config)
    mockFetch.mockClear()
  })

  it("should get dashboard data", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          name: "test-dashboard",
          data: { metrics: 123 },
          timestamp: "2023-01-01T00:00:00Z"
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.getDashboardData("test-dashboard")

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe("test-dashboard")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard/test-dashboard"), expect.any(Object))
  })

  it("should get live dashboard", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          connections: 42,
          lastUpdate: "2023-01-01T00:00:00Z",
          data: { live: true }
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.getLiveDashboard()

    expect(result.success).toBe(true)
    expect(result.data?.connections).toBe(42)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard/live"), expect.any(Object))
  })
})
