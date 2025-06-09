# CLAUDE.md - AI Agent Instructions

## 🚨 CRITICAL DEVELOPMENT RULES (MUST FOLLOW ALWAYS)

These rules are MANDATORY and override all other considerations. Follow them religiously on every task.

### 1️⃣ **NO BACKWARDS COMPATIBILITY** (Pre-Production Only)

**RATIONALE**: We are NOT in production yet. Break things freely to improve code quality.

**WHAT THIS MEANS**:
- Remove fields from JWT tokens without migration
- Delete KV storage keys without data preservation
- Change API responses without version compatibility
- Modify database schemas destructively
- Refactor interfaces without legacy support

**REQUIRED ACTIONS**:
- ✅ Document all breaking changes in CLAUDE.md and README.md
- ✅ List what will break for users
- ✅ Explain why the change improves the codebase
- ❌ Do NOT write migration code
- ❌ Do NOT preserve old field names or formats

**REMOVAL DATE**: This rule will be removed when we enter production.

### 2️⃣ **PRIORITIZE QUALITY OVER SPEED**

**RATIONALE**: Perfect code quality is more valuable than fast delivery.

**WHAT THIS MEANS**:
- Spend unlimited time getting implementations right
- Use as many AI calls as needed for research and verification
- Choose the most robust solution, not the quickest
- Refactor ruthlessly when you spot improvements

**FORBIDDEN**:
- ❌ "Good enough" implementations
- ❌ Quick hacks or shortcuts
- ❌ Worrying about API call costs
- ❌ Rushing to completion

### 3️⃣ **MANDATORY TESTING**

**RATIONALE**: Untested code WILL break. Tests prevent regressions and ensure correctness.

**RULES**:
- **EVERYTHING with logic or side effects MUST have a test**
- **NO EXCEPTIONS** - if you write a function, write its test
- Tests must cover edge cases and error conditions
- Tests must run successfully before committing

**WHAT TO TEST**:
- ✅ All API endpoints (backend MANDATORY)
- ✅ Utility functions with logic
- ✅ Authentication and validation
- ✅ Database operations
- ✅ Error handling paths

**WHAT TO SKIP**:
- ❌ Trivial getters/setters with no logic
- ❌ Frontend components (often impractical)
- ❌ Pure configuration objects

**TESTING COMMANDS**:
```bash
bun run test        # Unit tests with Vitest
bun run test:ui     # Interactive test runner
bun run test:api    # HTTP API integration tests
```

### 4️⃣ **SYNCHRONIZED DOCUMENTATION**

**RATIONALE**: Outdated docs are worse than no docs. They mislead and waste time.

**BREAKING CHANGE**: README.md is now a placeholder file only. All documentation lives exclusively in CLAUDE.md.

**MANDATORY UPDATES**:
After ANY significant change, update `CLAUDE.md` which is the single source of truth for all documentation.

**UPDATE TRIGGERS**:
- API endpoint changes
- New features or removed features
- Architecture modifications
- Authentication changes
- Configuration changes
- Breaking changes

**DOCUMENTATION STYLE**:
- CLAUDE.md: Complete technical documentation, examples, setup instructions, and all project information
- README.md: Minimal placeholder redirecting to CLAUDE.md

### 5️⃣ **QUALITY VERIFICATION WORKFLOW**

**RATIONALE**: Automated checks catch bugs before they reach users.

**MANDATORY SEQUENCE** (Do NOT skip steps):

1. **PRIMARY CHECKS** (run these first):
   ```bash
   bun run lint        # Linting with Biome and Trunk
   bun run typecheck   # TypeScript type verification
   bun run test        # Unit test suite
   ```

2. **FULL BUILD** (only after primary checks pass):
   ```bash
   bun run check       # Comprehensive build + all checks
   ```
   - ⚠️ Expensive operation - only run when everything else passes
   - ⚠️ This will catch final integration issues

**IF CHECKS FAIL**:
- Fix the issues immediately
- Do NOT commit broken code
- If you must defer fixes, add specific TODO comments

**BYPASS CONDITIONS** (very rare):
- Scoping limitations require deferring work
- Must add `// TODO: [specific description of what needs fixing]`

### 6️⃣ **COMMIT HYGIENE**

**RATIONALE**: Good commit history enables debugging, rollbacks, and collaboration.

