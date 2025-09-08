# `.github/copilot-instructions.md` / `AGENTS.md` / `CLAUDE.md` / `WARP.md`

This file provides guidance to AI agents, including Claude Code (<https://claude.ai/code>), when working
with code in this repository.

## Context Files

This project is set up to support multiple AI agents, expecting multiple different paths to their context file.

- GitHub Copilot is unable to resolve symlinks, so the canonical path to the context file is `.github/copilot-instructions.md`.
- For Claude Code, `CLAUDE.md` is a symlink to `.github/copilot-instructions.md`.
- For Warp terminal, `WARP.md` is a symlink to `.github/copilot-instructions.md`.
- For other AI agents, `AGENTS.md` is a symlink to `.github/copilot-instructions.md`.

When updating any of these three files, you only need to write updates to one of them. The symlinks should allow you
to write to whichever file you prefer, but it's recommended to update `.github/copilot-instructions.md` as that
doesn't depend on any symlink resolution.

## Project Overview

Nuxt 4 application deployed to Cloudflare Workers with full-stack capabilities:

- **Framework**: Nuxt 4.0.3 (Vue 3.5.18) with SSR/SSG on Cloudflare Workers
- **Package Manager**: Bun (v1.2.20) - NOT npm/yarn/pnpm
- **Deployment**: Cloudflare Workers via Wrangler
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 (S3-compatible) + KV namespace
- **Styling**: Tailwind CSS v4 with Catppuccin theme
- **Monitoring**: Sentry for errors, Cloudflare Analytics for metrics

## Essential Commands

### Development & Build

```bash
# Start development server (http://localhost:3000)
bun dev

# Build for production - CRITICAL: Use 'run' prefix!
bun run build  # NOT 'bun build' - conflicts with Bun's internal command

# Generate static site
bun run generate

# Preview production build locally via Wrangler
bun preview
```

### Code Quality

```bash
# Run complete lint suite (Trunk + TypeScript)
bun run lint

# Individual lint commands
bun run lint:trunk        # Trunk Check only
bun run lint:types        # TypeScript type checking
bun run lint:eslint       # ESLint only
bun run lint:fix          # Auto-fix all fixable issues

# Format code
bun run format            # Prettier + Trunk formatting
```

### Deployment

```bash
# Deploy to production (rebuild.dave.io)
bun run deploy

# Deploy to staging/preview
bun run deploy:nonprod

# Local Wrangler dev server (simulates CF Workers)
bun run preview:wrangler

# Generate Cloudflare types
bun run types
```

### Database Operations

```bash
# Generate new migration
bunx drizzle-kit generate

# Apply migrations to D1
bunx drizzle-kit push

# Open Drizzle Studio
bunx drizzle-kit studio
```

## Architecture

### Request Flow

1. **Cloudflare Edge** → Routes to Workers based on `wrangler.jsonc` patterns
2. **Nitro Server** → Handles SSR/API via `cloudflare_module` preset
3. **Nuxt App** → Vue components render with auto-imports from `app/` directory
4. **API Routes** → `server/api/*.ts` files become `/api/*` endpoints
5. **Middleware** → `server/middleware/` processes all requests

### Key Directories

- `app/` - Vue components, layouts, pages (auto-imported)
- `server/` - Nitro backend: API routes, middleware, DB schema
- `public/` - Static assets served directly from CF edge
- `.output/` - Build artifacts for Cloudflare Workers
- `drizzle/` - Database migrations

## Cloudflare Bindings

All bindings defined in `wrangler.jsonc` are available in server context:

| Binding     | Type              | Usage                  | Access                                   |
| ----------- | ----------------- | ---------------------- | ---------------------------------------- |
| `KV`        | KV Namespace      | Cache, session storage | `event.context.cloudflare.env.KV`        |
| `DB`        | D1 Database       | SQLite database        | `event.context.cloudflare.env.DB`        |
| `BLOB`      | R2 Bucket         | File storage           | `event.context.cloudflare.env.BLOB`      |
| `AI`        | Workers AI        | ML models              | `event.context.cloudflare.env.AI`        |
| `ANALYTICS` | Analytics Engine  | Custom metrics         | `event.context.cloudflare.env.ANALYTICS` |
| `BROWSER`   | Browser Rendering | Puppeteer              | `event.context.cloudflare.env.BROWSER`   |
| `IMAGES`    | Image Resizing    | On-the-fly transforms  | `event.context.cloudflare.env.IMAGES`    |

### Accessing Bindings in Server Code

```typescript
// server/api/example.ts
export default defineEventHandler(async (event) => {
  // Get Cloudflare bindings
  const { env } = event.context.cloudflare

  // Use KV
  await env.KV.put("key", "value")
  const cached = await env.KV.get("key")

  // Use D1 with Drizzle
  const db = drizzle(env.DB)
  const results = await db.select().from(users)

  // Use R2
  const object = await env.BLOB.get("file.pdf")

  // Use AI
  const response = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
    prompt: "Hello"
  })
})
```

## Environment Variables

### Required Secrets (`.env`)

| Variable                    | Purpose                  | Example        |
| --------------------------- | ------------------------ | -------------- |
| `NUXT_OPENROUTER_API_KEY`   | OpenRouter API access    | `sk-or-v1-...` |
| `NUXT_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile     | `0x4AAA...`    |
| `SENTRY_AUTH_TOKEN`         | Sentry deployment        | `sntrys_...`   |
| `CLOUDFLARE_D1_TOKEN`       | D1 API access (dev only) | `v1_...`       |

### Public Configuration (`nuxt.config.ts`)

```typescript
runtimeConfig: {
  // Private (server-only)
  openRouterApiKey: '', // Override with NUXT_OPENROUTER_API_KEY
  turnstileSecretKey: '', // Override with NUXT_TURNSTILE_SECRET_KEY

  // Public (client + server)
  public: {
    siteUrl: 'https://rebuild.dave.io',
    cloudflare: {
      accountId: 'def50674a738cee409235f71819973cf'
    },
    turnstile: {
      siteKey: '0x4AAAAAABraTjA80I4Pmf1K'
    }
  }
}
```

## Nuxt 4 Configuration

### Active Modules (`nuxt.config.ts`)

```typescript
modules: [
  "@formkit/auto-animate/nuxt", // Auto-animate Vue transitions
  "@nuxt/eslint", // ESLint integration
  "@nuxt/fonts", // Web font optimization (Bunny CDN)
  "@nuxt/icon", // Icon components (Iconify)
  "@nuxt/image", // Image optimization
  "@nuxt/scripts", // Third-party script management
  "@nuxtjs/color-mode", // Dark/light mode (forced dark)
  "@nuxtjs/device", // Device detection
  "@nuxtjs/seo", // SEO meta tags
  "@nuxtjs/turnstile", // Cloudflare Turnstile CAPTCHA
  "@pinia/nuxt", // State management
  "@sentry/nuxt/module", // Error tracking
  "magic-regexp/nuxt", // Readable regex
  "nitro-cloudflare-dev", // Local CF dev environment
  "nuxt-security" // Security headers (CSP, SRI)
]
```

### Experimental Features Enabled

```typescript
experimental: {
  componentIslands: true,    // Selective hydration
  inlineRouteRules: true,    // Route-level Nitro rules
  lazyHydration: true,       // Defer hydration
  viewTransition: true,      // Native view transitions API
}
```

### Critical Settings

- **Compatibility Date**: `2025-08-13` - Uses latest Nuxt 4 & CF features
- **Nitro Preset**: `cloudflare_module` - Required for Workers
- **Node Compat**: Enabled via `nodejs_compat` flag
- **Source Maps**: Hidden on client, enabled on server for Sentry

## Development Patterns

### State Management (Pinia)

```typescript
// stores/example.ts
export const useExampleStore = defineStore("example", () => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubled, increment }
})
```

### API Route with D1

```typescript
// server/api/users.get.ts
import { drizzle } from "drizzle-orm/d1"
import { users } from "~/server/db/schema"

