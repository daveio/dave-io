# dave.io

Personal website deployed to Cloudflare Workers.

## Tech Stack

| Category       | Technology                                     |
| -------------- | ---------------------------------------------- |
| **Framework**  | Nuxt 4.2 with Vue 3.5                          |
| **Styling**    | Tailwind CSS 4 + DaisyUI 5 + Catppuccin Mocha  |
| **Database**   | Cloudflare D1 (SQLite) via Drizzle ORM         |
| **Validation** | Zod 4                                          |
| **Linting**    | Trunk Check + ESLint 9 + TypeScript 5          |
| **Runtime**    | Bun 1.3.5 (package manager), Node.js (Nuxt)    |
| **Hosting**    | Cloudflare Workers with D1, KV, R2, Workers AI |

## Commands

```bash
# Development
bun dev                    # Start dev server (localhost:3000)

# Build & Deploy
bun run build              # Build for production (requires 'run' prefix)
bun run deploy             # Build + deploy to Cloudflare
bun preview                # Preview production build locally

# Code Quality
bun run lint               # Run all linters (ESLint + Trunk + TypeScript)
bun run lint:fix           # Auto-fix linting issues
bun run format             # Prettier + Trunk formatting

# Types
bun run types              # Generate Cloudflare Worker types

# Database Migrations (Drizzle + D1)
bun run db:generate        # Generate SQL migrations from server/db/schema.ts into ./drizzle
bun run db:migrate:local   # Apply pending migrations to local D1 (wrangler dev DB)
bun run db:migrate:remote  # Apply pending migrations to remote D1
```

> **Note:** Always use `bun run build`, not `bun build` (conflicts with Bun's bundler).
> **Note:** `wrangler.jsonc` is configured with `"migrations_dir": "./drizzle"` for the `DB` D1 binding, so Wrangler and Drizzle use the same migration files.

## Documentation

See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for comprehensive development documentation including:

- Project structure
- Cloudflare bindings
- Code patterns and conventions
- Vue component patterns
- Database schema
- Linting configuration

## Links

- [Nuxt Documentation](https://nuxt.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
