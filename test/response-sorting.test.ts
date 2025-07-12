import { describe, expect, it } from "vitest"
import { createApiResponse } from "../server/utils/response"

describe("Response Sorting Integration", () => {
  it("should sort keys in response object", () => {
    const data = {
      zebra: true,
      apple: 123,
      nested: {
        zulu: "z",
        bravo: "b",
        alpha: "a"
      },
      banana: "yellow"
    }

    const response = createApiResponse({
      result: data
    })

    // Check that top-level keys are sorted
    const topKeys = Object.keys(response)
    expect(topKeys).toEqual(["ok", "result", "message", "error", "status", "timestamp"])

    // Type guard to ensure we're dealing with a success response
    if (response.ok) {
      // Use type assertion since we've verified the ok flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const successResponse = response as { ok: true; result: any }

      // Check that data keys are sorted
      const dataKeys = Object.keys(successResponse.result)
      expect(dataKeys).toEqual(["apple", "banana", "nested", "zebra"])

      // Check that nested object keys are sorted
      const nestedKeys = Object.keys(successResponse.result.nested)
      expect(nestedKeys).toEqual(["alpha", "bravo", "zulu"])
    } else {
      // This should not happen
      expect(response.ok).toBe(true) // Force test failure with message
    }
  })

  it("should handle deep nesting with consistency", () => {
    const complexData = {
      worker: {
        limits: {
          request_timeout: "30s",
          memory: "128MB",
          cpu_time: "50ms (startup) + 50ms (request)"
        },
        environment: "production",
        edge_functions: true,
        preset: "cloudflare_module",
        server_side_rendering: true,
        version: "1.0.0",
        runtime: "cloudflare-workers"
      },
      cloudflare: {
        connectingIP: "203.0.113.195",
        country: {
          primary: "US",
          ip: "US"
        },
        datacentre: "SFO",
        ray: "1234567890abcdef",
        request: {
          // Nested objects to test deep sorting
        }
      }
    }

    const response = createApiResponse({
      result: complexData,
      message: "Complex test"
    })

    // Verify top level sorting
    expect(Object.keys(response)).toEqual(["ok", "result", "message", "error", "status", "timestamp"])

    // Type guard to ensure we're dealing with a success response
    if (response.ok) {
      // Use type assertion since we've verified the ok flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const successResponse = response as { ok: true; result: any }

      // Verify nested structures have sorted keys
      expect(Object.keys(successResponse.result.worker.limits)).toEqual(["cpu_time", "memory", "request_timeout"])
      expect(Object.keys(successResponse.result.cloudflare.country)).toEqual(["ip", "primary"])
    } else {
      // This should not happen
      expect(response.ok).toBe(true) // Force test failure with message
    }
  })

  it("should handle arrays with objects", () => {
    const dataWithArrays = {
      items: [
        { zebra: true, apple: "fruit" },
        { charlie: "letter", bravo: "phonetic" }
      ],
      metadata: {
        total: 2,
        page: 1
      }
    }

    const response = createApiResponse({
      result: dataWithArrays,
      message: "Array test"
    })

    // Type guard to ensure we're dealing with a success response
    if (response.ok) {
      // Use type assertion since we've verified the ok flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const successResponse = response as { ok: true; result: any }

      // Verify that objects inside arrays also have sorted keys
      expect(Object.keys(successResponse.result.items[0])).toEqual(["apple", "zebra"])
      expect(Object.keys(successResponse.result.items[1])).toEqual(["bravo", "charlie"])

      // Verify that the rest of the response is still sorted
      expect(Object.keys(successResponse.result.metadata)).toEqual(["page", "total"])
    } else {
      // This should not happen
      expect(response.ok).toBe(true) // Force test failure with message
    }
  })

  it("should preserve response structure integrity", () => {
    const data = { a: 1, b: 2 }
    const meta = { total: 100, page: 1 }

    const response = createApiResponse({
      result: data,
      message: "Test message",
      error: null,
      meta
    })

    // Verify response still has required fields
    expect(response).toHaveProperty("ok", true)
    expect(response).toHaveProperty("result")
    expect(response).toHaveProperty("error", null)
    expect(response).toHaveProperty("status")
    expect(response).toHaveProperty("timestamp")
    expect(response).toHaveProperty("meta")
    expect(response.meta).toEqual(meta)

    // Keys should be alphabetically sorted
    expect(Object.keys(response)).toEqual(["ok", "result", "message", "error", "status", "meta", "timestamp"])
  })
})
