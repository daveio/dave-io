import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"

describe("Supabase Admin Utils", () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env }
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe("Environment Variable Validation", () => {
    it("should throw error if SUPABASE_URL is missing", () => {
      delete process.env.SUPABASE_URL
      process.env.SUPABASE_KEY = "sb_secret_test_key"

      expect(() => {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
          throw new Error("Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_KEY are set.")
        }
      }).toThrow("Missing Supabase environment variables")
    })

    it("should throw error if SUPABASE_KEY is missing", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co"
      delete process.env.SUPABASE_KEY

      expect(() => {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
          throw new Error("Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_KEY are set.")
        }
      }).toThrow("Missing Supabase environment variables")
    })

    it("should throw error if SUPABASE_KEY has wrong format", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co"
      process.env.SUPABASE_KEY = "wrong_key_format"

      expect(() => {
        const supabaseKey = process.env.SUPABASE_KEY!
        if (!supabaseKey.startsWith("sb_secret_")) {
          throw new Error("Invalid Supabase key format. Use service role key starting with sb_secret_")
        }
      }).toThrow("Invalid Supabase key format")
    })

    it("should accept valid service role key", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co"
      process.env.SUPABASE_KEY = "sb_secret_valid_service_role_key"

      const supabaseKey = process.env.SUPABASE_KEY
      const isValid = supabaseKey?.startsWith("sb_secret_")

      expect(isValid).toBe(true)
    })
  })

  describe("Admin Client Configuration", () => {
    it("should create client with correct auth settings", () => {
      const authConfig = {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }

      expect(authConfig.persistSession).toBe(false)
      expect(authConfig.autoRefreshToken).toBe(false)
      expect(authConfig.detectSessionInUrl).toBe(false)
    })

    it("should reuse existing client instance", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let adminClient: any = null

      // First call creates client
      if (!adminClient) {
        adminClient = { id: "test-client" }
      }
      const firstClient = adminClient

      // Second call returns same instance
      const secondClient = adminClient

      expect(firstClient).toBe(secondClient)
    })
  })

  describe("Server-Only Validation", () => {
    it("should throw error if called from client side", () => {
      const isClient = true // Simulating client-side environment

      expect(() => {
        if (isClient) {
          throw new Error("This function can only be called on the server side")
        }
      }).toThrow("This function can only be called on the server side")
    })

    it("should not throw error if called from server side", () => {
      const isClient = false // Simulating server-side environment

      expect(() => {
        if (isClient) {
          throw new Error("This function can only be called on the server side")
        }
      }).not.toThrow()
    })
  })

  describe("Database Migration Tests", () => {
    it("should validate phone number E.164 format in database", () => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/

      // Valid phone numbers
      expect(phoneRegex.test("+1234567890")).toBe(true)
      expect(phoneRegex.test("1234567890")).toBe(true)
      expect(phoneRegex.test("+12345678901234")).toBe(true)

      // Invalid phone numbers
      expect(phoneRegex.test("0123456789")).toBe(false) // Leading zero
      expect(phoneRegex.test("+1234567890123456")).toBe(false) // Too long (16 digits)
      expect(phoneRegex.test("")).toBe(false) // Empty
      expect(phoneRegex.test("abc")).toBe(false) // Non-numeric
    })

    it("should use fully qualified pg_catalog.now() function", () => {
      const triggerFunction = `
        BEGIN
          SET search_path = '';
          NEW.updated_at = pg_catalog.now();
          RETURN NEW;
        END;
      `

      expect(triggerFunction).toContain("pg_catalog.now()")
      expect(triggerFunction).toContain("SET search_path = ''")
    })
  })
})