**WHEN TO COMMIT**:
- After completing any feature
- After fixing any bug
- After any significant refactoring
- Before starting new work

**COMMIT SEQUENCE**:
1. **Primary method** (auto-generates commit messages):
   ```bash
   git add -A . && oco --fgm --yes
   ```

2. **Fallback method** (if primary fails):
   ```bash
   git add -A . && git commit -am "[emoji] [description]"
   ```
   - Use descriptive emojis: 🐛 bugs, ✨ features, 🔧 improvements, 📝 docs
   - Keep to single line
   - Be specific about what changed

**NEVER COMMIT**:
- ❌ Failing tests
- ❌ TypeScript errors
- ❌ Linting violations
- ❌ Broken builds

### 7️⃣ **ZERO TOLERANCE FOR MOCK DATA**

**RATIONALE**: This app prioritizes debugging visibility over user experience. Real failures are better than fake success.

**CORE PRINCIPLE**: Use ONLY real service calls (`env.AI.run()`, `env.DATA.get/put()`). Crash loudly when services fail.

**FORBIDDEN PATTERNS**:
- ❌ `Math.random()` for data generation
- ❌ Hardcoded percentages/metrics ("99.2%", "success rate: 95%")
- ❌ Mock time series or chart data
- ❌ Simulated delays or processing times
- ❌ Default fallback values that mask missing data
- ❌ "Demo" modes with fake data
- ❌ Try/catch blocks returning fake data instead of re-throwing
- ❌ Loading states with placeholder data that looks real
- ❌ `shouldAllowMockData()` conditional switches

**REQUIRED BEHAVIOR**:
- ✅ Real service calls with explicit error handling
- ✅ Throw errors when real data unavailable
- ✅ Return proper HTTP codes (500/503) when services fail
- ✅ Log errors for debugging without masking them
- ✅ Let components crash visibly when data missing
- ✅ Document service limitations clearly

**DETECTION WARNING**: Mock patterns often lack obvious keywords. Search for `mock|fake|simulate` won't catch subtle violations. **Manual review required** for hardcoded calculations, "safe" defaults, or fallback values.

**EXCEPTION**: Mocks are acceptable in test files only.

### 8️⃣ **NO INCOMPLETE IMPLEMENTATIONS**

**RATIONALE**: Deferred work gets forgotten. Incomplete code hides problems and creates technical debt.

**CORE RULE**: Nothing gets left "for later" without explicit marking.

**FORBIDDEN PATTERNS**:
- ❌ Empty function bodies waiting for implementation
- ❌ Generic errors without real functionality
- ❌ Comments like "implement later" without TODO
- ❌ Partial implementations that silently do nothing
- ❌ Components rendering empty without indicating why

**REQUIRED BEHAVIOR**:
- ✅ Every incomplete piece MUST have `// TODO: [specific description]`
- ✅ TODO comments must be searchable and specific
- ✅ Prefer explicit errors over silent incomplete behavior
- ✅ Make incompleteness obvious to developers

**TODO FORMAT**:
```typescript
// TODO: Implement user preference caching with Redis
throw new Error("User preferences not implemented yet")

// TODO: Add rate limiting with sliding window algorithm
// TODO: Validate image file types and sizes
```

**PRINCIPLE**: Better to crash visibly than fail silently.

### 9️⃣ **KV SIMPLE DATA STORAGE**

**RATIONALE**: KV storage should contain simple, directly usable data values. Complex wrapper objects defeat the purpose of key-value storage and make debugging harder.

**CORE RULE**: KV values must be simple data types. Multiple KV operations are acceptable to achieve this simplicity.

**REQUIRED PATTERNS**:
- ✅ Store simple values: strings, numbers, booleans, simple JSON objects
- ✅ Use colon-separated hierarchical keys: `metrics:api:internal:ok`
- ✅ Use lowercase kebab-case for all key segments: `auth:revocation:token-uuid`
- ✅ Multiple KV reads/writes are acceptable for data organization
- ✅ Direct KV operations: `kv.put(key, value)` in Workers, `cloudflare.kv.namespaces.values.update(id, key, {value})` in CLI

**FORBIDDEN PATTERNS**:
- ❌ Metadata wrapper objects: `{ "value": "data", "metadata": "{}" }`
- ❌ Complex nested objects as single KV values (prefer multiple keys)
- ❌ Using `metadata` parameter in Cloudflare SDK calls
- ❌ CamelCase or snake_case in key names
- ❌ Non-hierarchical flat keys when structure is needed

