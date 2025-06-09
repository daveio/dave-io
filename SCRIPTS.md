# Scripts Documentation

This document shows the relationships between all npm scripts in this project and identifies dependency issues.

## Script Dependency Graph

```mermaid
graph TD
    %% Main entry points
    build["build"]
    check["check"]
    deploy["deploy"]
    dev["dev"]
    preview["preview"]

    %% Build chain
    build --> reset
    build --> buildNuxt["build:nuxt"]

    %% Check chain
    check --> build
    check --> lint
    check --> test

    %% Deploy chain
    deploy --> reset
    deploy --> deployEnv["deploy:env"]
    deploy --> deployWrangler["deploy:wrangler"]

    %% Dev chain
    dev --> reset
    dev --> types["`types` ⚠️ MISSING"]
    dev --> devNuxt["dev:nuxt"]

    %% Preview chains
    preview --> previewCloudflare["preview:cloudflare"]
    previewCloudflare --> types
    previewCloudflare --> buildNuxt
    previewCloudflare --> wranglerDev["`wrangler:dev` ⚠️ MISSING"]

    previewNuxt["preview:nuxt"] --> types
    previewNuxt --> nuxtPreview["`nuxt:preview` ⚠️ MISSING"]

    %% Reset chain
    reset --> resetClean["reset:clean"]
    reset --> resetPackages["reset:packages"]
    reset --> generate

    %% Reset packages chain
    resetPackages --> resetPackagesDelete["reset:packages:delete"]
    resetPackages --> resetPackagesInstall["reset:packages:install"]

    %% Generate chain
    generate --> generateOpenapi["generate:openapi"]
    generate --> generateNuxt["generate:nuxt"]
    generate --> generateTypes["generate:types"]

    %% Lint chain
    lint --> lintCheck["lint:check"]
    lint --> lintTypes["lint:types"]

    %% Test chain
    test --> testUnit["test:unit"]
    test --> testUi["test:ui"]
    test --> testCoverage["test:coverage"]

    %% Docs chain
    docs --> docsGenerate["`docs:generate` ⚠️ MISSING"]

    %% Postinstall chain
    postinstall --> types
    postinstall --> nuxtPrepare["`nuxt:prepare` ⚠️ MISSING"]

    %% Standalone scripts
    jwt["jwt"]
    kv["kv"]
    lintFormat["lint:format"]
    testApi["test:api"]
    testWatch["test:watch"]
    resetKv["reset:kv"]

    %% Style missing scripts
    classDef missing fill:#ffcccc,stroke:#ff0000,stroke-width:2px,color:#000000
    class types,docsGenerate,nuxtPrepare,wranglerDev,nuxtPreview missing

    %% Style main entry points
    classDef entryPoint fill:#cceeff,stroke:#0066cc,stroke-width:3px
    class build,check,deploy,dev,preview entryPoint

    %% Style circular dependency scripts
    classDef circular fill:#ffffcc,stroke:#ff9900,stroke-width:2px
    class reset,generate,dev,build circular
```

## Identified Problems

### 1. Missing Script Definitions

The following scripts are referenced by other scripts but are not defined:

- **`types`** - Referenced by `dev`, `postinstall`, `preview:cloudflare`, `preview:nuxt`
  - *Likely should be:* `generate:types` (which runs `wrangler types`)

- **`docs:generate`** - Referenced by `docs`
  - *Missing implementation*

- **`nuxt:prepare`** - Referenced by `postinstall`
  - *Likely should be:* `nuxt prepare` command

- **`wrangler:dev`** - Referenced by `preview:cloudflare`
  - *Likely should be:* `wrangler dev` command

- **`nuxt:preview`** - Referenced by `preview:nuxt`
  - *Likely should be:* `nuxt preview` command

### 2. Circular Dependencies

Several circular dependency chains exist:

- **`build` → `reset` → `generate` → `generate:nuxt`**
  - `build` calls `reset` which runs `generate:nuxt`, then calls `build:nuxt`
  - This runs Nuxt generate AND Nuxt build, which is redundant

- **`dev` → `reset` → `generate` → `generate:types`**
  - `dev` needs `types` (should be `generate:types`) but also calls `reset` which runs `generate:types`
  - This creates unnecessary regeneration

### 3. Logic Issues

- **Redundant Nuxt operations in `build`:**
  - `reset` runs `generate:nuxt` (nuxt generate)
  - Then `build:nuxt` runs `nuxt build`
  - These should be separate workflows

- **Heavy `check` script:**
  - Runs full `build` (including `reset`) then `test`
  - Could be optimized to avoid full reset for checking

- **Inconsistent naming:**
  - Some scripts use `types` (missing), should probably use `generate:types`
  - Mix of `:` and no separator in script names

