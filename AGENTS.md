# `next.dave.io`

## 🚨 CRITICAL DEVELOPMENT RULES

### Pre-Production Breaking Changes Policy

- **NO backwards compatibility** (pre-production only)
- Remove fields, delete KV keys, change APIs without migration
- Document breaking changes in CLAUDE.md
- ❌ No migration code or legacy support

### Quality > Speed

- Unlimited time for correct implementations
- Use as many AI calls needed for research
- Choose robust solutions, refactor ruthlessly
- ❌ No "good enough" implementations

### Mandatory Testing

- **EVERYTHING** with logic/side effects requires tests
- Cover edge cases and error conditions
- Commands: `bun run test`, `bun run test:ui`, `bun run test:api`
- ❌ Skip: trivial getters, frontend components, config objects

### Documentation Sync

- **AGENTS.md = single source of truth** (AI agent documentation)
- **README.md and CLAUDE.md are symbolic links** to AGENTS.md for functional purposes
- **Make all documentation changes to AGENTS.md only**
- Update after: API changes, features, architecture, auth changes

### Quality Verification Workflow

**Mandatory sequence**:
1. `bun run lint:check`, `bun run lint:types`, `bun run test`
2. Only then: `bun run check` (full build)
- ❌ Never commit broken code

### Commit Hygiene

- Primary: `git add -A . && oco --fgm --yes`
- Fallback: `git add -A . && git commit -am "[emoji] [description]"`
- Commit after: features, bugs, refactoring, before new work

### Zero Mock Data

- Use ONLY real service calls (`env.AI.run()`, `env.DATA.get/put()`)
- Crash loudly when services fail
- ❌ Forbidden: `Math.random()`, hardcoded percentages, fake delays, fallback values
- Exception: Test files only

### No Incomplete Implementations

- Mark incomplete work: `// TODO: [specific description]`
- Prefer explicit errors over silent failures
```typescript
// TODO: Implement user preference caching with Redis
throw new Error("User preferences not implemented yet")
```

### TODO Management

- **Issue ID**: Assign each TODO a unique ID of 6 hex characters FOR THE LOGICAL ISSUE so we can group TODOs by issue. You can generate one with `openssl rand -hex 3` or generate a random one yourself.
- **Use TODO.md** for tracking tasks that need addressing. See examples.
- **Code TODOs**: Use `// TODO:` comments for location-specific tasks. Update `TODO.md` too, include the ID, filename, and file location. In case of multiple code locations, add comments to each. See examples.
- **General TODOs**: Use `TODO.md` for tasks without code locations or with unknown code locations. Include the ID. See examples.
- **Purpose**: Provides a convenient central place to check what needs doing, and somewhere to track tasks which don't have a code location.
- Keep `TODO.md` updated - remove completed items, add new discoveries.

Examples:

```typescript
// TODO: (37c7b2) Skip Bun mocking for now - we'll test these methods separately
// TODO: (37c7b2) Fix uploadFile tests - they require Bun.file mocking.
```

```markdown
- **TODO:** *d8b3f7* Tests are hanging.
- **TODO:** *37c7b2* `test/try-adapters.test.ts:18` Skip Bun mocking for now - we'll test these methods separately
- **TODO:** *37c7b2* `test/try-adapters.test.ts:224` Fix uploadFile tests - they require Bun.file mocking.
```

### KV Simple Data Storage

- Store simple values only: strings, numbers, booleans, simple JSON
- Use hierarchical keys: `metrics:api:internal:ok`
- Lowercase kebab-case: `auth:revocation:token-uuid`
- ❌ No metadata wrappers or complex nested objects
- Update `data/kv/_init.yaml` for new key definitions

### Mandatory Shared Code Extraction

- Extract duplicated logic immediately
- Create in `server/utils/`, add JSDoc, tests, TypeScript types
- ❌ No copy-pasting between endpoints

## Overview

Nuxt 3 + Cloudflare Workers REST API. JWT auth, Zod validation, comprehensive testing.

## Tech Stack

- **Runtime**: Nuxt 3 + Cloudflare Workers (`cloudflare_module`)
- **Auth**: JWT + JOSE, hierarchical permissions
- **Validation**: Zod schemas + TypeScript
- **Testing**: Vitest + custom HTTP API suite
- **Tools**: Bun, Biome, TypeScript strict

## Authentication

- **Methods**: Bearer tokens (`Authorization: Bearer <jwt>`) + URL params (`?token=<jwt>`)
- **JWT Structure**: `{sub, iat, exp?, jti?}`
- **Permissions**: `category:resource` format. Parent grants child access. `admin`/`*` = full access
- **Categories**: `api`, `ai`, `dashboard`, `admin`, `*`

## Key Endpoints

**Public**: `/api/internal/health|ping|worker`, `/api/images/optimise`, `/go/{slug}`
**Protected** (require JWT + scope):
- `/api/internal/auth` - Token validation (any token)
- `/api/internal/metrics` - API metrics (`api:metrics`+)
- `/api/ai/alt` - Alt-text generation (`ai:alt`+)
- `/api/tokens/{uuid}/*` - Token management (`api:tokens`+)