**KEY NAMING CONVENTIONS**:
```typescript
// ✅ CORRECT - hierarchical, lowercase, kebab-case
"metrics:api:internal:ok"
"auth:revocation:abc123def456"
"redirect:github"
"dashboard:cache:user-stats"

// ❌ WRONG - flat, mixed case, underscores
"metricsApiInternalOk"
"auth_revocation_abc123def456"
"redirectGithub"
```

**KV OPERATION EXAMPLES**:
```typescript
// ✅ CORRECT - Workers Runtime KV
await env.DATA.put("metrics:api:ok", "42")
await env.DATA.put("auth:revocation:uuid", "true")

// ✅ CORRECT - Cloudflare SDK (CLI tools)
await cloudflare.kv.namespaces.values.update(namespace, key, {
  account_id: accountId,
  value: "42"  // No metadata parameter
})

// ❌ WRONG - metadata wrapper
await cloudflare.kv.namespaces.values.update(namespace, key, {
  account_id: accountId,
  value: "42",
  metadata: "{}"  // This creates wrapper objects
})
```

**PRINCIPLE**: KV storage should be transparent and debuggable. Simple data in, simple data out.

**DATA MANAGEMENT**: Update `data/kv/_init.yaml` when defining new KV keys or modifying the schema structure. This file serves as the canonical reference for all KV key definitions and should be kept synchronized with code changes.

### 🔟 **MANDATORY SHARED CODE EXTRACTION**

**RATIONALE**: Duplicated code creates maintenance burden, increases bug risk, and violates DRY principles. Shared functionality must be extracted immediately.

**CORE RULE**: Whenever you spot duplicated logic patterns, extract them into shared utilities or middleware. No exceptions.

**WHAT MUST BE SHARED**:
- ✅ Validation logic appearing in multiple endpoints
- ✅ Data transformation and formatting functions
- ✅ Authentication and authorisation checks
- ✅ External service integration (R2, AI, KV operations)
- ✅ Error handling patterns
- ✅ File processing and manipulation
- ✅ Hash generation and verification

**EXTRACTION REQUIREMENTS**:
- ✅ Create shared function in appropriate `server/utils/` file
- ✅ Add comprehensive JSDoc documentation
- ✅ Include TypeScript types for all parameters and returns
- ✅ Write comprehensive tests for shared functions
- ✅ Update all existing code to use shared implementation
- ✅ Document breaking changes if function signatures differ

**FORBIDDEN PATTERNS**:
- ❌ Copy-pasting similar code between endpoints
- ❌ "Minor differences" justifying separate implementations
- ❌ Deferring extraction with TODO comments
- ❌ One-off implementations for common operations

**IMMEDIATE ACTION**: When reviewing code, shared patterns MUST be extracted before proceeding with new work.

**PRINCIPLE**: Write once, use everywhere. Every duplicated line is a future bug waiting to happen.

## Overview

Nuxt 3 + Cloudflare Workers REST API platform. Migrated from simple Worker to enterprise-grade application with authentication, validation, testing, deployment automation.

## Tech Stack

**Runtime**: Nuxt 3 + Cloudflare Workers (`cloudflare_module`)
**Auth**: JWT + JOSE, hierarchical permissions
**Validation**: Zod schemas + TypeScript
**Testing**: Vitest + custom HTTP API suite
**Tools**: Bun, Biome, TypeScript strict

## Structure

**Key Paths**:

- `server/api/` - API endpoints
- `server/utils/` - Auth, response helpers, schemas
- `bin/` - CLI tools (jwt.ts, kv.ts, api-test.ts)

## Authentication

**Dual Methods**: Bearer tokens (`Authorization: Bearer <jwt>`) + URL params (`?token=<jwt>`)
**JWT Structure**: `{sub, iat, exp?, jti?}`
**Hierarchical Permissions**: `category:resource` format. Parent permissions grant child access. `admin`/`*` = full access.
**Categories**: `api`, `ai`, `dashboard`, `admin`, `*`

## Endpoints

**Public** (4): `/api/internal/health`, `/api/internal/ping`, `/api/internal/worker`, `/go/{slug}`
**Protected**: All others require JWT with appropriate scope
**Key Protected**:

