import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { validateImageQuality } from "~/server/utils/validation"

describe("validateImageQuality", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to verify bumping messages
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return undefined for undefined input", () => {
    const result = validateImageQuality(undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined for null input", () => {
    const result = validateImageQuality(null)
    expect(result).toBeUndefined()
  })

  it("should accept valid quality values", () => {
    expect(validateImageQuality(50)).toBe(50)
    expect(validateImageQuality(80)).toBe(80)
    expect(validateImageQuality(100)).toBe(100)
    expect(validateImageQuality("75")).toBe(75)
  })

  it("should bump quality below 10 to minimum value 10", () => {
    expect(validateImageQuality(1)).toBe(10)
    expect(validateImageQuality(5)).toBe(10)
    expect(validateImageQuality(9)).toBe(10)
    expect(validateImageQuality("3")).toBe(10)

    // Verify logging for quality bumping
    expect(console.log).toHaveBeenCalledWith("Quality 1 bumped to minimum value 10")
    expect(console.log).toHaveBeenCalledWith("Quality 5 bumped to minimum value 10")
    expect(console.log).toHaveBeenCalledWith("Quality 9 bumped to minimum value 10")
    expect(console.log).toHaveBeenCalledWith("Quality 3 bumped to minimum value 10")
  })

  it("should accept minimum quality of 10", () => {
    const result = validateImageQuality(10)
    expect(result).toBe(10)
    // Should not log anything for valid minimum
    expect(console.log).not.toHaveBeenCalled()
  })

  it("should reject quality above 100", () => {
    expect(() => validateImageQuality(101)).toThrow("quality must be no more than 100")
    expect(() => validateImageQuality(150)).toThrow("quality must be no more than 100")
  })

  it("should reject non-integer values", () => {
    expect(() => validateImageQuality(50.5)).toThrow("quality must be an integer")
    expect(() => validateImageQuality(80.1)).toThrow("quality must be an integer")
  })

  it("should reject non-numeric values", () => {
    expect(() => validateImageQuality("not-a-number")).toThrow("quality must be a valid number")
    expect(() => validateImageQuality({})).toThrow("quality must be a valid number")
    expect(() => validateImageQuality([])).toThrow("quality must be a valid number")
  })

  it("should handle string representations of numbers", () => {
    expect(validateImageQuality("50")).toBe(50)
    expect(validateImageQuality("100")).toBe(100)
    expect(validateImageQuality("5")).toBe(10) // Should be bumped
  })
})
