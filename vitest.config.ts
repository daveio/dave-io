import { defineVitestConfig } from "@nuxt/test-utils/config"

export default defineVitestConfig({
  test: {
    environment: "nuxt",
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
  }
})