- `/api/internal/auth` - Token validation (any token)
- `/api/internal/metrics` - API metrics (`api:metrics`+)
- `/api/ai/alt` - Alt-text generation (`ai:alt`+)
- `/api/tokens/{uuid}/*` - Token management (`api:tokens`+)

**Token Management**: Use `bin/jwt.ts` for create/verify/list/revoke operations

## Key APIs

**Core**: `/api/internal/health`, `/api/internal/ping`, `/api/internal/auth`, `/api/internal/metrics` (json/yaml/prometheus)
**AI**: `/api/ai/alt` (GET url param, POST raw base64)
  - **BREAKING CHANGE**: POST handler no longer accepts data URLs. Supply raw base64 only.
  - Images automatically optimised using direct function invocation before AI processing
**Images**: `/api/images/optimise` (GET/POST), `/api/images/optimise/preset/{preset}`
  - WebP conversion with smart compression strategy
  - R2 storage with BLAKE3 hash filenames: `{BLAKE3_HEX}-q{QUALITY}.webp` or `{BLAKE3_HEX}-ll.webp` for lossless
  - File existence caching to avoid duplicate processing
  - Direct function invocation for AI processing (no HTTP overhead)
  - Requires `api:images` permission scope
**Tokens**: `/api/tokens/{uuid}/usage`, `/api/tokens/{uuid}/revoke`
**Redirects**: `/go/{slug}` (gh/tw/li)

## Metrics

**Storage**: KV-based metrics for fast dashboard queries
**Counters**: Request tracking, redirect clicks, auth events, AI operations
**Functionality**: Real-time KV storage with hierarchical keys, automatic aggregation

## Response Format

**Success**: `{success: true, data?, message?, meta?, timestamp}`
**Error**: `{success: false, error, details?, meta?, timestamp}`
**Meta**: Contains requestId, timestamp, cfRay, datacenter, country

## Config

**Env**: `API_JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
**Bindings**: KV (DATA), D1 (DB), AI, R2 (IMAGES)
**Optional**: `NUXT_PUBLIC_API_BASE_URL=/api`
**Dev Options**:

- `API_DEV_USE_DANGEROUS_GLOBAL_KEY=1` - Use legacy API key authentication (requires `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`)

## Testing

**Unit**: Vitest + happy-dom in `test/` - `bun run test|test:ui|test:coverage`
**HTTP API**: `bin/api-test.ts` - End-to-end testing - `bun run test:api [--auth-only|--ai-only|etc]`
**Remote**: `bun run test:api --url https://example.com`

## CLI Tools

**JWT** (`bin/jwt.ts`): `init|create|verify|list|show|search|revoke` - D1 + KV integration
**API Test** (`bin/api-test.ts`): Comprehensive endpoint testing
**KV** (`bin/kv.ts`): `export|import|list|wipe` - YAML-based data management with safeguards. Local mode (`--local`) for development.
**Deploy Env** (`bin/deploy-env.ts`): Secure production environment deployment - validates configuration, filters dev variables, deploys via wrangler

## Security

**Headers**: CORS, CSP, security headers, cache control disabled for APIs
**Validation**: Zod schemas for all inputs, TypeScript integration, file upload limits

## Development

**Commands**: `bun check` (comprehensive), `bun run typecheck|lint|format|test|test:api|build`
**Deployment**: `bun run deploy:env` (environment variables), `bun run deploy` (full deployment)
**Style**: Biome linting/formatting, TypeScript strict, minimal comments, consistent error patterns

## Linting & Type Guidelines

**TypeScript `any` Types**:

- Prefer specific types whenever possible
- Use `any` when necessary for external libraries or complex dynamic structures
- Consider `: any` AND `as any`
- **ALWAYS** add Biome ignore comment when using `any`: `// biome-ignore lint/suspicious/noExplicitAny: [REASON FOR ANY TYPE USAGE]`

**Unused Variables/Functions**:

- Commonly flagged when used in Vue templates only
- Verify template usage, then add ignore comment: `// biome-ignore lint/correctness/noUnusedVariables: [REASON FOR LINTER CONFUSION]`
- Example reasons: "Used in template", "Vue composition API reactive", "Required by framework"

## Deployment

