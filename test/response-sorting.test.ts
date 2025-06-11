import { describe, expect, it } from "vitest"
import { createApiResponse } from "../server/utils/response"

describe("Response Sorting Integration", () => {
  it("should automatically sort keys in createApiResponse", () => {
    const data = {
      zebra: "animal",
      apple: "fruit",
      banana: "fruit",
      nested: {
        zulu: "letter",
        alpha: "letter",
        bravo: "letter"
      }
    }

    const response = createApiResponse(data, "Test message")

    // Check that top-level keys are sorted
    const topKeys = Object.keys(response)
    expect(topKeys).toEqual(["data", "message", "ok", "timestamp"])

    // Check that data keys are sorted
    const dataKeys = Object.keys(response.data)
    expect(dataKeys).toEqual(["apple", "banana", "nested", "zebra"])

    // Check that nested object keys are sorted
    const nestedKeys = Object.keys(response.data.nested)
    expect(nestedKeys).toEqual(["alpha", "bravo", "zulu"])
  })

  it("should handle complex nested structures", () => {
    const complexData = {
      worker: {
        version: "1.0.0",
        environment: "test",
        limits: {
          request_timeout: "30s",
          memory: "128MB",
          cpu_time: "50ms"
        }
      },
      cloudflare: {
        ray: "test-ray",
        country: {
          primary: "GB",
          ip: "GB"
        },
        connectingIP: "86.19.83.9"
      }
    }

    const response = createApiResponse(complexData, "Complex test")

    // Verify deeply nested structures are sorted
    expect(Object.keys(response.data.worker.limits)).toEqual(["cpu_time", "memory", "request_timeout"])

    expect(Object.keys(response.data.cloudflare.country)).toEqual(["ip", "primary"])
  })

  it("should handle arrays with objects", () => {
    const dataWithArrays = {
      items: [
        { zebra: "z", apple: "a" },
        { charlie: "c", bravo: "b" }
      ],
      metadata: {
        total: 2,
        page: 1
      }
    }

    const response = createApiResponse(dataWithArrays, "Array test")

    // Check that objects within arrays are sorted
    expect(Object.keys(response.data.items[0])).toEqual(["apple", "zebra"])
    expect(Object.keys(response.data.items[1])).toEqual(["bravo", "charlie"])

    // Check that sibling objects are sorted
    expect(Object.keys(response.data.metadata)).toEqual(["page", "total"])
  })

  it("should preserve response structure integrity", () => {
    const data = { test: "value" }
    const response = createApiResponse(data, "Test message", {
      total: 100,
      page: 1
    })

    // Verify response still has required fields
    expect(response).toHaveProperty("ok", true)
    expect(response).toHaveProperty("data")
    expect(response).toHaveProperty("message", "Test message")
    expect(response).toHaveProperty("timestamp")
    expect(response).toHaveProperty("meta")

    // Verify meta object is also sorted
    expect(response.meta).toBeDefined()
    expect(Object.keys(response.meta || {})).toEqual(["page", "total"])
  })
})
