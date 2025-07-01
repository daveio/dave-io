// ESLint configuration for dave.io
// Migrated from Biome to ESLint with detailed documentation

import { createConfigForNuxt } from "@nuxt/eslint-config"

export default createConfigForNuxt({
  features: {
    // Enable stylistic rules for consistent code formatting
    // This includes rules for indentation, quotes, semicolons, etc.
    stylistic: {
      // Corresponds to Biome's formatter.indentStyle and formatter.indentWidth
      // Sets indentation to 2 spaces (matching Biome config)
      indent: 2,

      // Corresponds to Biome's javascript.formatter.quoteStyle
      // Uses double quotes for strings (matching Biome's "double" setting)
      quotes: "double",

      // Corresponds to Biome's javascript.formatter.semicolons
      // Uses semicolons only when necessary (matching Biome's "asNeeded" setting)
      semi: false,

      // Corresponds to Biome's javascript.formatter.trailingCommas
      // No trailing commas (matching Biome's "none" setting)
      commaDangle: "never",

      // Corresponds to Biome's formatter.bracketSpacing
      // Adds spaces inside object literal braces (matching Biome's true setting)
      braceStyle: "1tbs",

      // Additional stylistic options
      arrowParens: true, // Always use parentheses around arrow function parameters
      blockSpacing: true, // Enforce spaces inside of blocks after opening and before closing
      quoteProps: "as-needed" // Only quote object properties when necessary
    },

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
  // Override specific TypeScript rules
  .override("nuxt/typescript/rules", {
    rules: {
      // ===== TYPESCRIPT RULES =====
      // These rules replace Biome's TypeScript-specific linting

      // Corresponds to Biome's suspicious.noExplicitAny
      // Disallows usage of the any type
      // Why: Using 'any' defeats the purpose of TypeScript's type safety
      "@typescript-eslint/no-explicit-any": "error",

      // Corresponds to Biome's correctness.noUnusedVariables
      // Disallows unused variables
      // Why: Unused variables clutter the code and may indicate incomplete refactoring
      "@typescript-eslint/no-unused-vars": "error",

      // Corresponds to Biome's style.noInferrableTypes
      // Disallows explicit type annotations for variables/parameters where type can be inferred
      // Why: Reduces verbosity when TypeScript can automatically infer the type
      "@typescript-eslint/no-inferrable-types": "error",

      // Additional TypeScript best practices
      // Prefer const assertions where applicable
      // Example: 'foo' as const instead of 'foo' as 'foo'
      "@typescript-eslint/prefer-as-const": "error",

      // Enforce default parameters to be last
      // Why: Maintains consistency and prevents confusion with parameter ordering
      "@typescript-eslint/default-param-last": "error"
    }
  })
  // Override stylistic rules
  .override("nuxt/stylistic", {
    rules: {
      // ===== STYLE RULES =====
      // These rules replace Biome's style linting rules

      // Corresponds to Biome's style.noParameterAssign
      // Disallows reassigning function parameters
      // Why: Parameter reassignment can lead to confusing code and potential bugs
      "no-param-reassign": "error",

      // Corresponds to Biome's style.useAsConstAssertion
      // Already handled by @typescript-eslint/prefer-as-const above

      // Corresponds to Biome's style.useDefaultParameterLast
      // Already handled by @typescript-eslint/default-param-last above

      // Corresponds to Biome's style.useEnumInitializers
      // Requires enum members to be initialized
      // Why: Explicit initialization prevents issues when reordering enum members
      "@typescript-eslint/prefer-enum-initializers": "error",

      // Corresponds to Biome's style.useSelfClosingElements
      // Enforces self-closing tags for components without children
      // Why: Reduces verbosity and follows React/Vue best practices
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always"
          },
          svg: "always",
          math: "always"
        }
      ],

      // Corresponds to Biome's style.useSingleVarDeclarator
      // Requires one variable declaration per line
      // Why: Improves readability and makes version control diffs cleaner
      "one-var": ["error", "never"],

      // Corresponds to Biome's style.noUnusedTemplateLiteral
      // Disallows unnecessary template literals
      // Why: Use regular strings when interpolation isn't needed
      "no-useless-concat": "error",

      // Corresponds to Biome's style.useNumberNamespace
      // Prefer Number.isNaN over global isNaN
      // Why: Number.isNaN is more reliable and doesn't coerce values
      "no-restricted-globals": [
        "error",
        {
          name: "isNaN",
          message: "Use Number.isNaN instead"
        },
        {
          name: "isFinite",
          message: "Use Number.isFinite instead"
        }
      ],

      // Corresponds to Biome's style.noUselessElse
      // Disallows else blocks after return statements in if blocks
      // Why: Reduces nesting and improves code readability
      "no-else-return": ["error", { allowElseIf: false }],

      // Additional style rules for consistency
      // Enforce consistent spacing in object literals
      "@stylistic/object-curly-spacing": ["error", "always"],

      // Enforce consistent array bracket spacing
      "@stylistic/array-bracket-spacing": ["error", "never"],

      // Enforce line breaks between array elements when multiline
      "@stylistic/array-element-newline": ["error", "consistent"],

      // Enforce parentheses around arrow function parameters
      "@stylistic/arrow-parens": ["error", "always"]
    }
  })
  // Override rules for all files
  .override("nuxt/rules", {
    languageOptions: {
      parserOptions: {
        // Corresponds to Biome's implicit ECMAScript version support
        // Use latest ECMAScript features
        ecmaVersion: "latest",

        // Use module source type (ES modules)
        sourceType: "module",

        // Enable JSX parsing for Vue templates
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    linterOptions: {
      // Report unused disable directives
      // Why: Helps keep the codebase clean from unnecessary eslint-disable comments
      reportUnusedDisableDirectives: "warn"
    }
  })