**Setup**: Create KV/D1 resources, configure `wrangler.jsonc`, set secrets
**Environment**: `bun run deploy:env` - validates config, excludes API_DEV_* vars, requires CLOUDFLARE_API_TOKEN
**Process**: `bun check` → `bun run deploy:env` → `bun run deploy` → monitor
**Verification**: Test `/api/health` and run `bun run test:api --url production-url`

**Environment Deployment Safety**:

- Only deploys production-safe variables from `.env`
- Validates required: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `API_JWT_SECRET`
- Excludes all `API_DEV_*` variables and legacy `CLOUDFLARE_API_KEY`/`CLOUDFLARE_EMAIL`
- Uses secure wrangler secret deployment via STDIN

## Key Files

**Config**: `nuxt.config.ts`, `wrangler.jsonc`, `vitest.config.ts`, `biome.json`
**Core**: `server/utils/{auth,schemas,response}.ts`, `server/middleware/{error,shell-scripts}.ts`
**Image Processing**: `server/utils/{image-processing,image-presets,image-optimisation}.ts`
**Examples**: `server/api/internal/{auth,metrics}.get.ts`, `server/api/ai/alt.{get,post}.ts`

## Migration Context

Maintains API compatibility with original Worker while adding: TypeScript + Zod validation, comprehensive testing, enhanced JWT auth, consistent error handling, CLI tools, security headers.

## Installation & Setup

### Prerequisites

- **Bun** (recommended package manager)
- **Node.js 18+**
- **Cloudflare Account**

### Installation Process

```bash
# Clone repository
git clone https://github.com/daveio/next-dave-io.git
cd next-dave-io

# Install dependencies
bun install

# Environment setup
cp .env.example .env
# Edit .env with required values

# Generate types and prepare
bun run types
bun run nuxt prepare

# Start development
bun run dev
```

### Environment Variables

**Required Configuration**:

```bash
# JWT Secret (required for authentication)
API_JWT_SECRET=your-super-secret-jwt-key-that-definitely-isnt-password123

# Cloudflare credentials (required for production)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Public API base URL
NUXT_PUBLIC_API_BASE_URL=/api
```

**Development Options**:

```bash
# Legacy API key authentication (development only)
API_DEV_USE_DANGEROUS_GLOBAL_KEY=1
CLOUDFLARE_API_KEY=your-api-key
CLOUDFLARE_EMAIL=your-email
```

## Project Structure

```plaintext
├── server/                  # Backend API implementation
│   ├── api/                 # API endpoints
│   │   ├── internal/        # System endpoints (health, auth, metrics)
│   │   ├── ai/              # AI services (alt-text generation)
│   │   ├── images/          # Image optimisation service
│   │   ├── dashboard/       # Dashboard data feeds
│   │   └── tokens/          # Token management
│   ├── utils/               # Shared server utilities
│   │   ├── auth.ts          # Authentication logic
│   │   ├── response.ts      # Response formatting
│   │   ├── schemas.ts       # Zod validation schemas
│   │   ├── image-*.ts       # Image processing utilities
│   │   └── environment.ts   # Runtime configuration
│   └── middleware/          # Request middleware
├── test/                    # Unit tests (Vitest)
├── bin/                     # CLI tools
│   ├── jwt.ts              # JWT token management
│   ├── api-test.ts         # HTTP API testing
│   ├── kv.ts               # KV storage management
│   └── deploy-env.ts       # Environment deployment
├── types/                   # TypeScript definitions
├── data/kv/                 # KV data exports/imports
└── wasm/reader/             # WebAssembly utilities
```

## Complete API Examples

### Core System Endpoints

```bash
# Health check
curl http://localhost:3000/api/internal/health

# System ping with metrics
curl http://localhost:3000/api/internal/ping

# Worker runtime info
curl http://localhost:3000/api/internal/worker

# Token validation
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/auth
```

### Metrics API

```bash
# JSON format (default)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics

# YAML format
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics?format=yaml

# Prometheus format
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics?format=prometheus
```

### AI Alt-Text Generation

```bash
# GET with URL parameter
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/ai/alt?url=https://example.com/image.jpg"

# POST with base64 data
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"image": "<base64-image>"}' \
  http://localhost:3000/api/ai/alt
```

### Image Optimisation

