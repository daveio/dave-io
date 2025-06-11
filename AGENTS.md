# `next.dave.io`

## 🚨 CRITICAL DEVELOPMENT RULES

### Pre-Production Breaking Changes Policy

- **NO backwards compatibility** (pre-production only).
- If you must add backwards compatibility or migration code, add a TODO to remove it.
- Remove fields, delete KV keys, change APIs without migration
- Document breaking changes in AGENTS.md
- ❌ No migration code or legacy support

### Quality > Speed

- Unlimited time for correct implementations
- Use as many AI calls needed for research
- Choose robust solutions, refactor ruthlessly
- If you must favour speed, add a TODO to return to it later
- ❌ No "good enough" implementations

### Mandatory Testing

- **EVERYTHING** with logic/side effects requires tests
- Cover edge cases and error conditions
- If you can't add tests, add a TODO to implement them later
- Commands: `bun run test`, `bun run test:ui`, `bun run test:api`
- ❌ Skip: trivial getters, frontend components, config objects

### Documentation Sync

- **AGENTS.md = single source of truth** (AI agent documentation)
- **README.md and CLAUDE.md are symbolic links** to AGENTS.md for functional purposes
- **Make all documentation changes to AGENTS.md only**
- Update after: API changes, features, architecture, auth changes
- If you can't update documentation, add a TODO to return to it later

### Quality Verification Workflow

**Mandatory sequence**:

1. `bun run build` to generate all supporting artifacts
2. `bun run lint:biome`, `bun run lint:trunk`, `bun run lint:types`, `bun run test`
3. Only then: `bun run check` (full build)

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
- If you must add mock data, add a TODO to remove it later

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
- If you have to violate this, add a TODO to return to it later
- ❌ No metadata wrappers or complex nested objects
- Update `data/kv/_init.yaml` for new key definitions

### Mandatory Shared Code Extraction

- Extract duplicated logic immediately
- Create in `server/utils/`, add JSDoc, tests, TypeScript types
- If you can't make something shared, add a TODO to return to it later
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

**Public**: `/api/ping`, `/api/images/optimise`, `/go/{slug}`, `/api/ai/tickets/*` - AI ticket operations
**Protected** (require JWT + scope):

- `/api/ai/alt` - Alt-text generation (`ai:alt`+)
- `/api/tokens/{uuid}/*` - Token management (`api:tokens`+)

## Breaking Changes

### CLI Command Simplification (11 June 2025)

- **Removed Command**: `bun try internal ping` command removed entirely
- **Replacement**: Use `bun try ping` for all ping operations
- **Rationale**: Simplified CLI interface, removes redundant command structure
- **Impact**: All documentation and examples updated to use shorter form
- **No Migration**: Breaking change with no backwards compatibility per pre-production policy

### Universal JSON Key Sorting Implementation (11 June 2025)

- **Global Change**: All API endpoints now return JSON with recursively sorted object keys
- **Implementation**: Added `prepareSortedApiResponse()` utility and integrated with `createApiResponse()`
- **Coverage**: Automatic sorting for all successful responses, error responses, and custom response formats
- **Benefits**: Consistent API output, improved diffing, and predictable response structure
- **Testing**: Comprehensive test coverage for sorting utilities and response integration

### API Ping Response Schema Restructuring (11 June 2025)

- **Response Format**: Complete restructuring of `/api/ping` response schema
- **Field Changes**:
  - Replaced `success: true` with `ok: true`
  - Removed top-level fields from `data`: `api_available`, `cf_connecting_ip`, `cf_country`, `cf_datacenter`, `cf_ipcountry`, `cf_ray`, `edge_functions`, `environment`, `preset`, `runtime`, `server_side_rendering`, `status`, `user_agent`, `version`, `worker_limits`
  - Added nested `data.cloudflare` object with: `connectingIP`, `country.ip/primary`, `datacentre`, `ray`, `request.agent/host/method/path/proto/version`
  - Added nested `data.worker` object with: `edge_functions`, `environment`, `limits`, `preset`, `runtime`, `server_side_rendering`, `version`
  - Removed `headers.request` section (moved to `data.cloudflare.request`)
