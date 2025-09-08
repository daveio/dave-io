# `dave-io`

## Project Overview

This is a Nuxt 4 application using:

- **Runtime**: Node.js (Nuxt itself), Bun (package manager and `bin/` script runtime)
- **Framework**: Nuxt 4.0.3 with Vue 3.5.18
- **Modules**: ESLint, Fonts, Icon, Image, Scripts, Test Utils
- **Linting**: Trunk Check with TypeScript type checking

## Essential Commands

```bash
# Development
bun dev                   # Start dev server at http://localhost:3000

# Build & Production
bun run build             # Build for production (requires 'run' prefix)
bun run generate          # Generate static site
bun preview               # Preview production build locally

# Code Quality
bun run lint              # Run both Trunk check and TypeScript checks
bun run lint:trunk        # Run Trunk linting only
bun run lint:types        # Run TypeScript type checking only
```

## Architecture & Structure

### Core Files

- `nuxt.config.ts`: Central configuration defining modules, devtools, and compatibility
- `app/app.vue`: Root component with SpeedInsights, NuxtRouteAnnouncer, and NuxtWelcome
- `package.json`: Dependencies and scripts using Bun-specific commands

### Nuxt 4 Specifics

- **Compatibility Date**: Set to "2025-07-15" for latest Nuxt 4 features
- **Modules Array**: All modules (including what were buildModules in Nuxt 3) are now in single `modules` array
- **DevTools**: Enabled by default for development

### Current Module Configuration

```typescript
modules: [
  "@nuxt/eslint", // Project-aware ESLint integration
  "@nuxt/fonts", // Web font optimization
  "@nuxt/icon", // Icon components
  "@nuxt/image", // Image optimization
  "@nuxt/scripts", // Third-party script management
  "@nuxt/test-utils" // Testing utilities
]
```

## Development Workflow

1. **Always use Bun** for package management and script execution
2. **Build requires prefix**: Use `bun run build` not `bun build` (conflicts with Bun's internal build)
3. **Linting is two-phase**: Trunk check first, then TypeScript type checking

## Key Dependencies

### Production

- Nuxt 4.0.3 (latest v4)
- Vue 3.5.18 & Vue Router 4.5.1
- @unhead/vue for head management

### Development

- @anthropic-ai/claude-code 1.0.73
- @trunkio/launcher for linting
- npm-run-all2 for parallel script execution
- nuxi for Nuxt CLI operations

## Links

- [Nuxt Documentation](https://nuxt.com/docs/getting-started/introduction)
- [Bun Documentation](https://bun.sh/docs)

## Plans

Plans are managed [in Notion](https://www.notion.so/daveio/Rebuild-of-dave-io-24db7795690c802489f7d3f8f53d2ec0).