```bash
# General optimisation with quality
curl -X POST "https://dave.io/api/images/optimise" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"image": "<base64-data>", "quality": 80}'

# Smart compression (follows input format)
curl -X POST "https://dave.io/api/images/optimise" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"image": "<base64-data>"}'

# AI-ready preset (≤ 4MB)
curl -X GET "https://dave.io/api/images/optimise/preset/alt?url=https://example.com/image.jpg" \
  -H "Authorization: Bearer $JWT"
```

## Complete CLI Usage

### JWT Token Management

```bash
# Initialize D1 database schema
bun jwt init

# Create tokens with specific permissions
bun jwt create --sub "api:metrics" --description "Metrics access" --expiry "30d"
bun jwt create --sub "ai:alt" --description "Alt-text generation" --expiry "7d"
bun jwt create --sub "api:images" --description "Image processing" --expiry "7d"
bun jwt create --sub "api" --description "Full API access" --expiry "1d"
bun jwt create --sub "admin" --description "God mode" --no-expiry --seriously-no-expiry

# Token operations
bun jwt verify "eyJhbGciOiJIUzI1NiJ9..."
bun jwt list
bun jwt show <uuid>

# Search tokens
bun jwt search --sub "api"
bun jwt search --description "test"
bun jwt search --uuid "123e4567-e89b"

# Revoke tokens
bun jwt revoke <uuid>
bun jwt revoke <uuid> --confirm

# Interactive mode
bun jwt create --interactive
```

### KV Storage Management

```bash
# Remote operations (production)
bun run kv export                    # Export selected patterns
bun run kv export --all              # Export everything
bun run kv import data/kv/backup.yaml
bun run kv import backup.yaml --yes  # Skip confirmation
bun run kv import backup.yaml --wipe # Nuclear import
bun run kv list
bun run kv list --pattern "metrics"
bun run kv wipe                      # Requires CONFIRM_WIPE=yes

# Local operations (development)
bun run kv --local export
bun run kv --local import backup.yaml
bun run kv --local list
bun run kv --local wipe
```

### API Testing

```bash
# Test local development
bun run test:api

# Test production
bun run test:api --url https://dave.io

# Focused testing
bun run test:api --auth-only
bun run test:api --metrics-only
bun run test:api --ai-only
bun run test:api --dashboard-only

# Use existing token
bun run test:api --token "eyJhbGciOiJIUzI1NiJ9..."
```

## YAML KV Schema Structure

**Complete YAML Structure with Anchors**:

```yaml
_anchors:  # Anchor definitions (excluded from import)
  sample_metrics: &sample_metrics
    ok: 0
    error: 0
    times: { last-hit: 0, last-error: 0, last-ok: 0 }

metrics:
  resources:
    internal:
      <<: *sample_metrics  # Reference anchor
      ok: 100             # Override values
    ai:
      <<: *sample_metrics
      ok: 50
  redirect: {}
  <<: *sample_metrics      # Top-level metrics

redirect:
  gh: https://github.com/daveio
  blog: https://blog.dave.io
```

**Converted to Flat KV Keys**:

```plaintext
metrics:ok = "1000"
metrics:error = "50"
metrics:resources:internal:ok = "500"
metrics:resources:ai:ok = "200"
redirect:gh = "https://github.com/daveio"
```

## KV Visual Documentation

**Reference Files**:
- **📊 [Interactive Mermaid Diagram](KV.mmd)** - Source diagram
- **🖼️ [Vector Graphic (SVG)](KV.svg)** - Scalable documentation
- **📸 [Raster Image (PNG)](KV.png)** - Static reference

## Deployment Process

### Initial Cloudflare Setup

```bash
# Create Cloudflare resources
wrangler kv:namespace create DATA
wrangler d1 create NEXT_API_AUTH_METADATA

# Update wrangler.jsonc with resource IDs
# JWT tool reads these automatically

# Initialize database schema
bun jwt init

# Deploy environment variables
bun run deploy:env

# Deploy application
bun run deploy

# Test deployment
bun run test:api --url https://your-worker.your-subdomain.workers.dev

# Create production token
bun jwt create --sub "admin" --description "Production admin" --expiry "90d"
```

### Ongoing Deployment

```bash
# Development workflow
bun run dev

# Quality checks (mandatory)
bun check

# Deploy to production
bun run deploy

# Verify deployment
curl https://your-production-url.com/api/health
```

## Technologies Used

