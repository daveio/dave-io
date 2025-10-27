# CRUSH.md - AI Agent Guide for dave.io

This document helps AI agents (specifically Crush) work effectively in the dave.io codebase. It contains essential information about the project structure, commands, patterns, and gotchas.

## Project Overview

**Type**: Nuxt 4 full-stack application
**Deployment**: Cloudflare Workers with server-side rendering
**Database**: Cloudflare D1 (SQLite) with Drizzle ORM
**Styling**: Tailwind CSS v4 with Catppuccin theme
**Package Manager**: Bun (v1.2.20) - NOT npm/yarn/pnpm
**Node Version**: 25.0.0 minimum

## Essential Commands

### Development

```bash
bun dev                    # Start dev server (localhost:3000)
bun run preview:wrangler   # Local CF Workers preview with all bindings
```

### Building & Deployment

```bash
bun run build              # Build for production (nuxt build)
bun run deploy             # Build + deploy to production (dave.io)
bun run deploy:nonprod     # Deploy to preview environment
bun run generate           # Generate static site
```

### Code Quality

```bash
bun run lint               # Full lint suite (ESLint + Trunk + TypeScript)
bun run lint:fix           # Auto-fix all fixable issues
bun run format             # Format code (Prettier + Trunk)
bun run lint:types         # TypeScript type checking only
```

### Database

```bash
bunx drizzle-kit generate  # Generate migration from schema changes
bunx drizzle-kit push      # Apply migrations to D1 database
bunx drizzle-kit studio    # Open Drizzle Studio for database browsing
```

### Cloudflare

```bash
bun run types              # Generate Cloudflare binding types
bunx wrangler tail         # View production logs
bunx wrangler deployments list  # List deployments
```

## Project Structure

### Frontend (app/)

- `app.vue` - Root component with Sentry toolbar
- `pages/` - File-based routing (auto-imported)
- `components/` - Vue components (auto-imported)
- `layouts/` - Page layouts
- `assets/css/main.css` - Tailwind imports
- `composables/` - Vue composables (auto-imported)
- `utils/` - Shared utilities

### Backend (server/)

- `server/api/` - API routes (`/api/*`)
- `server/routes/` - Custom routes
- `server/middleware/` - Request middleware
- `server/db/schema.ts` - Drizzle database schema
- `server/utils/` - Server utilities (response helpers, logging, etc.)

### Configuration

- `nuxt.config.ts` - Nuxt configuration with all modules
- `wrangler.jsonc` - Cloudflare Workers configuration
- `drizzle.config.ts` - Database configuration
- `tailwind.config.js` - Tailwind with Catppuccin theme

## Key Patterns & Conventions

### API Routes

All API routes use standardized response helpers:

```typescript
import { ok, error } from "~~/server/utils/response"

export default defineEventHandler(async (event) => {
  try {
    const data = await someOperation()
    return ok(event, data)
  } catch (err) {
    return error(event, null, err.message, 500)
  }
})
```

### Database Access

Use Drizzle ORM with Cloudflare bindings:

```typescript
import { drizzle } from "drizzle-orm/d1"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = drizzle(event.context.cloudflare.env.DB)
  const result = await db.select().from(users).where(eq(users.id, id))
  return ok(event, result)
})
```

### Components

- Use Tailwind with Catppuccin color tokens (`text-base`, `bg-surface`, etc.)
- Auto-imported components from `app/components/`
- Follow Vue 3 Composition API patterns

### Environment Variables

- Runtime config in `nuxt.config.ts` defines available variables
- Environment variables prefixed with `NUXT_` are auto-loaded
- Private keys go in `runtimeConfig`, public in `runtimeConfig.public`

## Cloudflare Bindings

Available in server context via `event.context.cloudflare.env`:

| Binding     | Type              | Purpose               |
| ----------- | ----------------- | --------------------- |
| `DB`        | D1 Database       | SQLite database       |
| `KV`        | KV Namespace      | Key-value cache/store |
| `CACHE`     | KV Namespace      | Application cache     |
| `BLOB`      | R2 Bucket         | File storage          |
| `AI`        | Workers AI        | ML models             |
| `ANALYTICS` | Analytics Engine  | Custom metrics        |
| `BROWSER`   | Browser Rendering | Puppeteer             |
| `IMAGES`    | Image Resizing    | On-the-fly transforms |
| `ASSETS`    | Assets            | Static file serving   |