export default defineEventHandler(async (event) => {
  const db = drizzle(event.context.cloudflare.env.DB)
  return await db.select().from(users).limit(10)
})
```

### Composables with Auto-imports

```typescript
// composables/pageSetup.ts - already auto-imported everywhere
export function usePageSetup(title: string, description?: string) {
  useHead({
    title,
    meta: [{ name: "description", content: description }]
  })

  // Any shared page logic
}
```

### Tailwind v4 with Catppuccin

```vue
<!-- Using Catppuccin Mocha theme tokens -->
<template>
  <div class="bg-base text-text">
    <button class="bg-blue text-base hover:bg-sky">Click Me</button>
  </div>
</template>
```

## Deployment Workflow

### Production Deploy

```bash
# 1. Ensure tests pass (none currently, per CLAUDE.md)
bun run lint

# 2. Build and deploy to Cloudflare
bun run deploy

# 3. Verify deployment
curl https://rebuild.dave.io/api/ping
```

### Preview/Staging Deploy

```bash
# Create preview deployment
bun run deploy:nonprod

# Wrangler will output preview URL like:
# https://abc123.rebuild-dave-io.workers.dev
```

### Rollback

```bash
# List deployments
bun run wrangler deployments list

# Rollback to previous
bun run wrangler rollback
```

## Monitoring & Debugging

### Sentry Integration

- **DSN**: Hardcoded in `sentry.client.config.ts`
- **Source Maps**: Auto-uploaded during build
- **Environments**: Detects via `process.env.NODE_ENV`
- **Toolbar**: Loads in development via `app.vue`

### Cloudflare Analytics

```typescript
// Track custom event
event.context.cloudflare.env.ANALYTICS.writeDataPoint({
  indexes: ["user_action"],
  doubles: [1],
  blobs: ["button_click"]
})
```

### Local Debugging

```bash
# Tail production logs
bunx wrangler tail

