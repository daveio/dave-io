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

- CLAUDE.md = single source of truth
- Update after: API changes, features, architecture, auth changes

### Quality Verification Workflow

**Mandatory sequence**:
1. `bun run lint`, `bun run typecheck`, `bun run test`
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

**Public**: `/api/internal/health|ping|worker`, `/go/{slug}`
**Protected** (require JWT + scope):
- `/api/internal/auth` - Token validation (any token)
- `/api/internal/metrics` - API metrics (`api:metrics`+)
- `/api/ai/alt` - Alt-text generation (`ai:alt`+)
- `/api/images/optimise` - Image processing (`api:images`+)
- `/api/tokens/{uuid}/*` - Token management (`api:tokens`+)

## Breaking Changes

### AI Alt-Text API

- **POST handler**: Supply raw base64 only
- 4MB limit, but images auto-optimised to 4MB via direct function invocation

### Image Optimisation

- **Filename format**: `{BLAKE3_HEX}-q{QUALITY}.webp` or `{BLAKE3_HEX}-ll.webp`
- **R2 storage**: BLAKE3 hash filenames, smart compression strategy
- **Direct invocation**: AI processing uses function calls, not HTTP

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
**Bindings**: KV (DATA), D1 (DB), AI, R2 (IMAGES)
**Dev**: `API_DEV_USE_DANGEROUS_GLOBAL_KEY=1` + legacy API key

## CLI Tools

- **JWT** (`bin/jwt.ts`): `init|create|verify|list|show|search|revoke`
- **API Test** (`bin/api-test.ts`): End-to-end testing, `--auth-only|--ai-only|etc`
- **KV** (`bin/kv.ts`): `export|import|list|wipe`, local mode with `--local`
- **Deploy** (`bin/deploy-env.ts`): Secure environment deployment

## Testing

- **Unit**: Vitest in `test/` - `bun run test|test:ui|test:coverage`
- **HTTP**: `bin/api-test.ts` - `bun run test:api [options]`
- **Remote**: `bun run test:api --url https://example.com`

## Development Commands

- **Check**: `bun check` (comprehensive)
- **Individual**: `bun run typecheck|lint|format|test|test:api|build`
- **Deploy**: `bun run deploy:env` then `bun run deploy`

## Installation

```bash
git clone https://github.com/daveio/next-dave-io.git
cd next-dave-io
bun install
cp .env.example .env  # Edit with required values
bun run types && bun run nuxt prepare
bun run dev
```

## Project Structure

```plaintext
server/
├── api/           # Endpoints (internal/, ai/, images/, dashboard/, tokens/)
├── utils/         # Shared utilities (auth, response, schemas, image-*)
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
curl -X POST -H "Authorization: Bearer <token>" -d '{"image": "<base64>", "quality": 80}' http://localhost:3000/api/images/optimise
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

## Image Optimisation Service

- **Purpose**: Auto resize, compress, WebP conversion
- **Storage**: R2 bucket with `/opt/` prefix, BLAKE3 filenames
- **Compression**: Smart lossy/lossless based on input format
- **AI Integration**: Auto-optimisation for alt-text endpoints
- **Limits**: 4MB post-decode, requires `api:images` scope

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

**Completed**: ✅ D1 integration, ✅ Real AI, ✅ Custom domain, ✅ Image optimization
