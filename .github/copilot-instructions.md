# AGENTS.md

This document provides guidance for AI agents working on the dave.io codebase.

## Project Overview

**Type:** Nuxt 4 application deployed to Cloudflare Workers  
**Runtime:** Bun (package manager), Node.js (Nuxt runtime)  
**Hosting:** Cloudflare Workers with D1 (SQLite), KV, R2, and Workers AI  
**Domain:** dave.io

### Tech Stack

| Category            | Technology                                    |
| ------------------- | --------------------------------------------- |
| **Framework**       | Nuxt 4.2 with Vue 3.5                         |
| **Styling**         | Tailwind CSS 4 + DaisyUI 5 + Catppuccin Mocha |
| **Database**        | Cloudflare D1 (SQLite) via Drizzle ORM        |
| **Validation**      | Zod 4                                         |
| **Linting**         | Trunk Check + ESLint 9 + TypeScript 5         |
| **Package Manager** | Bun 1.3.5                                     |

---

## Essential Commands

```bash
# Development
bun dev                    # Start dev server (localhost:3000)

# Build & Deploy
bun run build              # Build for production ⚠️ MUST use "run" prefix
bun run deploy             # Build + deploy to Cloudflare
bun run deploy:nonprod     # Build + upload version without deploying
bun preview                # Preview production build locally

# Code Quality
bun run lint               # Run all linters (ESLint + Trunk + TypeScript)
bun run lint:eslint        # ESLint only
bun run lint:trunk         # Trunk check only
bun run lint:types         # TypeScript type check only (tsc --noEmit)
bun run lint:fix           # Auto-fix ESLint + Trunk issues

# Formatting
bun run format             # Prettier + Trunk formatting

# Types
bun run types              # Generate Cloudflare Worker types (wrangler types)
```

### Critical: Build Command

**Always use `bun run build`**, not `bun build`. The latter invokes Bun's internal bundler which conflicts with Nuxt's build process.

---

## Project Structure

```
dave-io/
├── app/                    # Nuxt 4 app directory
│   ├── assets/css/         # Tailwind + Catppuccin styles
│   ├── components/         # Vue components (organized by domain)
│   │   ├── shared/         # Reusable components
│   │   ├── api/            # API documentation components
│   │   ├── ctrld/          # ControlD integration
│   │   ├── gender/         # Gender info page
│   │   └── todo/           # TODO form components
│   ├── composables/        # Vue composables
│   ├── layouts/            # Page layouts
│   ├── middleware/         # Client-side middleware
│   ├── pages/              # File-based routing
│   ├── plugins/            # Nuxt plugins
│   └── utils/              # Client utilities
├── server/                 # Nitro server (runs on Cloudflare Workers)
│   ├── api/                # API routes
│   ├── db/                 # Drizzle schema
│   ├── middleware/         # Server middleware
│   ├── plugins/            # Server plugins (Sentry)
│   ├── routes/             # Server routes (non-API)
│   └── utils/              # Server utilities
├── shared/                 # Shared code (client + server)
│   ├── types/              # Shared TypeScript types
│   └── util.ts             # Shared utilities
├── content/                # Markdown blog content
├── docs/                   # Internal documentation
├── public/                 # Static assets
└── sql/                    # Raw SQL migrations
```

---

## Cloudflare Bindings

The worker has access to these bindings (defined in `wrangler.jsonc`):

| Binding     | Type              | Purpose                       |
| ----------- | ----------------- | ----------------------------- |
| `DB`        | D1 Database       | SQLite database for redirects |
| `KV`        | KV Namespace      | General key-value storage     |
| `CACHE`     | KV Namespace      | Response caching              |
| `BLOB`      | R2 Bucket         | File/blob storage             |
| `AI`        | Workers AI        | AI inference                  |
| `IMAGES`    | Images            | Image optimization            |
| `BROWSER`   | Browser Rendering | Headless browser              |
| `ANALYTICS` | Analytics Engine  | Event analytics               |
| `ASSETS`    | Static Assets     | Built static files            |

### Accessing Bindings in Server Code

```typescript
// In server routes/middleware
const { cloudflare } = event.context
const db = cloudflare.env.DB
const kv = cloudflare.env.KV
```

### Environment Variables

Prefixed with `NUXT_` for runtime config:

