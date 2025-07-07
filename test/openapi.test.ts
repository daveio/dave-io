import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const spec = JSON.parse(readFileSync("public/openapi.json", "utf8"))

describe("OpenAPI spec", () => {
  it("includes remaining AI endpoints", () => {
    const paths = Object.keys(spec.paths)
    expect(paths).toContain("/api/ai/social")
  })

  it("includes core endpoints", () => {
    const paths = Object.keys(spec.paths)
    expect(paths).toContain("/api/ping")
    expect(paths).toContain("/go/{slug}")
  })
})
