/// <reference types="bun-types" />
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AIAdapter, BaseAdapter, DashboardAdapter, ImageAdapter, InternalAdapter, TokenAdapter } from "../bin/endpoints"
import type { RequestConfig } from "../bin/endpoints"

// Mock fetch globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = vi.fn() as any
global.fetch = mockFetch

// Mock global Bun for tests that need it
const mockBunFile = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).Bun = { file: mockBunFile }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test")
      expect(url).toBe("https://test.example.com/api/test?token=test-token")
    })

    it("should add query parameters", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test", { param1: "value1", param2: 123 })
      expect(url).toBe("https://test.example.com/api/test?param1=value1&param2=123&token=test-token")
    })

    it("should not add token if already in params", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testAdapter = adapter as any
      const url = testAdapter.buildUrl("/api/test", { token: "custom-token" })
      expect(url).toBe("https://test.example.com/api/test?token=custom-token")
    })
  })

  describe("buildHeaders", () => {
    it("should build headers with auth token", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testAdapter = adapter as any
      const headers = testAdapter.buildHeaders()
      expect(headers).toEqual({
        "Content-Type": "application/json",
        "User-Agent": "dave-io-try-cli/1.0.0",
        Authorization: "Bearer test-token"
      })
    })

    it("should merge additional headers", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (dryRunAdapter as any).testMethod()

      expect(result.ok).toBe(true)
      expect(result.message).toContain("DRY RUN: Would GET")
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should make successful API request", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { test: "value" } })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testMethod() {
          return this.makeRequest("/test")
        }
      }
      const testAdapter = new TestAdapter(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testMethod()

      expect(result.ok).toBe(true)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testMethod()

      expect(result.ok).toBe(false)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testMethod()

      expect(result.ok).toBe(false)
      expect(result.error).toBe("Network error")
    })

    it("should make POST request with body", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ok: true })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testMethod()

      expect(result.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/test?token=test-token",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ test: "data" })
        })
      )
    })
  })

  describe("uploadFile", () => {
    beforeEach(() => {
      // Reset and configure Bun mock before each test
      mockBunFile.mockReset()
    })

    it("should upload file successfully", async () => {
      // Mock Bun.file
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("test file content"))
      }
      mockBunFile.mockReturnValue(mockFile)

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { uploaded: true } })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testUploadFile() {
          return this.uploadFile("/upload", "/path/to/test.jpg")
        }
      }
      const testAdapter = new TestAdapter(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testUploadFile()

      expect(result.ok).toBe(true)
      expect(result.data?.uploaded).toBe(true)
      expect(mockBunFile).toHaveBeenCalledWith("/path/to/test.jpg")
      expect(mockFile.exists).toHaveBeenCalled()
      expect(mockFile.arrayBuffer).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/upload?token=test-token",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            image: Buffer.from("test file content").toString("base64")
          })
        })
      )
    })

    it("should handle file not found", async () => {
      // Mock Bun.file for non-existent file
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
      global.Bun = mockBun

      class TestAdapter extends BaseAdapter {
        async testUploadFile() {
          return this.uploadFile("/upload", "/path/to/nonexistent.jpg")
        }
      }
      const testAdapter = new TestAdapter(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (testAdapter as any).testUploadFile()

      expect(result.ok).toBe(false)
      expect(result.error).toBe("File not found: /path/to/nonexistent.jpg")
      expect(mockBun.file).toHaveBeenCalledWith("/path/to/nonexistent.jpg")
      expect(mockFile.exists).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should include additional data in upload", async () => {
      // Mock Bun.file
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("test content"))
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
      global.Bun = mockBun

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ok: true })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      class TestAdapter extends BaseAdapter {
        async testUploadFile() {
          return this.uploadFile("/upload", "/path/to/test.jpg", { quality: 85, format: "webp" })
        }
      }
      const testAdapter = new TestAdapter(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (testAdapter as any).testUploadFile()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            image: Buffer.from("test content").toString("base64"),
            quality: 85,
            format: "webp"
          })
        })
      )
    })

    it("should handle dry run mode", async () => {
      const dryRunConfig = { ...config, dryRun: true }

      // Mock Bun.file
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("test content"))
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
      global.Bun = mockBun

      class TestAdapter extends BaseAdapter {
        async testUploadFile() {
          return this.uploadFile("/upload", "/path/to/test.jpg")
        }
      }
      const dryRunAdapter = new TestAdapter(dryRunConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (dryRunAdapter as any).testUploadFile()

      expect(result.ok).toBe(true)
      expect(result.message).toContain("DRY RUN: Would POST")
      expect(mockBun.file).toHaveBeenCalledWith("/path/to/test.jpg")
      expect(mockFile.exists).toHaveBeenCalled()
      expect(mockFile.arrayBuffer).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe("uploadImageFromUrl", () => {
    it("should upload image from URL", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { processed: true } })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).uploadImageFromUrl("/process", "https://example.com/image.jpg")

      expect(result.ok).toBe(true)
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
        json: async () => ({ ok: true })
      }
      mockFetch.mockResolvedValueOnce(mockResponse)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ok: true,
        data: { altText: "A beautiful landscape", confidence: 0.95 }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.generateAltTextFromUrl("https://example.com/image.jpg")

    expect(result.ok).toBe(true)
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
        ok: true,
        data: { altText: "A test image" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.generateAltTextFromBase64("base64data")

    expect(result.ok).toBe(true)
    expect(result.data?.altText).toBe("A test image")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ image: "base64data" })
      })
    )
  })

  it("should generate alt text from file", async () => {
    // Mock Bun.file
    const mockFile = {
      exists: vi.fn().mockResolvedValue(true),
      arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("image file content"))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
    global.Bun = mockBun

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: { altText: "An uploaded image", confidence: 0.89 }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.generateAltTextFromFile("/path/to/image.png")

    expect(result.ok).toBe(true)
    expect(result.data?.altText).toBe("An uploaded image")
    expect(result.data?.confidence).toBe(0.89)
    expect(mockBun.file).toHaveBeenCalledWith("/path/to/image.png")
    expect(mockFile.exists).toHaveBeenCalled()
    expect(mockFile.arrayBuffer).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.example.com/api/ai/alt?token=test-token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          image: Buffer.from("image file content").toString("base64")
        })
      })
    )
  })

  it("should handle file not found in generateAltTextFromFile", async () => {
    // Mock Bun.file for non-existent file
    const mockFile = {
      exists: vi.fn().mockResolvedValue(false)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
    global.Bun = mockBun

    const result = await adapter.generateAltTextFromFile("/path/to/missing.jpg")

    expect(result.ok).toBe(false)
    expect(result.error).toBe("File not found: /path/to/missing.jpg")
    expect(mockBun.file).toHaveBeenCalledWith("/path/to/missing.jpg")
    expect(mockFile.exists).toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe("ImageAdapter", () => {
  let adapter: ImageAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new ImageAdapter(config)
    mockFetch.mockClear()
  })

  it("should optimize image from URL", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
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

    expect(result.ok).toBe(true)
    expect(result.data?.compressionRatio).toBe(0.5)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("quality=80"),
      expect.objectContaining({ method: "GET" })
    )
  })

  it("should optimize image from file", async () => {
    // Mock Bun.file
    const mockFile = {
      exists: vi.fn().mockResolvedValue(true),
      arrayBuffer: vi.fn().mockResolvedValue(Buffer.from("jpeg file content"))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
    global.Bun = mockBun

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          optimisedImage: "optimized-base64",
          originalSize: 2000,
          optimisedSize: 800,
          compressionRatio: 0.6
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.optimiseFromFile("/path/to/image.jpg", 90)

    expect(result.ok).toBe(true)
    expect(result.data?.compressionRatio).toBe(0.6)
    expect(mockBun.file).toHaveBeenCalledWith("/path/to/image.jpg")
    expect(mockFile.exists).toHaveBeenCalled()
    expect(mockFile.arrayBuffer).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          image: Buffer.from("jpeg file content").toString("base64"),
          quality: 90
        })
      })
    )
  })

  it("should handle file not found in optimiseFromFile", async () => {
    // Mock Bun.file for non-existent file
    const mockFile = {
      exists: vi.fn().mockResolvedValue(false)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockBun = { file: vi.fn().mockReturnValue(mockFile) } as any
    global.Bun = mockBun

    const result = await adapter.optimiseFromFile("/path/to/nonexistent.jpg")

    expect(result.ok).toBe(false)
    expect(result.error).toBe("File not found: /path/to/nonexistent.jpg")
    expect(mockBun.file).toHaveBeenCalledWith("/path/to/nonexistent.jpg")
    expect(mockFile.exists).toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("should optimize image from base64", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: { optimisedImage: "optimized-base64" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.optimiseFromBase64("base64data", 75)

    expect(result.ok).toBe(true)
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
    adapter = new ImageAdapter(noTokenConfig)

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
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

  it("should ping server and get comprehensive system info with auth and headers", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          cloudflare: {
            connectingIP: "86.19.83.9",
            country: {
              ip: "GB",
              primary: "GB"
            },
            datacentre: "94e",
            ray: "test-ray",
            request: {
              agent: "test-agent",
              host: "test.example.com",
              method: "GET",
              path: "/api/ping",
              proto: {
                forward: "https",
                request: "https"
              },
              version: "1.1"
            }
          },
          worker: {
            edge_functions: true,
            environment: "test",
            limits: {
              cpu_time: "50ms (startup) + 50ms (request)",
              memory: "128MB",
              request_timeout: "30s"
            },
            preset: "cloudflare_module",
            runtime: "cloudflare-workers",
            server_side_rendering: true,
            version: "1.0.0"
          }
        },
        auth: {
          supplied: false
        },
        headers: {
          count: 5,
          cloudflare: {},
          forwarding: {},
          other: {}
        },
        timestamp: "2023-01-01T00:00:00Z"
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.ping()

    expect(result.ok).toBe(true)
    expect(result.data?.worker?.environment).toBe("test")
    expect(result.data?.worker?.edge_functions).toBe(true)
    expect(result.data?.cloudflare?.ray).toBe("test-ray")
    expect(result.auth?.supplied).toBe(false)
    expect(result.headers?.count).toBe(5)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/ping"), expect.any(Object))
  })
})

describe("TokenAdapter", () => {
  let adapter: TokenAdapter
  let config: RequestConfig

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://test.example.com",
      timeout: 5000,
      verbose: false,
      dryRun: false
    }
    adapter = new TokenAdapter(config)
    mockFetch.mockClear()
  })

  it("should get token info", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          uuid: "test-uuid",
          usage: { total: 100, success: 95, error: 5 }
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.getTokenInfo("test-uuid")

    expect(result.ok).toBe(true)
    expect(result.data?.uuid).toBe("test-uuid")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/token/test-uuid"), expect.any(Object))
  })

  it("should revoke token", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: { revoked: true, uuid: "test-uuid" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.revokeToken("test-uuid")

    expect(result.ok).toBe(true)
    expect(result.data?.revoked).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/token/test-uuid/revoke"),
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
        ok: true,
        data: { revoked: false, uuid: "test-uuid" }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.unrevokeToken("test-uuid")

    expect(result.ok).toBe(true)
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
        ok: true,
        data: {
          name: "test-dashboard",
          data: { metrics: 123 },
          timestamp: "2023-01-01T00:00:00Z"
        }
      })
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const result = await adapter.getDashboardData("test-dashboard")

    expect(result.ok).toBe(true)
    expect(result.data?.name).toBe("test-dashboard")
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard/test-dashboard"), expect.any(Object))
  })
})
