import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const spec = JSON.parse(readFileSync("public/openapi.json", "utf8"))

describe("OpenAPI spec", () => {
  it("includes AI ticket endpoints", () => {
    const paths = Object.keys(spec.paths)
    expect(paths).toContain("/api/ai/ticket/title")
    expect(paths).toContain("/api/ai/ticket/description")
    expect(paths).toContain("/api/ai/ticket/enrich")
  })
})
