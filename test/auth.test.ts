import type { IncomingMessage, ServerResponse } from "node:http"
import type { H3Event } from "h3"
import { SignJWT } from "jose"
import { beforeEach, describe, expect, it } from "vitest"
import {
  authorizeEndpoint,
  checkEndpointPermission,
  extractToken,
  getUserFromPayload,
  verifyJWT
} from "../server/utils/auth"

// Mock H3Event for testing - this is a simplified version for unit testing
function mockH3Event(headers: Record<string, string> = {}, query: Record<string, unknown> = {}): H3Event {
  return {
    node: {
      req: {
        headers
      },
      res: {} as ServerResponse
    },
    query,
    __is_event__: true,
    context: {},
    _handled: false,
    _onBeforeResponseCalled: false,
    _onAfterResponseCalled: false,
    method: "GET",
    path: "/test",
    headers: new Headers(),
    handled: false,
    body: undefined,
    params: {},
    fetch: undefined,
    clientAddress: "127.0.0.1",
    locals: {},
    redirect: () => {},
    respondWith: () => {},
    waitUntil: () => {},
    upgradeWebSocket: () => {},
    captureError: () => {},
    req: {} as IncomingMessage,
    res: {} as ServerResponse,
    $fetch: {} as unknown,
    toJSON: () => ({})
  } as unknown as H3Event
} // Mock getHeader function

;(
  global as unknown as {
    getHeader: (event: H3Event, name: string) => string | undefined
  }
).getHeader = (event: H3Event, name: string) => {
  return (
    event as unknown as {
      node: { req: { headers: Record<string, string> } }
    }
  )?.node?.req?.headers?.[name.toLowerCase()]
} // Mock getQuery function
;(global as unknown as { getQuery: (event: H3Event) => Record<string, unknown> }).getQuery = (event: H3Event) => {
  return (event as unknown as { query: Record<string, unknown> })?.query || {}
}