## Breaking Changes

### Development Workflow (December 2024)

- **Script Architecture**: Complete refactor eliminating circular dependencies
- **Dev Command**: No longer runs reset - starts in seconds instead of minutes
- **Test Command**: Now runs unit tests only by default (use `test:all` for full suite)
- **Removed Scripts**: `generate:nuxt:build`, `generate:nuxt:prepare` (redundant)
- **New Scripts**: `build:static` for static generation, `types` alias for convenience

### AI Alt-Text API

- **POST handler**: Supply raw base64 only
- 4MB limit, but images auto-optimised to 4MB via direct function invocation

### Image Optimisation (Cloudflare Images Migration)

- **Service**: Migrated from Sharp to Cloudflare Images API + binding
- **Storage**: Cloudflare Images service (global CDN) instead of R2
- **ID format**: `{BLAKE3_HEX}` or `{BLAKE3_HEX}-q{QUALITY}` for cache differentiation
- **Processing**: API upload + binding transformations for optimal performance

### KV Metrics System

- **Storage**: Individual keys (`metrics:ok`, `metrics:resources:internal:ok`) vs single JSON blob
- **Organization**: Colon-separated hierarchical keys
- **Performance**: Individual key updates, multiple dashboard reads

### KV Data Management

- **YAML**: Enhanced anchor support, integer handling
- **Local mode**: `--local` flag for development KV simulator
- **Commands**: `export|import|list|wipe` with confirmation safeguards

## Response Format

- **Success**: `{success: true, data?, message?, meta?, timestamp}`
- **Error**: `{success: false, error, details?, meta?, timestamp}`
- **Meta**: requestId, timestamp, cfRay, datacenter, country

## Environment

**Required**: `API_JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
**Bindings**: KV (DATA), D1 (DB), AI, Images (IMAGES)
**Dev**: `API_DEV_USE_DANGEROUS_GLOBAL_KEY=1` + legacy API key

## CLI Tools

- **JWT** (`bin/jwt.ts`): `init|create|verify|list|show|search|revoke`
- **API Test** (`bin/api-test.ts`): End-to-end testing, `--auth-only|--ai-only|etc`
- **Try** (`bin/try.ts`): Interactive endpoint tester with pretty output, `ai|images|internal|tokens|dashboard`
- **KV** (`bin/kv.ts`): `export|import|list|wipe`, local mode with `--local`
- **Deploy** (`bin/env.ts`): Secure environment deployment

## Testing

- **Unit**: Vitest in `test/` - `bun run test|test:ui|test:coverage`
- **HTTP**: `bin/api-test.ts` - `bun run test:api [options]`
- **Remote**: `bun run test:api --url https://example.com`

## Development Commands

### Optimized Script Architecture (December 2024)

**Major Performance Improvements** 🚀
- **Dev startup**: ~3 seconds (previously ~30+ seconds)
- **Build process**: No unnecessary resets or circular dependencies
- **Testing**: Quick unit tests by default, comprehensive suite on demand

### Core Workflows

- **`bun run dev`**: Lightning-fast development (types + dev server only)
- **`bun run build`**: Optimized production build (clean + types + build)
- **`bun run build:static`**: Static site generation for edge deployment
- **`bun run check`**: CI/CD validation (types + lint + unit tests)
- **`bun run deploy`**: Full deployment pipeline (build + env + deploy)
- **`bun run preview`**: Quick local preview with Wrangler

### Testing Strategy

- **`bun run test`**: Quick unit tests only (for rapid iteration)
- **`bun run test:all`**: Comprehensive suite (unit + UI + coverage)
- **`bun run test:api`**: HTTP endpoint testing
- **`bun run test:watch`**: Interactive test development

### Maintenance Commands

- **`bun run clean`**: Lightweight cleanup (removes build artifacts)
- **`bun run reset`**: Nuclear option (clean + reinstall + generate)
- **`bun run types`**: Quick TypeScript type generation
- **`bun run lint`**: Parallel linting (Biome + Trunk)

### Script Organization

All scripts now follow a clear hierarchical structure:
- Main workflows (dev, build, deploy)
- Task-specific commands (lint, test, generate)
- Utility scripts (jwt, kv, try)
- Maintenance operations (clean, reset)

**No more circular dependencies!** Each command has a clear, linear execution path.

## Installation

### Prerequisites

