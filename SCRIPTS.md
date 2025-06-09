# Scripts Documentation

This document shows the relationships between all npm scripts in this project and identifies dependency issues.

## Script Dependency Graph

![SCRIPTS.svg](SCRIPTS.svg)

## Issues Identified

### 1. **Major Circular Dependencies** 🔄

The most critical issue is the circular dependency chain:

- `build` → `reset` → `generate` → `generate:nuxt` (runs `nuxt prepare`)
- `dev` → `reset` → `generate` → `generate:nuxt` (runs `nuxt prepare`)
- `deploy` → `reset` → `generate` → `generate:nuxt` (runs `nuxt prepare`)
- `check` → `build` → (inherits the same circular chain)

**Impact:** Every main command runs a full reset + generation cycle, making development extremely slow.

### 2. **Script Redundancy** 🔁

Multiple scripts do identical operations:

- `generate:nuxt:build` runs `nuxt build` (same as `build:nuxt`)
- `generate:nuxt` runs `nuxt prepare` (same as `generate:nuxt:prepare`)
- `preview` uses `generate:nuxt:build` but could use `build:nuxt`

### 3. **Development Performance Issues** 🐌

- `dev` runs full `reset` (clean + reinstall packages + generate) before starting dev server
- This makes development startup extremely slow and unnecessary
- `reset` should be reserved for "nuclear option" scenarios

### 4. **Potential File Reference Issue** ⚠️

- `try` script references `bin/try.ts` but if the file was renamed to `bin/try-cli.ts`, this needs updating

### 5. **Testing Logic Issues** 🧪

- `test` runs unit tests, then UI tests, then coverage - but coverage should include all tests
- Sequential execution when some could be parallel

## Current Problems Summary

1. **Everything is slow** - All main commands trigger full resets
2. **Circular dependencies** - Generate depends on reset, reset depends on generate
3. **Redundant scripts** - Multiple scripts doing the same operations
4. **Development workflow** - `dev` is overkill with full reset
5. **Build logic** - `build` does reset+generate then builds (why generate before build?)

## Recommendations

1. **Break the circular dependencies:**

   - Remove `reset` from `build`, `dev`, `deploy`
   - Make `reset` a standalone "nuclear option"
   - Create lightweight alternative for common prep work

2. **Optimize development workflow:**

   - `dev` should be fast: just ensure types + start dev server
   - Remove unnecessary `reset` and `generate` from `dev`

3. **Consolidate redundant scripts:**

   - Use `build:nuxt` instead of `generate:nuxt:build`
   - Decide between `generate:nuxt` and `generate:nuxt:prepare`

4. **Fix file references:**
   - Update `try` script path if file was renamed to `try-cli.ts`

## Proposed Refactored Script Structure

Here's a complete refactored `package.json` scripts section that fixes all the identified issues:

```json
{
  "scripts": {
    // === MAIN WORKFLOWS ===
    "build": "bun run-s clean types build:nuxt",
    "build:static": "bun run-s clean types generate:nuxt",
    "check": "bun run-s types lint test:unit",
    "deploy": "bun run-s build deploy:env deploy:wrangler",
    "dev": "bun run-s types dev:nuxt",
    "preview": "bun run preview:wrangler",

    // === BUILD TASKS ===
    "build:nuxt": "bun run nuxt build",

    // === DEVELOPMENT ===
    "dev:nuxt": "bun run nuxt dev",

    // === PREVIEW ===
    "preview:wrangler": "bun run wrangler dev",
    "preview:nuxt": "bun run nuxt preview",

    // === DEPLOYMENT ===
    "deploy:env": "bun run bin/env.ts",
    "deploy:wrangler": "bun run wrangler deploy",

    // === GENERATION ===
    "generate": "bun run-s generate:types generate:openapi",
    "generate:openapi": "bun run bin/generate-docs.ts && biome format --write public/openapi.json",
    "generate:nuxt": "bun run nuxt generate",
    "generate:types": "bun run wrangler types",
    "types": "bun run generate:types",

    // === LINTING ===
    "lint": "bun run-p lint:check lint:types",
    "lint:check": "biome check --write && trunk check -a --fix",
    "lint:format": "biome format --write && trunk fmt -a",
    "lint:types": "tsc --noEmit",

    // === TESTING ===
    "test": "bun run test:unit",
    "test:all": "bun run-s test:unit test:ui test:coverage",
    "test:api": "bun run bin/api.ts",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run",
    "test:watch": "vitest",

    // === MAINTENANCE ===
    "clean": "bun run rimraf .nuxt .output .wrangler *.d.ts",
    "reset": "bun run-s reset:clean reset:packages generate",
    "reset:clean": "bun run clean",
    "reset:kv": "bun run kv import data/kv/_init.yaml --wipe --yes",
    "reset:packages": "bun run-s reset:packages:delete reset:packages:install",
    "reset:packages:delete": "bun run rimraf node_modules bun.lock",
    "reset:packages:install": "bun install",

    // === UTILITIES ===
    "jwt": "bun run bin/jwt.ts",
    "kv": "bun run bin/kv.ts",
    "try": "bun run bin/try-cli.ts",

    // === HOOKS ===
    "postinstall": "bun run generate"
  }
}
```

## Key Improvements in the Proposed Structure

🚀 **Performance Gains:**

- `dev` is now lightning fast (just types + dev server)
- `build` is streamlined without unnecessary resets
- `check` is lightweight for CI/CD pipelines

🔧 **Dependency Resolution:**

- Eliminated all circular dependencies
- Clear separation of concerns
- Parallel execution where beneficial

📚 **Better Organization:**

- Logical groupings with comments
- Consistent naming with `:` separators
- Removed redundant operations

✅ **Workflow Optimization:**

- `reset` reserved for "nuclear option" scenarios
- `clean` as lightweight alternative
- `test:all` for comprehensive testing vs `test` for quick checks