- **Key Mappings**:
  - `cf_connecting_ip` → `data.cloudflare.connectingIP`
  - `cf_country` → `data.cloudflare.country.primary`
  - `cf_ray` → `data.cloudflare.ray`
  - `cf_datacenter` → `data.cloudflare.datacentre`
  - `user_agent` → `data.cloudflare.request.agent`
  - `worker_limits` → `data.worker.limits`
- **Impact**: CLI scripts and tests updated to match new schema

### API Endpoint Consolidation (10 June 2025)

- **Merged Endpoints**: `/api/internal/health`, `/api/internal/ping`, `/api/internal/worker`, `/api/internal/auth`, and `/api/internal/headers` → `/api/ping`
- **Removed Endpoints**: All `/api/internal/*` endpoints (entire directory removed)
- **Enhanced Response**: `/api/ping` now returns comprehensive system information including:
  - System status (health + worker + runtime data)
  - Optional JWT validation (when token provided)
  - Request headers analysis (Cloudflare, forwarding, other)
- **Public Access**: `/api/ping` requires no authentication but responds differently when JWT token is provided
- **CLI Updates**: All bin/ scripts now use `/api/ping` instead of individual internal endpoints
- **Response Format**: New structured response with `data`, `auth`, and `headers` sections

### Unified Auth System for try.ts (9 June 2025)

- **New Options**: `--auth` auto-generates temporary tokens, `--token <JWT>` uses provided tokens
- **Scope Detection**: `--auth` automatically determines required scopes based on endpoint
- **Simplified Workflow**: No need to manually create tokens for testing
- **Environment Requirement**: `API_JWT_SECRET` must be set for `--auth` to work

### Development Workflow (8 June 2025)

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

- **Success**: `{ok: true, data?, message?, meta?, timestamp}`
- **Error**: `{ok: false, error, details?, meta?, timestamp}`
- **Meta**: requestId, timestamp, cfRay, datacenter, country

## Environment

**Required**: `API_JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
**Bindings**: KV (DATA), D1 (DB), AI, Images (IMAGES)
**Dev**: `API_DEV_USE_DANGEROUS_GLOBAL_KEY=1` + legacy API key

## CLI Tools

- **JWT** (`bin/jwt.ts`): `init|create|verify|list|show|search|revoke`
- **API Test** (`bin/api-test.ts`): End-to-end testing, `--auth-only|--ai-only|etc`
- **Try** (`bin/try.ts`): Interactive endpoint tester with unified auth support (`--auth|--token`)
- **KV** (`bin/kv.ts`): `export|import|list|wipe`, local mode with `--local`
- **Deploy** (`bin/env.ts`): Secure environment deployment

## Testing

- **Unit**: Vitest in `test/` - `bun run test|test:ui|test:coverage`
- **HTTP**: `bin/api-test.ts` - `bun run test:api [options]`
- **Remote**: `bun run test:api --url https://example.com`

## Development Commands