describe("Authentication System", () => {
  // Use a dynamically generated test secret to avoid hardcoded password warnings
  const testSecret = `test-secret-${Math.random().toString(36).substring(2)}-${Date.now()}`

  beforeEach(() => {
    // Reset any global state if needed
  })

  describe("extractToken", () => {
    it("should extract token from Authorization header", () => {
      const event = mockH3Event({
        authorization: "Bearer test-token-here"
      })

      const token = extractToken(event)
      expect(token).toBe("test-token-here")
    })

    it("should extract token from query parameter", () => {
      const event = mockH3Event(
        {},
        {
          token: "query-token-here"
        }
      )

      const token = extractToken(event)
      expect(token).toBe("query-token-here")
    })

    it("should prefer Authorization header over query parameter", () => {
      const event = mockH3Event(
        {
          authorization: "Bearer header-token"
        },
        {
          token: "query-token"
        }
      )

      const token = extractToken(event)
      expect(token).toBe("header-token")
    })

    it("should return null when no token is found", () => {
      const event = mockH3Event()

      const token = extractToken(event)
      expect(token).toBeNull()
    })

    it("should return null for malformed Authorization header", () => {
      const event = mockH3Event({
        authorization: "Basic some-basic-auth"
      })

      const token = extractToken(event)
      expect(token).toBeNull()
    })
  })

  describe("verifyJWT", () => {
    it("should verify a valid JWT token", async () => {
      // Create a test token
      const encoder = new TextEncoder()
      const secretKey = encoder.encode(testSecret)

      const now = Math.floor(Date.now() / 1000)
      const token = await new SignJWT({
        sub: "test-user",
        iat: now,
        exp: now + 3600, // 1 hour
        jti: "test-jti"
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secretKey)

      const result = await verifyJWT(token, testSecret)

      expect(result.success).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload?.sub).toBe("test-user")
    })

    it("should reject token with invalid signature", async () => {
      const result = await verifyJWT("invalid.token.here", testSecret)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("should reject expired token", async () => {
      // Create an expired token
      const encoder = new TextEncoder()
      const secretKey = encoder.encode(testSecret)

      const now = Math.floor(Date.now() / 1000)
      const token = await new SignJWT({
        sub: "test-user",
        iat: now - 7200, // 2 hours ago
        exp: now - 3600, // 1 hour ago (expired)
        jti: "test-jti"
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secretKey)

      const result = await verifyJWT(token, testSecret)

      expect(result.success).toBe(false)
      expect(result.error).toContain("timestamp check failed")
    })

    it("should reject token without required subject", async () => {
      const encoder = new TextEncoder()
      const secretKey = encoder.encode(testSecret)

      const now = Math.floor(Date.now() / 1000)
      const token = await new SignJWT({
        iat: now,
        exp: now + 3600
      })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secretKey)

      const result = await verifyJWT(token, testSecret)

      expect(result.success).toBe(false)
      expect(result.error).toContain("missing subject")
    })
  })

  describe("checkEndpointPermission", () => {
    it("should allow exact match permissions", () => {
      expect(checkEndpointPermission("api:metrics", "api:metrics")).toBe(true)
      expect(checkEndpointPermission("ai:social", "ai:social")).toBe(true)
    })

    it("should allow parent permissions for hierarchical endpoints", () => {
      expect(checkEndpointPermission("api", "api:metrics")).toBe(true)
      expect(checkEndpointPermission("ai", "ai:social")).toBe(true)
      expect(checkEndpointPermission("api", "api:token")).toBe(true)
    })

    it("should allow admin and wildcard permissions", () => {
      expect(checkEndpointPermission("admin", "api:metrics")).toBe(true)
      expect(checkEndpointPermission("*", "ai:social")).toBe(true)
      expect(checkEndpointPermission("admin", "any:endpoint")).toBe(true)
    })

    it("should reject insufficient permissions", () => {
      expect(checkEndpointPermission("ai:social", "api:metrics")).toBe(false)
      expect(checkEndpointPermission("api:metrics", "ai:social")).toBe(false)
      expect(checkEndpointPermission("user", "admin:panel")).toBe(false)
    })

    it("should not allow child permissions for parent endpoints", () => {
      expect(checkEndpointPermission("api:metrics", "api")).toBe(false)
      expect(checkEndpointPermission("ai:social", "ai")).toBe(false)
    })
  })

  describe("getUserFromPayload", () => {
    it("should extract user information from JWT payload", () => {
      const payload = {
        sub: "test-user",
        iat: 1609459200, // 2021-01-01 00:00:00 UTC
        exp: 1609545600, // 2021-01-02 00:00:00 UTC
        jti: "test-token-id"
      }

      const user = getUserFromPayload(payload)

      expect(user.id).toBe("test-user")
      expect(user.issuedAt).toEqual(new Date(1609459200 * 1000))
      expect(user.expiresAt).toEqual(new Date(1609545600 * 1000))
      expect(user.tokenId).toBe("test-token-id")
    })

    it("should handle payload without expiration", () => {
      const payload = {
        sub: "test-user",
        iat: 1609459200,
        jti: "test-token-id"
      }

      const user = getUserFromPayload(payload)

      expect(user.id).toBe("test-user")
      expect(user.issuedAt).toEqual(new Date(1609459200 * 1000))
      expect(user.expiresAt).toBeNull()
      expect(user.tokenId).toBe("test-token-id")
    })
  })

  describe("authorizeEndpoint", () => {
    it("should use Secrets Store value when available", async () => {
      const envSecret = "env-secret"
      const configSecret = "config-secret"
      const now = Math.floor(Date.now() / 1000)

      const encoder = new TextEncoder()
      const token = await new SignJWT({ sub: "api", iat: now })
        .setProtectedHeader({ alg: "HS256" })
        .sign(encoder.encode(envSecret))

      const event = mockH3Event({ authorization: `Bearer ${token}` })
      ;(event.context as { cloudflare?: { env?: Record<string, unknown> } }) = {
        cloudflare: {
          env: {
            API_JWT_SECRET: {
              get: async () => envSecret
            }
          }
        }
      }
      ;(
        global as typeof globalThis & {
          useRuntimeConfig: () => { apiJwtSecret: string }
        }
      ).useRuntimeConfig = () => ({
        apiJwtSecret: configSecret
      })

      const authFunc = await authorizeEndpoint("api")
      const result = await authFunc(event)

      // Should successfully verify with the Secrets Store value
      expect(result.success).toBe(true)
    })
  })
})
