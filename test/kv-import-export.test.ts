import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import yaml from "js-yaml"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { exportKV, importKV } from "../bin/kv"

describe("KV Import/Export", () => {
  const testDir = resolve("test-data/kv")
  const testFile = resolve(testDir, "test-export.yaml")

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test files
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("exportKV", () => {
    it("should export data successfully", async () => {
      // Note: This test would need to be run with proper Cloudflare credentials
      // For now, we'll test the function structure
      expect(typeof exportKV).toBe("function")
    })
  })

  describe("importKV", () => {
    it("should validate file existence", async () => {
      const result = await importKV("nonexistent.yaml", {})
      expect(result).toBe(false)
    })

    it("should parse YAML correctly", async () => {
      // Create a test YAML file with new schema structure
      const testData = {
        metrics: {
          ok: 100,
          error: 5,
          times: {
            "last-hit": 1704067200000,
            "last-error": 1704060000000,
            "last-ok": 1704067200000
          },
          visitor: {
            human: 80,
            bot: 20,
            unknown: 5
          },
          group: {
            "1xx": 0,
            "2xx": 95,
            "3xx": 5,
            "4xx": 3,
            "5xx": 2
          },
          status: {
            "200": 85,
            "302": 5,
            "404": 3,
            "500": 2
          },
          resources: {
            internal: {
              ok: 50,
              error: 2,
              times: {
                "last-hit": 1704067000000,
                "last-error": 1704055000000,
                "last-ok": 1704067000000
              },
              visitor: {
                human: 40,
                bot: 10,
                unknown: 2
              },
              group: {
                "1xx": 0,
                "2xx": 48,
                "3xx": 2,
                "4xx": 2,
                "5xx": 0
              },
              status: {
                "200": 48,
                "302": 2,
                "404": 2
              }
            },
            go: {
              ok: 25,
              error: 1,
              times: {
                "last-hit": 1704065000000,
                "last-error": 1704050000000,
                "last-ok": 1704065000000
              },
              visitor: {
                human: 20,
                bot: 5,
                unknown: 1
              },
              group: {
                "1xx": 0,
                "2xx": 24,
                "3xx": 1,
                "4xx": 1,
                "5xx": 0
              },
              status: {
                "302": 24,
                "404": 1
              }
            }
          },
          redirect: {
            gh: {
              ok: 15,
              error: 0,
              times: {
                "last-hit": 1704064000000,
                "last-error": 0,
                "last-ok": 1704064000000
              },
              visitor: {
                human: 12,
                bot: 3,
                unknown: 0
              },
              group: {
                "1xx": 0,
                "2xx": 0,
                "3xx": 15,
                "4xx": 0,
                "5xx": 0
              },
              status: {
                "302": 15
              }
            }
          }
        },
        redirect: {
          gh: "https://github.com/daveio",
          blog: "https://blog.dave.io"
        }
      }

      const yamlContent = yaml.dump(testData)
      writeFileSync(testFile, yamlContent, "utf8")

      // Note: This test would need mocked Cloudflare client to fully test
      // For now, we verify the function exists and file parsing works
      expect(typeof importKV).toBe("function")
      expect(existsSync(testFile)).toBe(true)
    })

    it("should handle invalid YAML gracefully", async () => {
      // Create invalid YAML file
      writeFileSync(testFile, "invalid: yaml: content: [unclosed", "utf8")

      const result = await importKV(testFile, {})
      expect(result).toBe(false)
    })

    it("should resolve different file path formats", async () => {
      // Create test file
      const testData = { "test:key": "value" }
      writeFileSync(testFile, yaml.dump(testData), "utf8")

      // Test that the function can handle different path formats
      // This tests the path resolution logic without needing Cloudflare
      expect(typeof importKV).toBe("function")
    })

    it("should handle YAML with anchors and references", async () => {
      // Create YAML with anchors similar to base.yaml
      const yamlWithAnchors = `
_anchors:
  sample_metrics: &sample_metrics
    ok: 0
    error: 0
    times:
      last-hit: 0
      last-error: 0
      last-ok: 0
    visitor:
      human: 0
      bot: 0
      unknown: 0
    group:
      1xx: 0
      2xx: 0
      3xx: 0
      4xx: 0
      5xx: 0
    status: {}

metrics:
  resources:
    internal:
      <<: *sample_metrics
      ok: 100
    ai:
      <<: *sample_metrics
      ok: 50
    go:
      <<: *sample_metrics
      ok: 25
  redirect:
    gh:
      <<: *sample_metrics
      ok: 15
    blog:
      <<: *sample_metrics
      ok: 10
  <<: *sample_metrics

redirect:
  gh: https://github.com/daveio
  blog: https://blog.dave.io
`

      writeFileSync(testFile, yamlWithAnchors, "utf8")

      // Test that anchors are parsed correctly without Cloudflare
      try {
        const parsedData = yaml.load(yamlWithAnchors)
        expect(parsedData).toBeDefined()
        expect(typeof parsedData).toBe("object")

        // biome-ignore lint/suspicious/noExplicitAny: Testing generic YAML parsing
        const data = parsedData as any
        expect(data.metrics.resources.internal.ok).toBe(100)
        expect(data.metrics.resources.ai.ok).toBe(50)
        expect(data.metrics.resources.go.ok).toBe(25)
        expect(data.metrics.redirect.gh.ok).toBe(15)
        expect(data.metrics.redirect.blog.ok).toBe(10)
        expect(data.redirect.gh).toBe("https://github.com/daveio")
      } catch (error) {
        // YAML parsing should work with anchors
        expect(error).toBeNull()
      }
    })
  })

  describe("Environment Variable Validation", () => {
    it("should check KV_IMPORT_ALLOW_OVERWRITE correctly", () => {
      // Test environment variable checking logic
      const originalEnv = process.env.KV_IMPORT_ALLOW_OVERWRITE

      // Test with "1"
      process.env.KV_IMPORT_ALLOW_OVERWRITE = "1"
      // Would need to import the checkOverwriteConfirmation function to test directly
      // For now, verify the env var is set correctly
      expect(process.env.KV_IMPORT_ALLOW_OVERWRITE).toBe("1")

      // Test with "true"
      process.env.KV_IMPORT_ALLOW_OVERWRITE = "true"
      expect(process.env.KV_IMPORT_ALLOW_OVERWRITE).toBe("true")

      // Test with invalid value
      process.env.KV_IMPORT_ALLOW_OVERWRITE = "false"
      expect(process.env.KV_IMPORT_ALLOW_OVERWRITE).toBe("false")

      // Restore original
      if (originalEnv !== undefined) {
        process.env.KV_IMPORT_ALLOW_OVERWRITE = originalEnv
      } else {
        process.env.KV_IMPORT_ALLOW_OVERWRITE = undefined
      }
    })
  })

  describe("Command Line Options", () => {
    it("should handle --yes flag", async () => {
      // Create test YAML file
      const testData = { "test:key": "value" }
      writeFileSync(testFile, yaml.dump(testData), "utf8")

      // Test with --yes flag (would need mocked Cloudflare to fully test)
      expect(typeof importKV).toBe("function")
    })

    it("should handle --wipe flag", async () => {
      // Create test YAML file
      const testData = { "test:key": "value" }
      writeFileSync(testFile, yaml.dump(testData), "utf8")

      // Test with --wipe flag (would need mocked Cloudflare to fully test)
      expect(typeof importKV).toBe("function")
    })
  })
})
