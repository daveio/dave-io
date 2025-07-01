import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["test/**/*.test.ts"],
    exclude: ["node_modules/**", ".trunk/**", ".nuxt/**", ".output/**", "coverage/**", "bin/**"],
    fakeTimers: {
      toFake: ["Date"]
    },
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "bin/",
        ".nuxt/",
        ".output/",
        ".trunk/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.*"
      ]
    }
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "."),
      "~/": resolve(__dirname, "./")
    }
  }
})
