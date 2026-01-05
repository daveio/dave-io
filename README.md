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
```

> **Note:** Always use `bun run build`, not `bun build` (conflicts with Bun's bundler).

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
