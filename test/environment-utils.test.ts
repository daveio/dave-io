import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getEnvironmentConfig, getEnvironmentVariable, isDevelopment, isProduction } from "../server/utils/environment"

let originalNodeEnv: string | undefined
let originalCfEnv: string | undefined
let originalTestVar: string | undefined

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV
  originalCfEnv = process.env.CLOUDFLARE_ENVIRONMENT
  originalTestVar = process.env.TEST_VAR
})

afterEach(() => {
  if (originalNodeEnv !== undefined) {
    process.env.NODE_ENV = originalNodeEnv
  } else {
    delete process.env.NODE_ENV
  }

  if (originalCfEnv !== undefined) {
    process.env.CLOUDFLARE_ENVIRONMENT = originalCfEnv
  } else {
    delete process.env.CLOUDFLARE_ENVIRONMENT
  }

  if (originalTestVar !== undefined) {
    process.env.TEST_VAR = originalTestVar
  } else {
    delete process.env.TEST_VAR
  }
})

describe("getEnvironmentConfig", () => {
  it("returns development config when NODE_ENV is development", () => {
    process.env.NODE_ENV = "development"
    delete process.env.CLOUDFLARE_ENVIRONMENT
    const config = getEnvironmentConfig()
    expect(config.environment).toBe("development")
    expect(config.allowMockData).toBe(true)
    expect(config.gracefulDegradation).toBe(true)
  })

  it("returns production config when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production"
    delete process.env.CLOUDFLARE_ENVIRONMENT
    const config = getEnvironmentConfig()
    expect(config.environment).toBe("production")
    expect(config.allowMockData).toBe(false)
    expect(config.gracefulDegradation).toBe(false)
  })

  it("returns production when CLOUDFLARE_ENVIRONMENT is production", () => {
    process.env.NODE_ENV = "development"
    process.env.CLOUDFLARE_ENVIRONMENT = "production"
    const config = getEnvironmentConfig()
    expect(config.environment).toBe("production")
    expect(config.allowMockData).toBe(false)
    expect(config.gracefulDegradation).toBe(false)
  })

  it("detects test environment", () => {
    process.env.NODE_ENV = "test"
    const config = getEnvironmentConfig()
    expect(config.environment).toBe("test")
    expect(config.allowMockData).toBe(false)
    expect(config.gracefulDegradation).toBe(true)
  })
})

describe("getEnvironmentVariable", () => {
  it("returns variable value when set", () => {
    process.env.TEST_VAR = "present"
    const value = getEnvironmentVariable("TEST_VAR")
    expect(value).toBe("present")
  })

  it("returns undefined for optional missing variable", () => {
    delete process.env.TEST_VAR
    const value = getEnvironmentVariable("TEST_VAR")
    expect(value).toBeUndefined()
  })

  it("throws for required missing variable", () => {
    delete process.env.TEST_VAR
    expect(() => getEnvironmentVariable("TEST_VAR", true)).toThrow("Required environment variable TEST_VAR is not set")
  })
})

describe("environment helpers", () => {
  it("isDevelopment returns true in development", () => {
    process.env.NODE_ENV = "development"
    delete process.env.CLOUDFLARE_ENVIRONMENT
    expect(isDevelopment()).toBe(true)
    expect(isProduction()).toBe(false)
  })

  it("isProduction returns true in production", () => {
    process.env.NODE_ENV = "production"
    expect(isProduction()).toBe(true)
    expect(isDevelopment()).toBe(false)
  })
})