- `NUXT_ANTHROPIC_API_KEY` - Anthropic API key
- `NUXT_LINEAR_API_KEY` - Linear API key
- `NUXT_CTRLD_API_KEY` - ControlD API key
- `NUXT_CTRLD_AUTH_KEY` - ControlD auth key
- `NUXT_TURNSTILE_SECRET_KEY` - Turnstile verification

Types are generated in `worker-configuration.d.ts` via `bun run types`.

---

## Code Patterns

### API Route Naming

Routes follow the pattern `[name].[method].ts`:

- `ping.get.ts` → `GET /api/ping`
- `unblock.post.ts` → `POST /api/ctrld/unblock`

### Response Helpers

The codebase uses custom response wrappers in `server/utils/response.ts`:

```typescript
import { ok, error } from "~~/server/utils/response"

export default defineEventHandler(async (event) => {
  // Success response
  return ok(event, { message: "Success" })

  // Error response
  return error(event, {}, "Something went wrong", 500)
})
```

**Note:** See `docs/HANDLERS.md` for why this pattern exists and the recommended Nuxt 4 approach using `createError()`.

### Structured Logging

Use the logger from `server/utils/logging.ts`:

```typescript
import { logger } from "~~/server/utils/logging"

logger.info("Message", { key: "value" }, event)
logger.error("Error occurred", { error: err.message }, event)
```

Logs are JSON-structured with request correlation via `CF-Ray` or `X-Request-Id`.

### Request ID Correlation

Every request gets a unique ID via middleware (`server/middleware/request-id.ts`):

1. Uses `CF-Ray` header (Cloudflare)
2. Falls back to `X-Request-Id` header
3. Generates UUID if neither exists

Access via `event.context.requestId`.

### Schema Validation with Zod

See `docs/ZOD.md` for comprehensive validation patterns. Key approach:

```typescript
import { z } from "zod"
import { readValidatedBody } from "h3"

const schema = z.object({
  domain: z.string().min(1),
  auth: z.string()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  // body is typed and validated
})
```

### TypeScript Patterns

```typescript
// Type imports
import type { H3Event } from "h3"

// Inline generic typing for readBody
const body = await readBody<{ field: string }>(event)

// Interface definitions
interface Props {
  auth: string
  domain: string
}

// Union types for constrained values
type LogLevel = "debug" | "info" | "warn" | "error"
```

---

## Vue Component Patterns

### Component Structure

```vue
<template>
  <!-- HTML with Tailwind + DaisyUI classes -->
</template>

<script setup lang="ts">
// 1. Type definitions/imports
// 2. Props with defineProps<T>()
// 3. Reactive state (ref, reactive)
// 4. Computed properties
// 5. Functions
// 6. Lifecycle hooks (onMounted)
</script>

<style scoped>
/* Minimal scoped styles - prefer Tailwind */
</style>
```

### Component Naming

- PascalCase with domain prefix: `DomainCheck.vue`, `ApiInfoCard.vue`
- Shared components in `app/components/shared/`
- Domain-specific in `app/components/[domain]/`

### Page Setup

```typescript
usePageSetup({
  title: "page title"
})

definePageMeta({
  layoutProps: {
    showHero: true,
    showCurlCommand: true
  }
})
```

---

## Styling

### Catppuccin Mocha Colors

Defined in `app/assets/css/main.css`. Use these color names:

| Color                              | Use Case           |
| ---------------------------------- | ------------------ |
| `text`                             | Primary text       |
| `subtext0`, `subtext1`             | Secondary text     |
| `surface0`, `surface1`, `surface2` | Backgrounds        |
| `base`, `mantle`, `crust`          | Dark backgrounds   |
| `red`, `green`, `blue`, `yellow`   | Semantic colors    |
| `pink`, `mauve`, `lavender`        | Accent colors      |
| `peach`, `teal`, `sky`, `sapphire` | Additional accents |

### Custom Utility Classes

```css
.bg-rainbow-gradient    /* Rainbow gradient background */
.rainbow-gradient-text  /* Rainbow gradient text */
.link-url               /* Blue link styling */
.link-gender            /* Green link styling */
```

### Font Families

- `--font-mono`: Victor Mono (code)
- `--font-subtitle`: Sono (subtitles)
- `--font-display`: Sixtyfour Convergence (headings)

---

## Database (Drizzle + D1)

### Schema Location

`server/db/schema.ts`

### Current Schema

```typescript
import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const redirects = sqliteTable("redirects", {
  slug: text().unique().notNull().primaryKey(),
  destination: text().notNull()
})
```

### Drizzle Config