### 4. Unused Scripts

These scripts exist but aren't referenced by any other scripts:

- `lint:format`
- `test:api`
- `test:watch`
- `reset:kv`
- `jwt`
- `kv`

## Recommended Fixes

1. **Add missing scripts:**
   ```json
   "types": "bun run generate:types",
   "docs:generate": "// implement documentation generation",
   "nuxt:prepare": "nuxt prepare",
   "wrangler:dev": "wrangler dev",
   "nuxt:preview": "nuxt preview"
   ```

2. **Restructure build workflow:**
   - Remove `generate:nuxt` from `reset`
   - Create separate `build:static` script for static generation
   - Make `build` focused on building, not generating

3. **Optimize dependency chains:**
   - Make `types` generation more targeted
   - Reduce unnecessary resets in development workflows

4. **Standardize naming:**
   - Use consistent `:` separator for all namespaced scripts
   - Align script purposes with their names

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
    "preview": "bun run preview:cloudflare",

    // === BUILD TASKS ===
    "build:nuxt": "bun run nuxt build",

    // === DEVELOPMENT ===
    "dev:nuxt": "bun run nuxt dev",

    // === PREVIEW ===
    "preview:cloudflare": "bun run-s types build:nuxt wrangler:dev",
    "preview:nuxt": "bun run-s types nuxt:preview",

    // === DEPLOYMENT ===
    "deploy:env": "bun run bin/env.ts",
    "deploy:wrangler": "bun run wrangler deploy",

    // === GENERATION ===
    "generate": "bun run-p generate:openapi generate:types",
    "generate:openapi": "bun run bin/generate-docs.ts && biome format --write public/openapi.json",
    "generate:nuxt": "nuxt generate",
    "generate:types": "wrangler types",

    // === CLEANUP ===
    "clean": "bun run rimraf .nuxt .output .wrangler *.d.ts",

    // === PACKAGE MANAGEMENT ===
    "install:fresh": "bun run-s install:clean install:packages",
    "install:clean": "bun run rimraf node_modules bun.lock",
    "install:packages": "bun install",

    // === RESET (FULL REFRESH) ===
    "reset": "bun run-s install:fresh generate",
    "reset:kv": "bun run kv import data/kv/_init.yaml --wipe --yes",

    // === LINTING ===
    "lint": "bun run-p lint:check lint:types",
    "lint:check": "biome check --write && trunk check -a --fix",
    "lint:format": "biome format --write && trunk fmt -a",
    "lint:types": "tsc --noEmit",

    // === TESTING ===
    "test": "bun run-s test:unit test:ui test:coverage",
    "test:api": "bun run bin/api.ts",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run",
    "test:watch": "vitest",

    // === DOCUMENTATION ===
    "docs": "bun run docs:generate",
    "docs:generate": "echo 'Documentation generation not implemented yet'",

    // === UTILITIES ===
    "jwt": "bun run bin/jwt.ts",
    "kv": "bun run bin/kv.ts",
    "types": "bun run generate:types",
    "postinstall": "bun run-s types nuxt:prepare",

    // === MISSING IMPLEMENTATIONS ===
    "nuxt:prepare": "nuxt prepare",
    "nuxt:preview": "nuxt preview",
    "wrangler:dev": "wrangler dev"
  }
}
```

## Key Changes Made

### 1. **Eliminated Circular Dependencies**
- `build` no longer calls `reset` - it's now `clean` → `types` → `build:nuxt`
- `dev` no longer calls `reset` - it's now just `types` → `dev:nuxt`
- `reset` is now reserved for full project refresh scenarios

### 2. **Added Missing Scripts**
- `types`: Alias for `generate:types`
- `nuxt:prepare`: Standard Nuxt prepare command
- `nuxt:preview`: Standard Nuxt preview command
- `wrangler:dev`: Standard Wrangler dev command
- `docs:generate`: Placeholder for documentation generation

### 3. **Improved Workflow Efficiency**
- **Development**: `dev` only runs necessary setup (types + dev server)
- **Building**: `build` is streamlined (clean + types + build)
- **Static Generation**: New `build:static` for static site generation
- **Checking**: `check` avoids expensive builds, just runs types + lint + tests

### 4. **Better Organization**
- **Parallel where possible**: `generate` runs openapi + types in parallel
- **Renamed for clarity**: `reset:packages` → `install:fresh` with sub-tasks
- **Consistent naming**: All related scripts use `:` separator
- **Logical grouping**: Scripts grouped by function with comments

### 5. **Optimized Reset**
- `reset` now only does fresh install + generation
- No longer mixed with build concerns
- Much faster for development scenarios

This structure eliminates redundancy, fixes circular dependencies, and creates clear, efficient workflows for different development scenarios.
