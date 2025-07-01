import { beforeEach, describe, expect, it, vi } from "vitest"
import type { H3Event } from "h3"
import { getHeader, readBody, readFormData } from "h3"
import { parseImageUpload } from "~/server/utils/validation"

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3")
  return {
    ...actual,
    getHeader: vi.fn(),
    readBody: vi.fn(),
    readFormData: vi.fn()
  }
})



const smallPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAE/AO/lZy6hAAAAABJRU5ErkJggg=="
const smallPngBuffer = Buffer.from(smallPngBase64, "base64")

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: new Headers({
    "content-type": "image/png",
    "content-length": String(smallPngBuffer.length)
  }),
  arrayBuffer: () => Promise.resolve(smallPngBuffer)
  // biome-ignore lint/suspicious/noExplicitAny: test mock needs flexible typing
}) as any
// biome-ignore lint/suspicious/noExplicitAny: test setup for global fetch mock
;(globalThis as any).fetch = mockFetch

function mockEvent(headers: Record<string, string>): H3Event {
  return { node: { req: { headers } } } as unknown as H3Event
}

describe("parseImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  it("parses base64 JSON body", async () => {
    const event = mockEvent({ "content-type": "application/json" })
    // biome-ignore lint/suspicious/noExplicitAny: test mock requires access to internal structure
    vi.mocked(getHeader).mockImplementation((e: H3Event, n: string) => (e as any).node.req.headers[n])
    vi.mocked(readBody).mockResolvedValue({ image: smallPngBase64 })
    const result = await parseImageUpload(event)
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.source).toBe("uploaded-file")
  })

  it("parses multipart form data", async () => {
    const event = mockEvent({ "content-type": "multipart/form-data" })
    // biome-ignore lint/suspicious/noExplicitAny: test mock requires access to internal structure
    vi.mocked(getHeader).mockImplementation((e: H3Event, n: string) => (e as any).node.req.headers[n])
    const buf = Buffer.from(smallPngBase64, "base64")
    const file = new File([buf], "test.png", { type: "image/png" })
    const form = new FormData()
    form.set("image", file)
    vi.mocked(readFormData).mockResolvedValue(form)
    const result = await parseImageUpload(event)
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.source).toBe("test.png")
  })
  it("parses URL from JSON body when allowed", async () => {
    const event = mockEvent({ "content-type": "application/json" })
    // biome-ignore lint/suspicious/noExplicitAny: test mock requires access to internal structure
    vi.mocked(getHeader).mockImplementation((e: H3Event, n: string) => (e as any).node.req.headers[n])
    vi.mocked(readBody).mockResolvedValue({ url: "https://example.com/test.png" })
    const result = await parseImageUpload(event, { allowUrl: true })
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.source).toBe("https://example.com/test.png")
    expect(mockFetch).toHaveBeenCalled()
  })

  it("parses URL from multipart form when allowed", async () => {
    const event = mockEvent({ "content-type": "multipart/form-data" })
    // biome-ignore lint/suspicious/noExplicitAny: test mock requires access to internal structure
    vi.mocked(getHeader).mockImplementation((e: H3Event, n: string) => (e as any).node.req.headers[n])
    const form = new FormData()
    form.set("url", "https://example.com/test.png")
    vi.mocked(readFormData).mockResolvedValue(form)
    const result = await parseImageUpload(event, { allowUrl: true })
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.source).toBe("https://example.com/test.png")
    expect(mockFetch).toHaveBeenCalled()
  })
})
