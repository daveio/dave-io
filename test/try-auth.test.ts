/// <reference types="bun-types" />
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the jwt module
vi.mock("../bin/jwt", () => ({
  createToken: vi.fn()
}))

// Mock the cli-utils module
vi.mock("../bin/shared/cli-utils", () => ({
  getJWTSecret: vi.fn()
}))

describe("try.ts Auth Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Token Generation", () => {
    it("should generate tokens with correct scopes", async () => {
      const { createToken } = await import("../bin/jwt")
      const { getJWTSecret } = await import("../bin/shared/cli-utils")

      vi.mocked(getJWTSecret).mockReturnValue("test-secret")
      vi.mocked(createToken).mockResolvedValue({
        token: "generated-token",
        metadata: {
          uuid: "test-uuid",
          sub: "ai:alt",
          description: "Temporary token for try.ts (ai:alt)",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      })

      // Import the function we want to test
      const { generateTokenForScope } = await import("../bin/try")

      const options = { auth: true, script: false, quiet: false, dryRun: false }
      const token = await generateTokenForScope("ai:alt", options)

      expect(token).toBe("generated-token")
      expect(createToken).toHaveBeenCalledWith(
        {
          sub: "ai:alt",
          description: "Temporary token for try.ts (ai:alt)",
          expiresIn: "1h"
        },
        "test-secret",
        false
      )
    })

    it("should handle missing JWT secret", async () => {
      const { getJWTSecret } = await import("../bin/shared/cli-utils")

      vi.mocked(getJWTSecret).mockReturnValue("")

      // Mock process.exit to prevent actual exit during test
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called")
      })

      const { generateTokenForScope } = await import("../bin/try")

      const options = { auth: true, script: false, quiet: false, dryRun: false }

      await expect(generateTokenForScope("ai:alt", options)).rejects.toThrow("process.exit called")

      mockExit.mockRestore()
    })

    it("should handle token creation failures", async () => {
      const { createToken } = await import("../bin/jwt")
      const { getJWTSecret } = await import("../bin/shared/cli-utils")

      vi.mocked(getJWTSecret).mockReturnValue("test-secret")
      vi.mocked(createToken).mockRejectedValue(new Error("Token creation failed"))

      // Mock process.exit to prevent actual exit during test
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called")
      })

      const { generateTokenForScope } = await import("../bin/try")

      const options = { auth: true, script: false, quiet: false, dryRun: false }

      await expect(generateTokenForScope("ai:alt", options)).rejects.toThrow("process.exit called")

      mockExit.mockRestore()
    })
  })

  describe("Config Creation", () => {
    it("should create config with auto-generated token when --auth is used", async () => {
      const { createToken } = await import("../bin/jwt")
      const { getJWTSecret } = await import("../bin/shared/cli-utils")

      vi.mocked(getJWTSecret).mockReturnValue("test-secret")
      vi.mocked(createToken).mockResolvedValue({
        token: "auto-generated-token",
        metadata: {
          uuid: "test-uuid",
          sub: "dashboard",
          description: "Temporary token for try.ts (dashboard)",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      })

      const { createConfig } = await import("../bin/try")

      const options = { auth: true, local: false, remote: true }
      const config = await createConfig(options, "dashboard")

      expect(config.token).toBe("auto-generated-token")
      expect(config.baseUrl).toBe("https://next.dave.io")
    })

    it("should create config with provided token when --token is used", async () => {
      const { createConfig } = await import("../bin/try")

      const options = { token: "provided-token", local: true, remote: false }
      const config = await createConfig(options)

      expect(config.token).toBe("provided-token")
      expect(config.baseUrl).toBe("http://localhost:3000")
    })

    it("should create config without token when neither --auth nor --token is used", async () => {
      const { createConfig } = await import("../bin/try")

      const options = { local: false, remote: true }
      const config = await createConfig(options)

      expect(config.token).toBeUndefined()
      expect(config.baseUrl).toBe("https://next.dave.io")
    })
  })

  describe("Token Validation", () => {
    it("should pass validation when token is present", async () => {
      const { validateToken } = await import("../bin/try")

      const config = {
        token: "valid-token",
        baseUrl: "https://test.com",
        timeout: 30000,
        verbose: false,
        dryRun: false
      }

      // Should not throw
      expect(() => validateToken(config, "ai:alt", false)).not.toThrow()
    })

    it("should fail validation when token is missing", async () => {
      const { validateToken } = await import("../bin/try")

      const config = { baseUrl: "https://test.com", timeout: 30000, verbose: false, dryRun: false }

      // Mock process.exit to prevent actual exit during test
      const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called")
      })

      expect(() => validateToken(config, "ai:alt", false)).toThrow("process.exit called")

      mockExit.mockRestore()
    })
  })
})
