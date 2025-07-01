import { describe, expect, it } from "vitest"
import { validateFormDataImage } from "~/server/utils/validation"

const smallPngBase64
  = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAE/AO/lZy6hAAAAABJRU5ErkJggg=="

const textBuffer = Buffer.from("hello world")

describe("validateFormDataImage", () => {
  it("accepts valid image file", async () => {
    const buf = Buffer.from(smallPngBase64, "base64")
    const file = new File([buf], "test.png", { type: "image/png" })
    const result = await validateFormDataImage(file)
    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
  })

  it("rejects non-image file", async () => {
    const file = new File([textBuffer], "text.txt", { type: "text/plain" })
    await expect(validateFormDataImage(file)).rejects.toThrow()
  })
})