### Optimized Script Architecture (8 June 2025)

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
- **Bun**: Package manager ([https://bun.sh/](https://bun.sh/))
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
# Core endpoints - comprehensive status with optional auth
curl http://localhost:3000/api/ping
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/ping

# AI alt-text
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/ai/alt?url=https://example.com/image.jpg"
curl -X POST -H "Authorization: Bearer <token>" -d '{"image": "<base64>"}' http://localhost:3000/api/ai/alt

# AI tickets (public, no authentication)
curl -X POST -d '{"description": "Fix the login bug"}' http://localhost:3000/api/ai/tickets/title
curl -X POST -d '{"title": "Fix login authentication"}' http://localhost:3000/api/ai/tickets/description
curl -X POST -d '{"title": "Fix login", "description": "Users cant log in"}' http://localhost:3000/api/ai/tickets/enrich

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
bun run test:api --ai-only
bun run test:api --url https://dave.io --token "eyJ..."

# Interactive endpoint testing (try.ts)
bun try ping                                    # Test comprehensive status (health, auth, headers) - no auth required
bun try --auth ai alt url "https://example.com/image.jpg"  # Generate alt-text from URL (auto-generate token)
bun try --token "eyJ..." ai alt file "./image.png"        # Generate alt-text from file (use provided token)
bun try images optimise file "./image.png" --quality 75   # Optimise local image (public, no auth)
bun try --auth tokens info <uuid>               # Get token information (auto-generate token)
bun try --auth dashboard "hacker-news"          # Get dashboard data by name (auto-generate token)
bun try --remote ping                           # Test against production [default]
bun try --local ping                            # Test against local dev server
bun try --script ping                           # JSON output for automation
bun try --dry-run --auth ai alt url "..."       # Show what would be done without executing
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

## NOTES: Linear shortcut

This will need API support for the AI processing.

```mermaid
---
# Flow chart for Linear shortcut implementation.
config:
  theme: neo-dark
  layout: elk
  look: neo
---
flowchart TD
   n1("START") --> n3(["Invoked with a share?"])
   n3 -- No --> n4(["Clipboard has content?"])
   n3 -- Yes --> n6["Share to inputData"]
   n4 -- No --> n2["Leave inputData empty"]
   n4 -- Yes --> n5["Do you want to use the clipboard?"]
   n5 -- Yes --> n8["Clipboard to inputData"]
   n5 -- No --> n2
   n10(["inputData has value?"]) -- Yes --> n7["presetTitle = AI(inputData to title)"]
   n7 --> n11("Issue title? preset with presetTitle")
   n10 -- No --> n11
   n11 --> n14(["inputData has value?"])
   n14 -- No --> n13["presetDescription = AI(Title to Description)"]
   n14 -- Yes --> n12("Enrich description with AI?")
   n12 -- Yes --> n15["presetDescription = AI(Enrich Description)"]
   n12 -- No --> n16["presetDescription = inputDescription"]
   n13 --> n17("Issue description? preset with presetDescription")
   n15 --> n17
   n16 --> n17
   n8 --> n10
   n2 --> n10
   n6 --> n10
   n17 --> n18("Create Linear ticket")
   n18 --> n19("END")
   n1:::endpoint
   n3:::decision
   n4:::decision
   n6:::variable
   n2:::variable
   n5:::question
   n8:::variable
   n10:::decision
   n7:::variable
   n11:::question
   n14:::decision
   n13:::variable
   n12:::question
   n15:::variable
   n16:::variable
   n17:::question
   n18:::action
   n19:::endpoint
   classDef question fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#a6da95, color:#a6da95
   classDef variable fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#c6a0f6, color:#c6a0f6
   classDef decision fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#f5a97f, color:#f5a97f
   classDef intermediate fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#e64553, color:#e64553
   classDef endpoint fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#179299, color:#179299
   classDef action fill:#181926, stroke-width:1px, stroke-dasharray:none, stroke:#df8e1d, color:#df8e1d
   linkStyle 0 stroke:#FFD600,fill:none
   linkStyle 1 stroke:#D50000,fill:none
   linkStyle 2 stroke:#00C853,fill:none
   linkStyle 3 stroke:#D50000,fill:none
   linkStyle 4 stroke:#00C853,fill:none
   linkStyle 5 stroke:#00C853,fill:none
   linkStyle 6 stroke:#D50000,fill:none
   linkStyle 7 stroke:#00C853,fill:none
   linkStyle 8 stroke:#FFD600,fill:none
   linkStyle 9 stroke:#D50000,fill:none
   linkStyle 10 stroke:#FFD600,fill:none
   linkStyle 11 stroke:#D50000,fill:none
   linkStyle 12 stroke:#00C853,fill:none
   linkStyle 13 stroke:#00C853,fill:none
   linkStyle 14 stroke:#D50000,fill:none
   linkStyle 15 stroke:#FFD600,fill:none
   linkStyle 16 stroke:#FFD600,fill:none
   linkStyle 17 stroke:#FFD600,fill:none
   linkStyle 18 stroke:#FFD600,fill:none
   linkStyle 19 stroke:#FFD600,fill:none
   linkStyle 20 stroke:#FFD600,fill:none
   linkStyle 21 stroke:#FFD600,fill:none
   linkStyle 22 stroke:#FFD600,fill:none
```

### AI functions required

**Context:** This is backend code to support a workflow for creating Linear tickets.

- `title` (`/api/ai/tickets/title`): Generate a title from the existing description.
   - **Input:** The existing description. This may just be an image or a URL, or may be any combination of URLs, Markdown, and Mermaid diagrams.
   - **Output:** The generated title. Short plain text, basic Markdown allowed. One line.
- `description` (`/api/ai/tickets/description`): Generate a description from the title.
   - **Input:** The existing title. Short plain text, basic Markdown allowed. One line.
   - **Output:** The generated and enriched (with `enrich`) description with any combination of URLs, Markdown, or Mermaid diagrams. Do not return images.
- `enrich` (`/api/ai/tickets/enrich`): Enrich the description with additional context or details.
   - **Input:** The existing title and description. This may just be an image or a URL. If an image, it will be a single image, supplied as raw base64 as per `/api/image/optimise`.
   - **Output:** The enriched description with any combination of URLs, Markdown, or Mermaid diagrams. Do not return images.

API endpoints should **not** require authentication. Output should be JSON even if it is with a single key. Add support to `bin/try.ts` for the endpoints you create. Ensure docs and tests are updated accordingly.

Example inputs:

#### `title`

```json
{
   "description": "# Doing the thing\n\n- Do the thing.\n- Do the other thing.",
   "image": {
      "data": "iVBORw0KGgoAAAANSUhEUgAAAUQAAAFECAMAAABoNLf0AAAC/VBMVEVHcEwcFBUSDQ4CAgEDAQENBwja0NU1AwgDAwHu7+8SBwgDAgIXDw8bEBITCwwFBQQOCAkbEhTs6e8JBwhLRUYbDxMWDhArAgsFAgIDAwMLCgoeAgUbDhD49fgYERMSDQ4TCw4GAwMDAwIDAAAJAwUNCwsjIyPx7vQWCQsnJCQWCgsXExP29vgZEBEkDRARCw0pFBcMBgcaCAsODgwWDA37+fsKDgsmHB4hDxEFGTAHDQsNCgkTDg8nJSYaDQ8jDhF0DSMbDA8oAwYoExZNBRGPEin4+fkcFhdSCRM+REIXEBIAAwBhChsqJCUzNTQjIiIiFxpHSEgbFxkaAwQ9OjoxNTRQTlAtJioBDRgdCg2iFjM9MzU1MDEjISITFxdsbGwXA=",
      "filename": "example.png"
   }
}
```

#### `description`

```json
{
   "title": "Do the `thing`"
}
```

#### `enrich`

```json
{
   "title": "Do the `thing`",
   "description": "# Doing the thing\n\n- Do the thing.\n- Do the other thing.",
   "image": {
      "data": "iVBORw0KGgoAAAANSUhEUgAAAUQAAAFECAMAAABoNLf0AAAC/VBMVEVHcEwcFBUSDQ4CAgEDAQENBwja0NU1AwgDAwHu7+8SBwgDAgIXDw8bEBITCwwFBQQOCAkbEhTs6e8JBwhLRUYbDxMWDhArAgsFAgIDAwMLCgoeAgUbDhD49fgYERMSDQ4TCw4GAwMDAwIDAAAJAwUNCwsjIyPx7vQWCQsnJCQWCgsXExP29vgZEBEkDRARCw0pFBcMBgcaCAsODgwWDA37+fsKDgsmHB4hDxEFGTAHDQsNCgkTDg8nJSYaDQ8jDhF0DSMbDA8oAwYoExZNBRGPEin4+fkcFhdSCRM+REIXEBIAAwBhChsqJCUzNTQjIiIiFxpHSEgbFxkaAwQ9OjoxNTRQTlAtJioBDRgdCg2iFjM9MzU1MDEjISITFxdsbGwXA=",
      "filename": "example.png"
   }
}
```

⚠️ **IMPORTANT:** ⚠️ Follow ALL rules in @AGENTS.md RELIGIOUSLY. This is a critical part of the workflow, and MUST be borne in mind AT ALL TIMES. If you come across a conflict, ask me for resolution.