- **Nuxt 3**: Vue.js framework
- **TypeScript**: Type safety and development experience
- **Zod**: Runtime schema validation
- **JOSE**: JWT handling and cryptography
- **Vitest**: Unit testing framework
- **Cloudflare Workers**: Serverless runtime
- **Bun**: JavaScript runtime and package manager
- **Biome**: Code linting and formatting
- **Commander**: CLI framework for bin/ tools

## Build Warnings (Safe to Ignore)

During builds, Cloudflare SDK warnings appear:

```plaintext
node_modules/cloudflare/core.mjs (...): The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten
```

These warnings are harmless and come from the official Cloudflare SDK. They do not affect functionality and can be safely ignored.

## Documentation Guidelines

1. **CLAUDE.md**: Authoritative technical documentation for AI agents and developers
2. **README.md**: Placeholder file only - all documentation lives in CLAUDE.md
3. **Technical accuracy**: Test all examples and commands before documenting
4. **Comprehensive coverage**: Include complete examples and configuration details
5. **Update requirement**: Synchronize CLAUDE.md after any significant changes

## AI Agent Guidelines

**Code Quality**: Maintain API compatibility, use hierarchical auth, Zod validation, type guards, comprehensive tests
**Type Safety**: TypeScript strict, avoid `any`, schema-first development, export types via `types/api.ts`
**Testing**: Unit + integration tests, test auth hierarchies and error scenarios
**Performance**: Monitor bundle size, minimise cold starts, optimise caching
**Security**: Validate all inputs, verify tokens/permissions, security headers, log security events

Reference implementation for production-ready serverless APIs with TypeScript, testing, enterprise security.

## KV Metrics System

**BREAKING CHANGE**: Metrics moved from a single JSON blob to separate KV keys.

**Storage**: Each counter is stored under its own key such as `metrics:ok` or `metrics:resources:internal:ok`.
**Organization**: Colon-separated segments group metrics by type, resource, or redirect.
**Data Format**: YAML export/import with anchor support remains for convenience.
**Performance**: Individual key updates keep writes lightweight; dashboards perform multiple reads.
**Middleware**: `recordAPIMetrics()` and `recordAPIErrorMetrics()` handle updates automatically.

### Example Key Layout
```plaintext
metrics:ok = "42"
metrics:error = "3"
metrics:resources:internal:ok = "20"
metrics:redirect:gh:ok = "15"
```

**Resource Extraction**: The first URL segment after `/api/` becomes the resource; `/go` endpoints use the `go` resource.
**User Agent Classification**: Automatic bot/human/unknown detection based on user agent patterns.
**Metrics Updates**: `updateAPIRequestMetrics()` and `updateRedirectMetrics()` increment each key.
**YAML Export**: Keys and values are exported in structured YAML.

### Migration from Legacy Schema

**REMOVED**: All legacy KV counter functions (`createAPIRequestKVCounters`, `createAuthKVCounters`, `createAIKVCounters`, `createRedirectKVCounters`, `writeKVMetrics`).
**REPLACED**: The monolithic `metrics` JSON object with individual metric keys.
**ADDED**: `/go` resource tracking (previously excluded from metrics).
**IMPROVED**: Consistent metrics across all endpoints via middleware functions.

### Image Optimisation Breaking Changes

**BREAKING CHANGE**: Filename format changed from `{UNIX_TIME}-{BLAKE3_HASH}.webp` to `{BLAKE3_HEX}-q{QUALITY}.webp` or `{BLAKE3_HEX}-ll.webp`.

**REMOVED**: Duplicated image processing code across endpoints.
**REPLACED**: HTTP-based internal calls with direct function invocation for AI processing.
**ADDED**: Smart caching based on quality settings and image content hash.
**ADDED**: Minimum quality enforcement (10-100 range) with automatic bumping.
**IMPROVED**: Shared utilities for validation, hashing, R2 upload, and preset processing.
**FIXED**: Hash extraction bugs with hyphenated filenames and base64 encoding.
**FIXED**: Resizing logic that could enlarge images beyond original dimensions.

## Next Steps

**Immediate**: Frontend dev, enhanced monitoring, JWT management dashboard
**Security**: Token rotation, IP allowlisting, audit logging, content validation
**Performance**: Response caching, bundle optimisation, compression, CDN
**DevEx**: OpenAPI docs, client SDKs, Docker dev env, CI/CD, monitoring dashboard
**Architecture**: Microservices, event-driven (Queues), multi-tenancy, API versioning, WebSockets (Durable Objects)

