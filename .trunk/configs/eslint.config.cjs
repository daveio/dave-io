// ESLint configuration for dave.io
// Migrated from Biome to ESLint with detailed documentation

const { createConfigForNuxt } = require("@nuxt/eslint-config")

module.exports = createConfigForNuxt({
  features: {
    // Enable experimental tooling features for better development experience
    tooling: true
  }
})
  // Append ignore patterns for files that should not be linted
  // Corresponds to Biome's files.includes exclusions
  .append({
    ignores: [
      "**/.trunk/**", // Trunk configuration directory
      "**/dist/**", // Build output directory
      "**/node_modules/**", // Dependencies directory
      "**/.git/**", // Git directory
      "**/.history/**", // VSCode history extension
      "**/worker-configuration.d.ts", // Generated worker config
      "**/.wrangler/**", // Wrangler cache directory
      "**/components.d.ts", // Auto-generated component types
      "**/auto-imports.d.ts", // Auto-generated imports
      "**/.nuxt/**", // Nuxt build directory
      "**/.codacy/**", // Codacy configuration
      "**/.output/**" // Nuxt output directory
    ]
  })
  // Override rules for all files
  .override("nuxt/rules", {
    linterOptions: {
      // Report unused disable directives
      // Why: Helps keep the codebase clean from unnecessary eslint-disable comments
      reportUnusedDisableDirectives: "warn"
    },
    rules: {
      // Configure hex literal casing to match Prettier (lowercase)
      // Why: Avoids conflicts between ESLint and Prettier formatting
      "unicorn/number-literal-case": ["error", { hexadecimalValue: "lowercase" }]
    }
  })