`drizzle.config.ts` configures D1 HTTP driver.

---

## Linting & Formatting

### Trunk Check

Primary linter configuration in `.trunk/trunk.yaml`. Enabled linters:

- ESLint 9
- Prettier 3
- TypeScript (via `lint:types`)
- markdownlint
- actionlint
- checkov
- trufflehog
- yamllint
- shellcheck, shfmt

### ESLint Config

`eslint.config.mjs` extends Nuxt's config:

```javascript
export default defineFlatConfigs(
  { ignores: ["worker-configuration.d.ts"] },
  withNuxt({
    rules: {
      "vue/first-attribute-linebreak": "off",
      "vue/html-self-closing": "off"
    }
  })
)
```

### Trunk Ignore Comments

Suppress specific linters:

```typescript
// trunk-ignore-all(trunk-toolbox/todo)
// trunk-ignore(eslint/rule-name)
```

### Pre-commit Hooks

Trunk formats on pre-commit, runs check on pre-push. Also runs `bun install`.

---

## Testing

Currently no test framework is set up beyond `@nuxt/test-utils`. Run type checking as primary verification:

```bash
bun run lint:types    # TypeScript type check
bun run build         # Full build verification
```

---

## Import Aliases

| Alias | Path                           |
| ----- | ------------------------------ |
| `~/`  | `app/` directory               |
| `~~/` | Project root                   |
| `@/`  | `app/` directory (alternative) |

```typescript
import { ok } from "~~/server/utils/response" // Server utils
import Email from "~/components/shared/Email.vue" // App components
```

---

## Key Configuration Files

| File                | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `nuxt.config.ts`    | Nuxt configuration (modules, nitro, security) |
| `wrangler.jsonc`    | Cloudflare Worker configuration               |
| `drizzle.config.ts` | Drizzle ORM configuration                     |
| `tsconfig.json`     | TypeScript configuration                      |
| `package.json`      | Dependencies and scripts                      |
| `.trunk/trunk.yaml` | Trunk linter configuration                    |
| `mise.toml`         | Tool version management (Bun, Node, Rust)     |

---

## Common Gotchas

### 1. Build Command Prefix

Always use `bun run build`, never `bun build`.

### 2. Wrangler Types

After changing `wrangler.jsonc`, regenerate types:

```bash
bun run types
```

### 3. Auto-generated Files

Don't edit directly:

- `worker-configuration.d.ts` - Generated by Wrangler
- `.nuxt/` - Generated by Nuxt
- `env.d.ts` - Generated type declarations

### 4. Environment Variables

- Local: `.dev.vars` (copy from `.dev.vars.example`)
- Production: Set in Cloudflare dashboard
- Use `NUXT_` prefix for runtime config

### 5. Response Wrapper Pattern

Current code uses `ok()`/`error()` helpers. The recommended Nuxt 4 pattern is:

- Success: Return data directly
- Errors: `throw createError({ statusCode, message })`

See `docs/HANDLERS.md` for migration guidance.

### 6. Symlinks in Root

`CLAUDE.md` and `WARP.md` may be symlinks to this file for compatibility with different AI tools.

---

## Development Workflow

1. **Start dev server:** `bun dev`
2. **Make changes**
3. **Run linting:** `bun run lint`
4. **Fix issues:** `bun run lint:fix`
5. **Test build:** `bun run build`
6. **Preview locally:** `bun preview`

### Before Committing

```bash
bun run lint        # All linters
bun run lint:types  # Type check
bun run build       # Verify build works
```

---

## Deployment

### Production

```bash
bun run deploy      # Build + deploy to Cloudflare
```

### Non-Production (Version Upload)

```bash
bun run deploy:nonprod    # Upload version without deploying
```

Deployment is handled by Wrangler. Routes are configured for `dave.io` and `www.dave.io`.

---

## Documentation

- `docs/HANDLERS.md` - API response patterns guide
- `docs/ZOD.md` - Schema validation patterns
- `docs/BLOG.md` - Blog content management
- `docs/RECOMMENDATIONS.md` - Architecture recommendations

---

## External Integrations

| Service          | Purpose                             |
| ---------------- | ----------------------------------- |
| Sentry           | Error tracking (via `@sentry/nuxt`) |
| Google Analytics | Analytics (via `nuxt-gtag`)         |
| Turnstile        | Bot protection                      |
| ControlD         | DNS filtering API                   |
| Linear           | TODO/issue management               |
| OpenRouter       | AI model routing                    |
