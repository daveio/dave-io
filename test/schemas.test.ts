import { describe, expect, it } from "vitest"
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  AuthIntrospectionSchema,
  JWTPayloadSchema,
  KVDataSchema,
  KVRedirectMappingSchema,
  TokenMetricsSchema,
  TokenUsageSchema
} from "../server/utils/schemas"

describe("API Schemas", () => {
  describe("ApiSuccessResponseSchema", () => {
    it("should validate a complete success response", () => {
      const response = {
        ok: true,
        result: { test: "data" },
        message: "Operation successful",
        error: null,
        status: { message: "Operation successful" },
        meta: {
          requestId: "req-123",
          timestamp: "2025-01-01T00:00:00.000Z",
          cfRay: "ray-123",
          datacenter: "SJC",
          country: "US"
        },
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiSuccessResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ok).toBe(true)
        expect(result.data.result).toEqual({ test: "data" })
      }
    })

    it("should validate minimal success response", () => {
      const response = {
        ok: true,
        result: {},
        message: "Success",
        error: null,
        status: { message: "Success" },
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiSuccessResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it("should reject response with ok: false", () => {
      const response = {
        ok: false,
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiSuccessResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })
  })

  describe("ApiErrorResponseSchema", () => {
    it("should validate a complete error response", () => {
      const response = {
        ok: false,
        error: "Validation failed",
        message: "Validation error occurred",
        status: { message: "Validation error occurred" },
        details: 'Field "name" is required',
        meta: {
          requestId: "req-123",
          timestamp: "2025-01-01T00:00:00.000Z"
        },
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiErrorResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ok).toBe(false)
        expect(result.data.error).toBe("Validation failed")
      }
    })

    it("should validate minimal error response", () => {
      const response = {
        ok: false,
        error: "Something went wrong",
        message: "Error occurred",
        status: { message: "Error occurred" },
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiErrorResponseSchema.safeParse(response)
      expect(result.success).toBe(true)
    })

    it("should reject response with ok: true", () => {
      const response = {
        ok: true,
        error: "This should not work",
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = ApiErrorResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })
  })

  describe("JWTPayloadSchema", () => {
    it("should validate a complete JWT payload", () => {
      const payload = {
        sub: "api:metrics",
        iat: 1609459200,
        exp: 1609545600,
        jti: "test-token-id"
      }

      const result = JWTPayloadSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sub).toBe("api:metrics")
      }
    })

    it("should validate minimal JWT payload", () => {
      const payload = {
        sub: "test-user",
        iat: 1609459200
      }

      const result = JWTPayloadSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it("should reject payload without required fields", () => {
      const payload = {
        iat: 1609459200
        // missing sub
      }

      const result = JWTPayloadSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe("TokenUsageSchema", () => {
    it("should validate token usage data", () => {
      const usage = {
        token_id: "test-token-id",
        usage_count: 42,
        max_requests: 100,
        created_at: "2025-01-01T00:00:00.000Z",
        last_used: "2025-01-01T12:00:00.000Z"
      }

      const result = TokenUsageSchema.safeParse(usage)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.usage_count).toBe(42)
        expect(result.data.max_requests).toBe(100)
      }
    })

    it("should handle unlimited tokens", () => {
      const usage = {
        token_id: "unlimited-token",
        usage_count: 1000,
        max_requests: null,
        created_at: "2025-01-01T00:00:00.000Z",
        last_used: "2025-01-01T12:00:00.000Z"
      }

      const result = TokenUsageSchema.safeParse(usage)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.max_requests).toBeNull()
      }
    })
  })

  describe("TokenMetricsSchema", () => {
    it("should validate token metrics response", () => {
      const metrics = {
        ok: true,
        data: {
          total_requests: 1000,
          successful_requests: 950,
          failed_requests: 50,
          redirect_clicks: 25
        },
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = TokenMetricsSchema.safeParse(metrics)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.total_requests).toBe(1000)
        expect(result.data.data.redirect_clicks).toBe(25)
      }
    })
  })

  describe("AuthIntrospectionSchema", () => {
    it("should validate auth introspection response", () => {
      const introspection = {
        ok: true,
        data: {
          valid: true,
          payload: {
            sub: "api:metrics",
            iat: 1609459200,
            exp: 1609545600,
            jti: "test-token-id"
          },
          user: {
            id: "api:metrics",
            issuedAt: "2025-01-01T00:00:00.000Z",
            expiresAt: "2025-01-02T00:00:00.000Z",
            tokenId: "test-token-id"
          }
        },
        message: "Token is valid",
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = AuthIntrospectionSchema.safeParse(introspection)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.valid).toBe(true)
        expect(result.data.data.user?.id).toBe("api:metrics")
      }
    })

    it("should validate invalid token response", () => {
      const introspection = {
        ok: false,
        data: {
          valid: false,
          error: "Token expired"
        },
        message: "Token validation failed",
        timestamp: "2025-01-01T00:00:00.000Z"
      }

      const result = AuthIntrospectionSchema.safeParse(introspection)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.valid).toBe(false)
        expect(result.data.data.error).toBe("Token expired")
      }
    })
  })

  describe("New KV Schema Tests", () => {
    describe("KVRedirectMappingSchema", () => {
      it("should validate redirect mappings", () => {
        const redirectMapping = {
          gh: "https://github.com/daveio",
          blog: "https://blog.dave.io",
          tw: "https://twitter.com/daveio"
        }

        const result = KVRedirectMappingSchema.safeParse(redirectMapping)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.gh).toBe("https://github.com/daveio")
          expect(result.data.blog).toBe("https://blog.dave.io")
        }
      })

      it("should reject invalid URLs", () => {
        const redirectMapping = {
          gh: "not-a-url",
          blog: "https://blog.dave.io"
        }

        const result = KVRedirectMappingSchema.safeParse(redirectMapping)
        expect(result.success).toBe(false)
      })
    })

    describe("KVDataSchema", () => {
      it("should validate complete KV data structure", () => {
        const kvData = {
          redirect: {
            gh: "https://github.com/daveio",
            blog: "https://blog.dave.io",
            tw: "https://twitter.com/daveio"
          }
        }

        const result = KVDataSchema.safeParse(kvData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.redirect.gh).toBe("https://github.com/daveio")
          expect(result.data.redirect.blog).toBe("https://blog.dave.io")
          expect(result.data.redirect.tw).toBe("https://twitter.com/daveio")
        }
      })
    })
  })
})
