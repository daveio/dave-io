import { describe, expect, it } from "vitest"
import { validateBase64Image } from "~/server/utils/validation"

const smallPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAE/AO/lZy6hAAAAABJRU5ErkJggg=="

const textBase64 = Buffer.from("hello world").toString("base64")

describe("validateBase64Image", () => {
  it("accepts valid base64 image", async () => {
    const buf = await validateBase64Image(smallPngBase64)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })

  it("rejects invalid base64", async () => {
    await expect(validateBase64Image("notbase64" as string)).rejects.toThrow()
  })

  it("rejects non-image data", async () => {
    await expect(validateBase64Image(textBase64)).rejects.toThrow()
  })
})