# Local debugging with Cloudflare bindings
bun run preview:wrangler

# View D1 data locally
bunx drizzle-kit studio
```

## Common Issues & Solutions

### Issue: "bun build" doesn't create Nuxt build

**Solution**: Always use `bun run build` (with 'run') as `bun build` is Bun's internal bundler command.

### Issue: Environment variables not loading

**Solution**: Nuxt requires `NUXT_` prefix for auto-loading. Check `.env.example` for correct naming.

### Issue: Cloudflare bindings undefined in dev

**Solution**: Use `bun run preview:wrangler` instead of `bun dev` to get full CF environment locally.

### Issue: Hydration mismatch errors

**Solution**: Ensure color mode is consistent - this app forces dark mode:

```typescript
const colorMode = useColorMode()
colorMode.preference = "dark"
```

### Issue: Trunk Check fails on CI

**Solution**: The project uses specific tool versions via `mise.toml`:

- Bun 1.2.20
- Node 22.18.0
- Rust 1.89.0

Ensure CI matches these versions.

## Quick Task Reference

### Add new API endpoint

```bash
# Create file
echo 'export default defineEventHandler(() => ({ ok: true }))' > server/api/health.get.ts

# Test locally
bun dev
curl http://localhost:3000/api/health
```

### Add new page

```bash
# Create page component
mkdir -p app/pages
echo '<template><div>New Page</div></template>' > app/pages/new.vue

# Page auto-routes to /new
```

### Update D1 schema

```bash
# 1. Edit schema
$EDITOR server/db/schema.ts

# 2. Generate migration
bunx drizzle-kit generate

# 3. Apply to D1
bunx drizzle-kit push
```

### Add Cloudflare KV cache

```typescript
// In any server handler
const cached = await event.context.cloudflare.env.KV.get("cache-key")
if (cached) return JSON.parse(cached)

const fresh = await expensiveOperation()
await event.context.cloudflare.env.KV.put(
  "cache-key",
  JSON.stringify(fresh),
  { expirationTtl: 3600 } // 1 hour
)
return fresh
```

## External Resources

- [Nuxt 4 Docs](https://nuxt.com/docs/getting-started/introduction)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM D1 Guide](https://orm.drizzle.team/docs/cloudflare-d1)
- [Tailwind CSS v4 Beta](https://tailwindcss.com/blog/tailwindcss-v4-beta)
- [Project Plans (Notion)](https://www.notion.so/daveio/Rebuild-of-dave-io-24db7795690c802489f7d3f8f53d2ec0)

## Memories

Memories added by CLIs will be appended here.
