import { describe, expect, it, vi } from "vitest"
import { validateImageQuality } from "~/server/utils/validation"
import { extractHashFromFilename, generateOptimisedFilename } from "~/server/utils/image-processing"

describe("validateImageQuality", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to verify bumping messages
    vi.spyOn(console, 'log').mockImplementation(() => {})
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

describe("generateOptimisedFilename", () => {
  const testBuffer = Buffer.from("test content for hashing")

  it("should generate filename with quality suffix", () => {
    const filename = generateOptimisedFilename(testBuffer, 80)
    
    // Should match new format: {HASH}-q{QUALITY}.webp
    expect(filename).toMatch(/^[a-f0-9]+-q80\.webp$/)
    expect(filename).toContain("-q80.webp")
  })

  it("should generate filename with lossless suffix", () => {
    const filename = generateOptimisedFilename(testBuffer)
    
    // Should match new format: {HASH}-ll.webp
    expect(filename).toMatch(/^[a-f0-9]+-ll\.webp$/)
    expect(filename).toContain("-ll.webp")
  })

  it("should generate consistent filenames for same input and quality", () => {
    const filename1 = generateOptimisedFilename(testBuffer, 75)
    const filename2 = generateOptimisedFilename(testBuffer, 75)
    
    expect(filename1).toBe(filename2)
  })

  it("should generate different filenames for different qualities", () => {
    const filename1 = generateOptimisedFilename(testBuffer, 50)
    const filename2 = generateOptimisedFilename(testBuffer, 80)
    
    expect(filename1).not.toBe(filename2)
    expect(filename1).toContain("-q50.webp")
    expect(filename2).toContain("-q80.webp")
  })

  it("should generate different filenames for different input data", () => {
    const buffer1 = Buffer.from("content 1")
    const buffer2 = Buffer.from("content 2")
    
    const filename1 = generateOptimisedFilename(buffer1, 80)
    const filename2 = generateOptimisedFilename(buffer2, 80)
    
    expect(filename1).not.toBe(filename2)
    // Both should have same quality suffix but different hashes
    expect(filename1).toContain("-q80.webp")
    expect(filename2).toContain("-q80.webp")
  })

  it("should use hex encoding for hash", () => {
    const filename = generateOptimisedFilename(testBuffer, 60)
    
    // Extract hash part (everything before the last hyphen)
    const hashPart = filename.split("-").slice(0, -1).join("-")
    
    // Should be valid hex string
    expect(hashPart).toMatch(/^[a-f0-9]+$/)
    expect(hashPart).toHaveLength(32) // 16 bytes = 32 hex chars
  })
})

describe("extractHashFromFilename", () => {
  const testBuffer = Buffer.from("test content")

  it("should extract hash from new format filename", () => {
    const filename = generateOptimisedFilename(testBuffer, 80)
    const extractedHash = extractHashFromFilename(filename)
    
    expect(extractedHash).toBeTruthy()
    expect(extractedHash).toMatch(/^[a-f0-9]+$/)
    expect(extractedHash).toHaveLength(32) // 16 bytes = 32 hex chars
  })

  it("should extract hash from lossless filename", () => {
    const filename = generateOptimisedFilename(testBuffer)
    const extractedHash = extractHashFromFilename(filename)
    
    expect(extractedHash).toBeTruthy()
    expect(extractedHash).toMatch(/^[a-f0-9]+$/)
  })

  it("should handle old format filenames (q{QUALITY}-{HASH})", () => {
    const oldFormatFilename = "q80-abcdef123456789012345678901234567890.webp"
    const extractedHash = extractHashFromFilename(oldFormatFilename)
    
    expect(extractedHash).toBe("abcdef123456789012345678901234567890")
  })

  it("should handle legacy format filenames ({TIMESTAMP}-{HASH})", () => {
    const legacyFilename = "1234567890-abcdef123456789012345678901234567890.webp"
    const extractedHash = extractHashFromFilename(legacyFilename)
    
    expect(extractedHash).toBe("abcdef123456789012345678901234567890")
  })

  it("should return empty string for invalid filenames", () => {
    expect(extractHashFromFilename("invalid.webp")).toBe("")
    expect(extractHashFromFilename("no-extension")).toBe("")
    expect(extractHashFromFilename("")).toBe("")
  })

  it("should handle filenames without .webp extension", () => {
    const hash = extractHashFromFilename("abcdef123456789012345678901234567890-q80")
    expect(hash).toBe("abcdef123456789012345678901234567890")
  })

  it("should handle hyphenated hashes correctly", () => {
    // Test case where hash itself might contain hyphens (base64 replacement scenario)
    const filename = "abc123def456-ghi789-q75.webp"
    const extractedHash = extractHashFromFilename(filename)
    
    expect(extractedHash).toBe("abc123def456-ghi789")
  })
})