## Route Rules (nuxt.config.ts)

Pre-configured caching and rendering rules:

- `/` - Prerendered
- `/gender` - ISR (3600s)
- `/api/**` - CORS enabled, no-cache headers
- `/go/**` - No-cache headers
- `/.well-known/nostr.json` - CORS allow all

## Security & Headers

- **CSP & SRI**: Enabled via nuxt-security module
- **SSG Hashing**: Scripts and styles hashed
- **API Headers**: No-cache, X-Frame-Options, etc.
- **Turnstile**: Cloudflare CAPTCHA integration

## Development Gotchas

### Bun Commands

- Always use `bun run build` (NOT `bun build` - conflicts with Bun's internal bundler)
- Use `bun run preview:wrangler` for full CF environment locally
- `bun dev` gives basic functionality but no CF bindings

### Color Mode

- App forces dark mode: `colorMode.preference = "dark"`
- Don't override this - breaks Catppuccin theme

### File Paths

- Use `~~/` for server-side imports (resolves to project root)
- Use `~` for client-side imports (resolves to `app/` directory)
- Absolute paths for file operations

### Database Migrations

- Always run `drizzle-kit generate` after schema changes
- Use `drizzle-kit push` to apply to remote D1
- Never modify migrations manually

### Deployment

- Production deploys to `dave.io`, `www.dave.io`, `rebuild.dave.io`
- Non-prod creates preview URLs like `https://abc123.dave-io.workers.dev`
- Use `wrangler deployments list` to see deployment history

## Code Style & Quality

### Linting

- **Trunk Check**: Code formatting, security, complexity
- **ESLint**: Vue/Nuxt specific rules
- **TypeScript**: Strict type checking
- Auto-fix with `bun run lint:fix`

### Formatting

- **Prettier**: JavaScript/TypeScript/Vue formatting
- **Trunk**: Additional formatting rules
- Run with `bun run format`

### Testing

- No test suite currently configured
- Use `bun run lint:types` for type checking
- Manual testing via `bun dev` or `bun run preview:wrangler`

## Common Issues

### Environment Variables Not Loading

- Must be prefixed with `NUXT_` for auto-loading
- Check `.env.example` for required variables
- Private vars in `runtimeConfig`, public in `runtimeConfig.public`

### Cloudflare Bindings Undefined

- Use `bun run preview:wrangler` instead of `bun dev`
- Bindings only available in CF Workers environment

### Hydration Mismatches

- Ensure color mode stays dark (forced in config)
- Check for client/server rendering differences

### Build Failures

- Ensure Node.js 25+ and Bun 1.2.20+
- Check Trunk version matches CI (via mise.toml)
- Verify all dependencies installed with `bun install`

## Monitoring & Debugging

### Logs

- `bunx wrangler tail` - Production logs
- Server logs include request serialization
- Sentry captures errors automatically

### Analytics

- Custom events via `ANALYTICS.writeDataPoint()`
- Request metrics via Cloudflare dashboard

### Local Debugging

- `bun run preview:wrangler` - Full CF environment
- Inspector available on port 9229
- Container engine: Docker

## CI/CD Pipeline

Runs on push/PR:

1. Install dependencies (`bun install`)
2. Trunk Check (security/formatting)
3. TypeScript type checking (`bun run lint:types`)
4. Production build (`bun run build`)

## Version Management

- **Bun**: 1.2.20 (managed by mise.toml)
- **Node**: 25.0.0+ (engines field in package.json)
- **Nuxt**: 4.0.3 (future compatibility v4)
- **Cloudflare**: Compatibility date 2025-09-07

## External Resources

- [Nuxt 4 Docs](https://nuxt.com/docs/getting-started/introduction)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM D1 Guide](https://orm.drizzle.team/docs/cloudflare-d1)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-beta)
- [Catppuccin Theme](https://github.com/catppuccin/catppuccin)

---

**Last Updated**: Generated by Crush analysis of codebase