- **Node.js**: Version 18 or higher
- **Bun**: Package manager (<https://bun.sh/>)
- **Cloudflare Images**: Subscription required for image processing service

### Steps

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables (see [Environment](#environment))
4. Run development server: `bun run dev` (starts in ~3 seconds!)

### Quick Start

```bash
# Install and start development
bun install
bun run dev  # Lightning fast - no reset cycle!

# Run tests during development
bun run test       # Quick unit tests
bun run test:all   # Full test suite

# Build and deploy
bun run check      # Validate everything
bun run deploy     # Deploy to Cloudflare
```

**Note**: Image processing now uses Cloudflare Images service. No local dependencies required.

### Troubleshooting

- **Images API errors**: Ensure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set correctly in your environment
- **Missing Images binding**: Verify `wrangler.jsonc` includes the Images binding configuration

## Project Structure

```plaintext
server/
├── api/           # Endpoints (internal/, ai/, images/, dashboard/, tokens/)
├── utils/         # Shared utilities (auth, response, schemas, cloudflare-images)
└── middleware/    # Request middleware
test/              # Unit tests
bin/               # CLI tools
types/             # TypeScript definitions
data/kv/           # KV exports/imports
```

## API Examples

```bash
# Core endpoints
curl http://localhost:3000/api/internal/health
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/auth

# Metrics (json/yaml/prometheus formats)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics?format=yaml

# AI alt-text
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/ai/alt?url=https://example.com/image.jpg"
curl -X POST -H "Authorization: Bearer <token>" -d '{"image": "<base64>"}' http://localhost:3000/api/ai/alt

# Image optimisation
curl -X POST -d '{"image": "<base64>", "quality": 80}' http://localhost:3000/api/images/optimise
```

## CLI Usage
```bash
# JWT management
bun jwt init
bun jwt create --sub "api:metrics" --description "Metrics" --expiry "30d"
bun jwt list
bun jwt revoke <uuid>

# KV operations
bun run kv export --all        # Remote export
bun run kv --local import backup.yaml  # Local import
bun run kv list --pattern "metrics"

# API testing
bun run test:api --auth-only
bun run test:api --url https://dave.io --token "eyJ..."

# Interactive endpoint testing (try.ts)
bun try internal health              # Test system health (no auth required)
bun try internal auth                # Validate JWT token
bun try internal metrics --format yaml  # Get metrics in YAML format
bun try ai alt url "https://example.com/image.jpg"  # Generate alt-text from URL
bun try ai alt file "./image.png"    # Generate alt-text from local image file
bun try images optimise file "./image.png" --quality 75  # Optimise local image (public)
bun try tokens info <uuid>           # Get token information
bun try dashboard "hacker-news"      # Get dashboard data by name
bun try --remote internal health     # Test against production [default]
bun try --local internal health      # Test against local dev server
bun try --script internal health     # JSON output for automation
bun try --dry-run ai alt url "..."   # Show what would be done without executing
```

## KV Schema (YAML)
```yaml
_anchors:  # Excluded from import
  sample_metrics: &sample_metrics
    ok: 0
    error: 0

metrics:
  resources:
    internal:
      <<: *sample_metrics
      ok: 100
  <<: *sample_metrics

redirect:
  gh: https://github.com/daveio
```

**Converts to flat keys**: `metrics:ok = "1000"`, `redirect:gh = "https://github.com/daveio"`

## Deployment

```bash
# Initial setup
wrangler kv:namespace create DATA
wrangler d1 create NEXT_API_AUTH_METADATA
# Update wrangler.jsonc with IDs
bun jwt init
bun run deploy:env
bun run deploy
bun run test:api --url https://your-worker.workers.dev
```

## Image Optimisation Service (Cloudflare Images)

- **Purpose**: Auto resize, compress, format conversion via Cloudflare Images
- **Storage**: Cloudflare Images service with global CDN delivery
- **Processing**: Hybrid API upload + binding transformations
- **Caching**: Content-based deduplication using BLAKE3 hashing
- **AI Integration**: Direct function invocation for alt-text processing
- **Limits**: 4MB post-decode, no authentication required
- **Benefits**: No external dependencies, global edge network, automatic optimization

## Linting Guidelines

**TypeScript `any`**: Add `// biome-ignore lint/suspicious/noExplicitAny: [reason]`
**Unused variables**: Add `// biome-ignore lint/correctness/noUnusedVariables: [reason]`

## Build Warnings (Ignore)

Cloudflare SDK warnings about `'this'` keyword are harmless.

## Documentation Guidelines

1. `CLAUDE.md` = authoritative technical docs for the project
2. `README.md` = symlinked to `CLAUDE.md` for GitHub UX purposes
3. Test all examples before documenting
4. Update `CLAUDE.md` after significant changes`
5. Since `README.md` is symlinked to CLAUDE.md, you only need to update `CLAUDE.md`

## AI Agent Guidelines

- **Quality**: API compatibility, hierarchical auth, Zod validation, comprehensive tests
- **Types**: TypeScript strict, avoid `any`, schema-first, export via `types/api.ts`
- **Security**: Validate inputs, verify tokens/permissions, security headers
- **Performance**: Monitor bundle size, optimize caching, minimize cold starts

## Next Steps

**Immediate**: Frontend dev, monitoring, JWT dashboard
**Security**: Token rotation, IP allowlisting, audit logging
**Performance**: Caching, bundle optimization, CDN
**DevEx**: OpenAPI docs, SDKs, Docker, CI/CD
**Architecture**: Microservices, Queues, multi-tenancy, WebSockets

**Completed**: ✅ D1 integration, ✅ Real AI, ✅ Custom domain, ✅ Image optimization, ✅ Cloudflare Images migration
