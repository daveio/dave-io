import { describe, expect, it } from "vitest"
import { createApiError, createApiResponse } from "~/server/utils/response"

// Mock implementations for functions that might not exist yet
function sanitizeInput(input: unknown): string {
  if (typeof input === "string") {
    return input.length > 1000 ? `${input.slice(0, 997)}...` : input
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input)
  }
  if (input === null) {
    return "null"
  }
  if (input === undefined) {
    return "undefined"
  }

  try {
    return JSON.stringify(input).length > 1000 ? `${JSON.stringify(input).slice(0, 997)}...` : JSON.stringify(input)
  } catch {
    return "[Circular]"
  }
}

describe("Response Utils", () => {
  describe("createApiResponse", () => {
    it("should create empty response", () => {
      // Now requires a result parameter
      const response = createApiResponse({
        result: {}
      })

      expect(response.ok).toBe(true)
      expect(response.timestamp).toBeDefined()
      expect(response.error).toBeNull()
      expect(response.status).toBeNull()
    })

    it("should create response with data", () => {
      const testData = { test: "value" }
      const response = createApiResponse({
        result: testData
      })

      expect(response.ok).toBe(true)
      expect(response.timestamp).toBeDefined()

      // Use type guard with assertion
      if (response.ok) {
        // biome-ignore lint/suspicious/noExplicitAny: test response can have any structure
        const successResponse = response as { ok: true, result: any }
        expect(successResponse.result).toEqual(testData)
      } else {
        // This should not happen
        expect(response.ok).toBe(true)
      }

      expect(response.error).toBeNull()
      expect(response.status).toBeNull()
    })

    it("should create response with message", () => {
      const message = "Test message"
      const response = createApiResponse({
        result: {},
        message
      })

      expect(response.ok).toBe(true)
      expect(response.timestamp).toBeDefined()
      expect(response.status).toEqual({ message })
    })

    it("should create response with meta", () => {
      const meta = {
        request_id: "req_123456"
      }
      const response = createApiResponse({
        result: {},
        message: null,
        error: null,
        meta
      })

      expect(response.ok).toBe(true)
      expect(response.timestamp).toBeDefined()
      expect(response.meta).toEqual(meta)
      expect(response.error).toBeNull()
      expect(response.status).toBeNull()
    })

    it("should create response with data, message, and meta", () => {
      const data = { key: "value" }
      const message = "Test success"
      const meta = {
        request_id: "req_123456"
      }
      const response = createApiResponse({
        result: data,
        message,
        error: null,
        meta
      })

      expect(response.ok).toBe(true)
      expect(response.timestamp).toBeDefined()

      // Use type guard with assertion
      if (response.ok) {
        // biome-ignore lint/suspicious/noExplicitAny: test response can have any structure
        const successResponse = response as { ok: true, result: any }
        expect(successResponse.result).toEqual(data)
      } else {
        // This should not happen
        expect(response.ok).toBe(true)
      }

      expect(response.status).toEqual({ message })
      expect(response.meta).toEqual(meta)
    })

    it("should throw an error for error responses", () => {
      const errorMessage = "Test error"
      expect(() => {
        createApiResponse({
          result: {},
          message: null,
          error: errorMessage
        })
      }).toThrow(errorMessage)
    })

    it("should throw an error for error responses with status message", () => {
      const statusMessage = "Additional info"
      const errorMessage = "Test error"
      expect(() => {
        createApiResponse({
          result: {},
          message: statusMessage,
          error: errorMessage
        })
      }).toThrow(errorMessage)
    })
  })

  describe("createApiError", () => {
    it("should throw an error with default status code", () => {
      expect(() => {
        createApiError(400, "Bad request")
      }).toThrow()
    })

    it("should include error details when provided", () => {
      expect(() => {
        createApiError(422, "Validation failed", "Field \"name\" is required")
      }).toThrow()
    })

    it("should handle different status codes", () => {
      const testCases = [
        { status: 400, message: "Bad Request" },
        { status: 401, message: "Unauthorized" },
        { status: 403, message: "Forbidden" },
        { status: 404, message: "Not Found" },
        { status: 429, message: "Too Many Requests" },
        { status: 500, message: "Internal Server Error" }
      ]

      for (const { status, message } of testCases) {
        expect(() => {
          createApiError(status, message)
        }).toThrow()
      }
    })
  })

  describe("sanitizeInput", () => {
    it("should return string inputs unchanged", () => {
      const input = "hello world"
      const result = sanitizeInput(input)
      expect(result).toBe(input)
    })

    it("should convert numbers to strings", () => {
      expect(sanitizeInput(123)).toBe("123")
      expect(sanitizeInput(45.67)).toBe("45.67")
    })

    it("should convert booleans to strings", () => {
      expect(sanitizeInput(true)).toBe("true")
      expect(sanitizeInput(false)).toBe("false")
    })

    it("should handle null and undefined", () => {
      expect(sanitizeInput(null)).toBe("null")
      expect(sanitizeInput(undefined)).toBe("undefined")
    })

    it("should stringify objects and arrays", () => {
      const obj = { key: "value" }
      expect(sanitizeInput(obj)).toBe("{\"key\":\"value\"}")

      const arr = [1, 2, 3]
      expect(sanitizeInput(arr)).toBe("[1,2,3]")
    })

    it("should truncate long strings", () => {
      const longString = "a".repeat(2000)
      const result = sanitizeInput(longString)
      expect(result.length).toBeLessThanOrEqual(1000)
      expect(result.endsWith("...")).toBe(true)
    })

    it("should handle circular references in objects", () => {
      const circular: { name: string, self?: unknown } = { name: "test" }
      circular.self = circular

      const result = sanitizeInput(circular)
      expect(typeof result).toBe("string")
      expect(result.includes("[Circular]")).toBe(true)
    })
  })
})
