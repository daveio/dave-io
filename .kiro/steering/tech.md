# Technology Stack

## Runtime & Framework

- **Runtime**: Bun (1.2.19+) - JavaScript runtime and package manager
- **Framework**: Nuxt 4 - Vue.js meta-framework with SSR/SSG capabilities
- **Deployment**: Cloudflare Workers - Edge computing platform
- **Preset**: `cloudflare_module` with Node.js compatibility

## Frontend Stack

- **UI Framework**: Vue 3 with Composition API
- **Styling**: Tailwind CSS 4 + DaisyUI component library
- **Icons**: Nuxt Icon with Heroicons and MDI collections
- **Fonts**: Google Fonts (Sixtyfour Convergence, Sono, Victor Mono)
- **State Management**: Pinia for client-side state
- **Color Mode**: Dark/light theme support with system preference detection

## Backend & API

- **Server**: Nitro (Nuxt's server engine)
- **Validation**: Zod schemas with OpenAPI integration
- **Authentication**: JWT with JOSE library, hierarchical permissions
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Storage**: Cloudflare KV for key-value data
- **AI Services**: Cloudflare AI Workers + OpenRouter API

## Development Tools

- **Package Manager**: Bun (preferred over npm/pnpm/yarn)
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier + Trunk for code formatting
- **Testing**: Vitest with Happy DOM environment
- **Type Checking**: TypeScript with strict mode enabled

## Build & Deployment Commands

### Development

```bash
bun run dev          # Start development server
bun run generate     # Generate types and OpenAPI spec
```

### Testing

```bash
bun run test         # Run unit tests
bun run test:api     # Run API integration tests
bun run test:coverage # Generate coverage report
bun run check        # Full CI/CD validation (build + lint + test)
```

### Build & Deploy

```bash
bun run build       # Build for production
bun run deploy      # Deploy to Cloudflare Workers
bun run deploy:nonprod # Deploy to staging
```

### Utilities

```bash
bun run lint         # Run all linters (ESLint + Trunk + TypeScript)
bun run lint:format  # Auto-format code
bun jwt create       # Create JWT tokens
bun run kv import    # Import KV data
bun run d1 query     # Run D1 database queries
```

## Key Dependencies

- **Core**: `nuxt`, `vue`, `cloudflare`
- **Validation**: `zod`, `@asteasolutions/zod-to-openapi`
- **Auth**: `jose` for JWT handling
- **AI**: `openai` client library
- **Utils**: `lodash-es`, `date-fns`, `uuid`
- **Dev**: `vitest`, `typescript`, `eslint`

## Environment Requirements

- Node.js 22.17.1+
- Bun 1.2.19+
- Cloudflare account with Workers, D1, KV, and AI access
