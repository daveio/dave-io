import { describe, expect, it } from "vitest"
import { hasPermission, validateTokenPermissions } from "~/server/utils/auth"

describe("JWT Hierarchical Permissions", () => {
  describe("hasPermission", () => {
    it("should grant access with exact permission match", () => {
      const permissions = ["api:metrics"]
      expect(hasPermission(permissions, "api:metrics")).toBe(true)
    })

    it("should grant access with parent permission", () => {
      const permissions = ["api"]
      expect(hasPermission(permissions, "api:metrics")).toBe(true)
      expect(hasPermission(permissions, "api:auth")).toBe(true)
      expect(hasPermission(permissions, "api:tokens")).toBe(true)
    })

    it("should grant access with admin permission", () => {
      const permissions = ["admin"]
      expect(hasPermission(permissions, "api:metrics")).toBe(true)
      expect(hasPermission(permissions, "routeros:cache")).toBe(true)
      expect(hasPermission(permissions, "dashboard:view")).toBe(true)
    })

    it("should grant access with wildcard permission", () => {
      const permissions = ["*"]
      expect(hasPermission(permissions, "api:metrics")).toBe(true)
      expect(hasPermission(permissions, "routeros:cache")).toBe(true)
      expect(hasPermission(permissions, "any:permission")).toBe(true)
    })

    it("should deny access without required permission", () => {
      const permissions = ["api:read"]
      expect(hasPermission(permissions, "routeros:cache")).toBe(false)
      expect(hasPermission(permissions, "dashboard:admin")).toBe(false)
    })

    it("should deny access with empty permissions", () => {
      const permissions: string[] = []
      expect(hasPermission(permissions, "api:metrics")).toBe(false)
    })

    it("should handle multiple permissions correctly", () => {
      const permissions = ["api:read", "routeros:cache", "dashboard:view"]
      expect(hasPermission(permissions, "api:read")).toBe(true)
      expect(hasPermission(permissions, "routeros:cache")).toBe(true)
      expect(hasPermission(permissions, "dashboard:view")).toBe(true)
      expect(hasPermission(permissions, "api:write")).toBe(false)
    })

    it("should handle nested hierarchy correctly", () => {
      const permissions = ["api"]
      expect(hasPermission(permissions, "api:tokens:create")).toBe(true)
      expect(hasPermission(permissions, "api:metrics:view")).toBe(true)

      const specificPermissions = ["api:tokens"]
      expect(hasPermission(specificPermissions, "api:tokens:create")).toBe(true)
      expect(hasPermission(specificPermissions, "api:tokens:revoke")).toBe(true)
      expect(hasPermission(specificPermissions, "api:metrics:view")).toBe(false)
    })
  })

  describe("validateTokenPermissions", () => {
    it("should validate token with required permission", () => {
      const token = {
        sub: "user@example.com",
        permissions: ["api:metrics"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(token, "api:metrics")).toBe(true)
    })

    it("should reject token without required permission", () => {
      const token = {
        sub: "user@example.com",
        permissions: ["api:read"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(token, "routeros:cache")).toBe(false)
    })

    it("should reject expired token", () => {
      const token = {
        sub: "user@example.com",
        permissions: ["api:metrics"],
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
      }

      expect(validateTokenPermissions(token, "api:metrics")).toBe(false)
    })

    it("should accept token without expiry", () => {
      const token = {
        sub: "user@example.com",
        permissions: ["api:metrics"],
        iat: Math.floor(Date.now() / 1000)
        // No exp field - should not expire
      }

      expect(validateTokenPermissions(token, "api:metrics")).toBe(true)
    })

    it("should handle token with multiple permissions", () => {
      const token = {
        sub: "admin@example.com",
        permissions: ["api", "routeros", "dashboard"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(token, "api:metrics")).toBe(true)
      expect(validateTokenPermissions(token, "routeros:cache")).toBe(true)
      expect(validateTokenPermissions(token, "dashboard:view")).toBe(true)
      expect(validateTokenPermissions(token, "ai:alt")).toBe(false)
    })
  })

  describe("Permission Edge Cases", () => {
    it("should handle case-sensitive permissions", () => {
      const permissions = ["API:METRICS"] // Wrong case
      expect(hasPermission(permissions, "api:metrics")).toBe(false)
    })

    it("should handle whitespace in permissions", () => {
      const permissions = [" api:metrics ", "routeros:cache"]
      // Assuming permissions are normalized
      expect(
        hasPermission(
          permissions.map((p) => p.trim()),
          "api:metrics"
        )
      ).toBe(true)
    })

    it("should handle colon-only permissions", () => {
      const permissions = [":"]
      expect(hasPermission(permissions, "api:metrics")).toBe(false)
    })

    it("should handle permissions with multiple colons", () => {
      const permissions = ["api:tokens:admin"]
      expect(hasPermission(permissions, "api:tokens:admin:create")).toBe(true)
      expect(hasPermission(permissions, "api:tokens:user")).toBe(false)
    })

    it("should handle permission inheritance correctly", () => {
      // Test that admin > category > specific permission hierarchy works
      const adminPermissions = ["admin"]
      const categoryPermissions = ["api"]
      const specificPermissions = ["api:metrics"]

      const requiredPermission = "api:metrics"

      expect(hasPermission(adminPermissions, requiredPermission)).toBe(true)
      expect(hasPermission(categoryPermissions, requiredPermission)).toBe(true)
      expect(hasPermission(specificPermissions, requiredPermission)).toBe(true)

      // But specific doesn't grant category-level access for different endpoints
      expect(hasPermission(specificPermissions, "api:auth")).toBe(false)
    })
  })

  describe("Real-world Permission Scenarios", () => {
    it("should handle dashboard access", () => {
      const readOnlyToken = {
        sub: "viewer@example.com",
        permissions: ["dashboard:view"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(readOnlyToken, "dashboard:view")).toBe(true)
      expect(validateTokenPermissions(readOnlyToken, "dashboard:admin")).toBe(false)
    })

    it("should handle AI endpoint access", () => {
      const aiToken = {
        sub: "ai-user@example.com",
        permissions: ["ai:alt"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(aiToken, "ai:alt")).toBe(true)
      expect(validateTokenPermissions(aiToken, "api:metrics")).toBe(false)
    })

    it("should handle RouterOS integration access", () => {
      const routerosToken = {
        sub: "routeros-service@example.com",
        permissions: ["routeros"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(routerosToken, "routeros:cache")).toBe(true)
      expect(validateTokenPermissions(routerosToken, "routeros:putio")).toBe(true)
      expect(validateTokenPermissions(routerosToken, "routeros:reset")).toBe(true)
      expect(validateTokenPermissions(routerosToken, "api:metrics")).toBe(false)
    })

    it("should handle token management permissions", () => {
      const tokenAdminToken = {
        sub: "token-admin@example.com",
        permissions: ["api:tokens"],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      expect(validateTokenPermissions(tokenAdminToken, "api:tokens:usage")).toBe(true)
      expect(validateTokenPermissions(tokenAdminToken, "api:tokens:revoke")).toBe(true)
      expect(validateTokenPermissions(tokenAdminToken, "api:metrics")).toBe(false)
    })
  })
})
