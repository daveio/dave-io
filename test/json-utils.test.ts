import { describe, expect, it } from "vitest"
import { prepareSortedApiResponse, sortJsonString, sortObjectKeysRecursively } from "../server/utils/json-utils"

describe("JSON Utilities", () => {
  describe("sortObjectKeysRecursively", () => {
    it("should sort simple object keys", () => {
      const input = {
        zebra: "animal",
        apple: "fruit",
        banana: "fruit"
      }
      const expected = {
        apple: "fruit",
        banana: "fruit",
        zebra: "animal"
      }
      expect(sortObjectKeysRecursively(input)).toEqual(expected)
    })

    it("should sort nested object keys recursively", () => {
      const input = {
        worker: {
          version: "1.0.0",
          environment: "test",
          edge_functions: true
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
      const expected = {
        cloudflare: {
          connectingIP: "86.19.83.9",
          country: {
            ip: "GB",
            primary: "GB"
          },
          ray: "test-ray"
        },
        worker: {
          edge_functions: true,
          environment: "test",
          version: "1.0.0"
        }
      }
      expect(sortObjectKeysRecursively(input)).toEqual(expected)
    })

    it("should handle arrays with objects", () => {
      const input = {
        items: [
          { zebra: "z", apple: "a" },
          { banana: "b", cherry: "c" }
        ],
        count: 2
      }
      const expected = {
        count: 2,
        items: [
          { apple: "a", zebra: "z" },
          { banana: "b", cherry: "c" }
        ]
      }
      expect(sortObjectKeysRecursively(input)).toEqual(expected)
    })

    it("should handle null and undefined values", () => {
      expect(sortObjectKeysRecursively(null)).toBe(null)
      expect(sortObjectKeysRecursively(undefined)).toBe(undefined)
    })

    it("should handle primitive values", () => {
      expect(sortObjectKeysRecursively("string")).toBe("string")
      expect(sortObjectKeysRecursively(123)).toBe(123)
      expect(sortObjectKeysRecursively(true)).toBe(true)
    })

    it("should handle arrays of primitives", () => {
      const input = ["zebra", "apple", "banana"]
      const expected = ["zebra", "apple", "banana"] // Array order preserved
      expect(sortObjectKeysRecursively(input)).toEqual(expected)
    })

    it("should handle complex nested structures", () => {
      const input = {
        ok: true,
        data: {
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
            request: {
              version: "1.1",
              path: "/api/ping",
              method: "GET",
              host: "test.example.com"
            },
            datacentre: "94e",
            connectingIP: "86.19.83.9"
          }
        },
        timestamp: "2023-01-01T00:00:00Z"
      }

      const result = sortObjectKeysRecursively(input)

      // Check top-level keys are sorted
      const topKeys = Object.keys(result)
      expect(topKeys).toEqual(["data", "ok", "timestamp"])

      // Check nested keys are sorted
      const dataKeys = Object.keys(result.data)
      expect(dataKeys).toEqual(["cloudflare", "worker"])

      const workerKeys = Object.keys(result.data.worker)
      expect(workerKeys).toEqual(["environment", "limits", "version"])

      const limitsKeys = Object.keys(result.data.worker.limits)
      expect(limitsKeys).toEqual(["cpu_time", "memory", "request_timeout"])
    })
  })

  describe("sortJsonString", () => {
    it("should sort JSON string keys", () => {
      const input = "{\"zebra\": \"animal\", \"apple\": \"fruit\"}"
      const result = sortJsonString(input)
      const parsed = JSON.parse(result)
      const keys = Object.keys(parsed)
      expect(keys).toEqual(["apple", "zebra"])
    })

    it("should handle invalid JSON gracefully", () => {
      const input = "not valid json"
      const result = sortJsonString(input)
      expect(result).toBe(input)
    })

    it("should format with proper indentation", () => {
      const input = "{\"b\": 1, \"a\": 2}"
      const result = sortJsonString(input)
      expect(result).toContain("\n") // Should have newlines for formatting
      expect(result).toBe("{\n  \"a\": 2,\n  \"b\": 1\n}")
    })
  })

  describe("prepareSortedApiResponse", () => {
    it("should prepare API response with sorted keys", () => {
      const input = {
        success: true,
        data: {
          zebra: "z",
          apple: "a"
        },
        timestamp: "2023-01-01T00:00:00Z"
      }

      const result = prepareSortedApiResponse(input)
      const keys = Object.keys(result)
      expect(keys).toEqual(["data", "success", "timestamp"])

      const dataKeys = Object.keys(result.data)
      expect(dataKeys).toEqual(["apple", "zebra"])
    })

    it("should handle ping response structure", () => {
      const input = {
        ok: true,
        data: {
          worker: {
            version: "1.0.0",
            environment: "test"
          },
          cloudflare: {
            ray: "test-ray",
            connectingIP: "86.19.83.9"
          }
        },
        auth: {
          supplied: false
        },
        headers: {
          count: 5
        },
        timestamp: "2023-01-01T00:00:00Z"
      }

      const result = prepareSortedApiResponse(input)

      // Check all levels are sorted
      expect(Object.keys(result)).toEqual(["auth", "data", "headers", "ok", "timestamp"])
      expect(Object.keys(result.data)).toEqual(["cloudflare", "worker"])
      expect(Object.keys(result.data.worker)).toEqual(["environment", "version"])
      expect(Object.keys(result.data.cloudflare)).toEqual(["connectingIP", "ray"])
    })
  })
})
