# dave.io Agent Instructions

This repository houses the personal website `dave.io`, built with Nuxt 4 (compatibility mode) and deployed on Cloudflare Workers.

## Project Overview

- **Framework**: Nuxt 4 (`future: { compatibilityVersion: 4 }`) + Vue 3.5
- **Runtime**: Cloudflare Workers (Nitro `cloudflare_module` preset)
- **Package Manager**: Bun (`bun`)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Styling**: Tailwind CSS 4 + DaisyUI 5 + Catppuccin Mocha theme
- **Language**: TypeScript

## Key Commands

Always use `bun run` prefix.

### Development

- `bun dev`: Start development server
- `bun run build`: Build for production (**Important**: Do not use `bun build`, it conflicts)
- `bun preview`: Preview production build locally

### Testing

- `bun test`: Run Vitest tests
- `bun run test:e2e`: Run Playwright E2E tests
- `bun run test:nuxt`: Run Nuxt-specific tests

### Code Quality

- `bun run lint`: Run all linters (ESLint, Trunk, TSC)
- `bun run lint:fix`: Fix linting issues
- `bun run format`: Format code (Prettier + Trunk)

### Deployment

- `bun run deploy`: Build and deploy to Cloudflare
- `bun run deploy:wrangler`: Deploy only (assumes build exists)

### Database / Types

- `bun run types`: Generate Cloudflare Worker types
- `bun run postinstall`: Installs dependencies and prepares environment

## Architecture & Structure

This project uses the **Nuxt 4 directory structure**:

- `app/`: Main Vue application source
  - `components/`: Vue components
  - `pages/`: Application routes/pages
  - `layouts/`: Layout components
  - `composables/`: Auto-imported composables
  - `assets/`: Static assets (CSS, etc.)
- `server/`: Server-side logic (Nitro)
  - `api/`: API endpoints
  - `routes/`: Server routes
  - `db/`: Database configuration and schema (`schema.ts`)
  - `utils/`: Server utilities
- `content/`: Content files (Markdown for blog, etc.)
- `public/`: Public static files
- `test/`: Test files

## Cloudflare Bindings

Defined in `wrangler.jsonc`:

- **DB**: D1 Database (`dave-io`)
- **AI**: Workers AI
- **IMAGES**: Cloudflare Images
- **KV**: KV Namespace
- **CACHE**: KV Namespace
- **BLOB**: R2 Bucket (`dave-io`)
- **BROWSER**: Headless Browser

## Database (Drizzle ORM)

- **Schema**: `server/db/schema.ts`
- **Migrations**: `drizzle/` output directory
- **Config**: `drizzle.config.ts`

## Testing Guidelines

- **Unit/Integration**: Use `vitest`. Place tests in `test/unit` or `test/nuxt`.
- **E2E**: Use `playwright`. Place tests in `tests/` (root) or specific e2e folders.
- Use `@nuxt/test-utils` for component testing (`mountSuspended`).

## Conventions & Gotchas

1.  **Nuxt 4 Compat**: We are using `compatibilityVersion: 4`. Source files are in `app/`, not root.
2.  **Bun**: Always use `bun` instead of `npm` or `yarn`.
3.  **Build Command**: The `build` script is `bun run nuxt build`. Using `bun build` directly invokes Bun's native bundler which is NOT what we want for Nuxt.
4.  **Linting**: We use Trunk (`.trunk/`) alongside ESLint. Run `bun run lint:fix` to keep CI happy.
5.  **Environment**: Secrets are managed via `.dev.vars` (local) and Cloudflare Secrets (production).
6.  **Theme**: The app forces `data-theme="mocha"` (Catppuccin) in `app.vue`.

## Documentation

- `README.md`: High-level overview
- `package.json`: Dependency truth
- `wrangler.jsonc`: Cloudflare configuration
- `nuxt.config.ts`: Framework configuration