**Completed**: ✅ D1 integration, ✅ Code quality, ✅ Real AI integration, ✅ Custom domain, ✅ Rate limiting removal, ✅ JWT maxRequests field removal, ✅ Image optimisation service

## KV Data Management

**BREAKING CHANGE**: Enhanced YAML support with anchors and integer handling.

**Export/Import**: YAML-based data exchange with hierarchical structure and anchor support
**Commands**:
- `bun run kv export [--all] [--local]` - Export to timestamped YAML in `data/kv/`
- `bun run kv import <file> [--yes] [--wipe] [--local]` - Import from YAML with confirmation
- `bun run kv list [--pattern] [--local]` - List keys with optional filtering
- `bun run kv wipe [--local]` - Nuclear option with safety confirmation

**Local Development Mode**: Use `--local` flag to operate on wrangler's local KV simulator instead of remote Cloudflare API. Perfect for development and testing without affecting production data.

**YAML Enhancements**:
- **Integer Handling**: Numeric values exported as integers, not strings
- **Anchor Support**: Full YAML anchor/reference support for DRY configuration
- **Structured Export**: Hierarchical nested structure matching new KV schema
- **Anchor Filtering**: `_anchors` section excluded from import (anchor definitions only)

**Import Safety**: Detects overwrites, requires confirmation via `--yes`/`-y` flags or `KV_IMPORT_ALLOW_OVERWRITE=1` environment variable
**Wipe Option**: `--wipe`/`-w` flag clears namespace before import for clean state
**File Format**: YAML for human readability, git-friendly version control, and configuration management
**Pattern Filtering**: Export respects configured key patterns unless `--all` specified

**Schema Compatibility**: Imports automatically convert nested YAML structure to flat KV keys for backward compatibility
**Data Validation**: TypeScript schemas validate imported data structure before KV storage

## Image Optimisation Service

**Purpose**: Automatic image resizing, compression, and WebP conversion for improved load times and AI processing compatibility.

**Endpoints**:
- `GET /api/images/optimise?url=<image_url>[&quality=N]` - Optimise from URL
- `POST /api/images/optimise` - Optimise from base64 data with options
- `GET /api/images/optimise/preset/alt?url=<image_url>` - AI-optimised preset (≤ 4MB)
- `POST /api/images/optimise/preset/alt` - AI-optimised preset from base64

**Features**:
- **WebP Conversion**: All images converted to WebP format with transparency preservation
- **Smart Compression**: Lossy for JPEG inputs, lossless for PNG/other formats
- **R2 Storage**: Files stored in `images-dave-io` bucket with `/opt/` prefix
- **BLAKE3 Hashing**: Filename generation based on original image content
- **AI Integration**: Alt text endpoints automatically use optimisation service

**Filename Format**: `{BLAKE3_HEX}-q{QUALITY}.webp` or `{BLAKE3_HEX}-ll.webp` for lossless
**Storage URL**: `https://images.dave.io/opt/{filename}`
**Authentication**: Requires `api:images` permission scope
**File Size**: 4MB limit after base64 decoding

**Compression Strategy**:
- Quality parameter specified → lossy WebP at specified quality (minimum 10, maximum 100)
- Quality below 10 automatically bumped to minimum value 10
- JPEG input (no quality) → lossy WebP at quality 80
- PNG/other lossless formats (no quality) → lossless WebP with maximum effort

**Alt Preset Strategy** (≤ 4MB target):
1. **Phase 1**: Binary search quality optimisation (10-95 quality range)
2. **Phase 2**: If still too large, reduce dimensions by 15% per iteration
3. **Hard Limit**: 1024px minimum on long edge before error
4. **Fallback**: Lossy compression with minimum quality if needed
5. **Error Handling**: 422 error if cannot achieve target at minimum dimensions

**Performance Improvements**:
- **Smart Caching**: Quality-based filename generation enables automatic cache hits
- **Direct Function Invocation**: AI processing uses direct function calls instead of HTTP requests
- **Shared Utilities**: Extracted common image processing logic to prevent code duplication
- **Hash Extraction Fix**: Resolved filename parsing issues with hyphenated base64 hashes

**TODO**: Fix test configuration issues - tests are hanging during execution
