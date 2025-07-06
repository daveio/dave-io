# `dave.io`

## 🛑 MANDATORY RULES - CHECK BEFORE EVERY ACTION

### PRE-TASK CHECKLIST (Mental Review Required)

□ Am I following ALL 11 rules below?
□ Have I checked `AGENTS.md` for latest specs?
□ Will my code be production-ready?

### THE 11 COMMANDMENTS

**1. BREAK**: Ship breaking changes freely. Document in `AGENTS.md`. Never add migration code. THIS DOES NOT APPLY TO DATABASE MIGRATIONS.

**2. PERFECT**: Take unlimited time/calls for correctness. Refactor aggressively. No "good enough".

**3. TEST**: Test everything with logic/side effects. Commands: `bun run test`, `bun run test:ui`, `bun run test:api`. Skip only: trivial getters, UI components, config.

**4. SYNC**: `AGENTS.md` = truth. Update after API/feature/auth changes. `CLAUDE.md` & `README.md` derive from `AGENTS.md`.

**5. VERIFY**: `bun run build` → `bun run lint:eslint`, `bun run lint:trunk`, `bun run lint:types`, `bun run test` → `bun run check`. Never continue with errors.

**6. COMMIT**: `git add -A . && oco --fgm --yes` after each feature/fix/refactor.

**7. REAL**: Use actual service calls only (`env.AI.run()`, `env.KV.get/put()`). Crash on failure. No mocks/randoms/delays (except tests).

**8. COMPLETE**: Finish all code or mark `TODO: [description]`. Fail explicitly, never silently.

**9. TRACK**: TODOs use 6-hex IDs. Update TODO.md:

```typescript
// TODO: (37c7b2) Skip Bun mocking - test separately
```

```markdown
- **TODO:** _37c7b2_ `test/file.ts:18` Description
```

**10. KV**: Simple values only. Hierarchical keys: `metrics:api:ok`. Kebab-case: `auth:token-uuid`. Update `data/kv/_init.yaml`.

**11. SHARE**: Extract duplicated logic to `server/utils/` immediately. Add JSDoc+tests+types.

### ⚡ QUICK REFERENCE

**ALWAYS**: Break compatibility • Test everything • Real data only • Complete code • Extract duplicates • KV hierarchical keys
**NEVER**: Migration code (except database migrations) • Mock data • Silent failures • Copy-paste • Outdated docs • Complex KV values

## Tech Stack

- **Runtime**: Nuxt 3 + Cloudflare Workers | **Auth**: JWT + JOSE hierarchical | **Validation**: Zod + TypeScript | **Testing**: Vitest + HTTP API | **Tools**: Bun, Biome

## File Naming Conventions

### API Endpoints

```bash
server/api/example.get.ts          # GET /api/example
server/api/example.post.ts         # POST /api/example
server/api/users/[uuid].get.ts     # GET /api/users/{uuid}
server/api/users/[uuid]/[...path].get.ts # GET /api/users/{uuid}/{path}
server/routes/go/[slug].get.ts     # GET /go/{slug}
```

### Utilities & Tests

```bash
server/utils/feature-name.ts      # Utility functions
server/utils/feature-helpers.ts   # Helper functions
test/feature-name.test.ts         # Unit tests
test/api-feature.test.ts          # API integration tests
```

### Schema & Type Files

```bash
server/utils/schemas.ts           # All Zod schemas + OpenAPI
types/api.ts                      # Shared type definitions
worker-configuration.d.ts        # Cloudflare bindings
```

## Development Patterns

### Schema-First Development

```typescript
1. Define Zod schema in schemas.ts with .openapi() metadata
2. Use schema.parse() in endpoint for validation
3. Export schema type: `export type Example = z.infer<typeof ExampleSchema>`
4. Run: bun run generate:openapi
5. Verify public/openapi.json updated
```

### Redirect Handling

Server-side redirects in `/go/{slug}` routes are handled by:

- **Server Route**: `server/routes/go/[slug].get.ts` performs actual redirects using KV data
- **Client Plugin**: `plugins/external-redirects.client.ts` forces external navigation for `/go/*` links
- **Route Rules**: Nuxt config disables caching for `/go/**` routes to ensure fresh redirects
- **Behavior**: Links bypass client-side routing and trigger full page loads to hit server handlers

### Error Handling Standards

```typescript
// Always use createApiError for consistent format
throw createApiError(400, "Validation failed", validationDetails)

// Always use createApiResponse for success
return createApiResponse({
  result: data,
  message: "Operation successful",
  error: null
})

// Log errors before throwing
console.error("Endpoint error:", error)
recordAPIErrorMetrics(event, error)
throw error
```

### Authentication Flow

```typescript
// Use auth helpers for consistent patterns
const auth = await requireAPIAuth(event, "resource") // api:resource
const auth = await requireAIAuth(event, "alt") // ai:alt
const auth = await requireAdminAuth(event) // admin

// Access user info from auth.payload
const userId = auth.payload?.sub
const tokenId = auth.payload?.jti
```

## Auth & Endpoints

- **Methods**: `Authorization: Bearer <jwt>` + `?token=<jwt>`
- **JWT**: `{sub, iat, exp?, jti?}` | **Permissions**: `category:resource` (parent grants child) | **Categories**: `api`, `ai`, `dashboard`, `admin`, `*`
- **Public**: `/api/ping`, `/api/image/optimise`, `/go/{slug}`, `/api/ai/ticket/*`
- **Protected**: `/api/ai/alt` (`ai:alt`+), `/api/ai/social` (`ai:social`+), `/api/token/{uuid}/*` (`api:token`+)

## Breaking Changes

- **CLI**: Removed `bun try internal ping` → use `bun try ping`
- **API Responses**: Standardized structure with `{ok, result, error, status, timestamp}`, sorted object keys
- **Endpoints**: Merged `/api/internal/*` → `/api/ping`
- **API Structure**: Converted all endpoints to singular: `/tokens/` → `/token/`, `/images/` → `/image/`, `/ticket/` → `/ticket/`
- **Auth**: `--auth` auto-generates tokens, `--token <JWT>` for provided tokens
- **Dev**: No reset cycle, starts in seconds, `test:all` for full suite
- **AI Alt**: Raw base64 POST or multipart form upload, 4MB limit with auto-optimization
- **Images**: Cloudflare Images service, BLAKE3 IDs, global CDN
- **KV**: Individual keys vs JSON blob, hierarchical colon-separated, YAML anchors
- **Redirects**: Fixed `/go/*` routes to bypass client-side routing - links now redirect properly on first click instead of requiring a page refresh
- **AI Social**: New `/api/ai/social` endpoint for splitting text into social media posts using `@cf/meta/llama-4-scout-17b-16e-instruct` with JSON schema support and automatic threading indicators (`🧵 x/y`)

## Core

- **Response**: Success `{ok: true, result, error: null, status: {message}, timestamp}` | Error `{ok: false, error, status: {message}?, timestamp}`
- **Environment**: `API_JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Bindings: KV(KV), D1(D1), AI, Images
- **CLI**: JWT(`init|create|verify|list|revoke`) | API-Test(`--auth-only|--ai-only`) | Try(`--auth|--token`) | KV(`export|import|list|wipe --local`)
- **Testing**: Unit(`bun run test|test:ui`) | HTTP(`bun run test:api`) | Remote(`--url https://example.com`)

## Commands 🚀 (~3s dev startup, no circular deps)

| Workflow     | Command            | Purpose                |
| ------------ | ------------------ | ---------------------- |
| **Dev**      | `bun run dev`      | Types + dev server     |
| **Build**    | `bun run build`    | Clean + types + build  |
| **Deploy**   | `bun run deploy`   | Build + env + deploy   |
| **Check**    | `bun run check`    | CI/CD validation       |
| **Test**     | `bun run test`     | Quick unit tests       |
| **Test All** | `bun run test:all` | Unit + UI + coverage   |
| **Clean**    | `bun run clean`    | Remove build artifacts |
| **Reset**    | `bun run reset`    | Nuclear option         |

## Setup

**Prerequisites**: Node.js 18+, Bun, Cloudflare Images subscription

```bash
bun install && bun run dev  # Starts in ~3s
```

**Structure**: `server/{api,utils,middleware}`, `test/`, `bin/`, `types/`, `data/kv/`

## API Examples

```bash
curl http://localhost:3000/api/ping  # Status
curl -H "Authorization: Bearer <token>" "/api/ai/alt?url=https://example.com/image.jpg"  # Alt-text via URL
curl -X POST -F "image=@path/to/image.jpg" -H "Authorization: Bearer <token>" http://localhost:3000/api/ai/alt  # Alt-text via form
curl -X POST -d '{"description": "Fix bug"}' /api/ai/ticket/title  # AI title (public)
curl -X POST -H "Authorization: Bearer <token>" -d '{"input": "Long text...", "networks": ["bluesky", "mastodon"]}' /api/ai/social  # Split text
curl -X POST -d '{"image": "<base64>", "quality": 80}' /api/image/optimise  # Optimize via JSON
curl -F "image=@path/to/image.jpg" -F "quality=80" http://localhost:3000/api/image/optimise  # Optimize via form
```

## CLI Usage

```bash
bun jwt init && bun jwt create --sub "api:metrics" --expiry "30d"  # JWT
bun run kv export --all && bun run kv --local import backup.yaml  # KV
bun try --auth ai alt url "https://example.com/image.jpg"  # Try
bun run test:api --ai-only --url https://dave.io  # Test
```

## Deployment & Config

```bash
wrangler kv:namespace create KV && wrangler d1 create NEXT_API_AUTH_METADATA
bun jwt init && bun run deploy
```

**KV YAML**: `metrics: {ok: 0}` → `metrics:ok = "0"` | AI Social: `ai:social:characters:bluesky = "300"`
**Linting**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
**Images**: Cloudflare service, BLAKE3 IDs, 4MB limit, global CDN
**AI Social**: Character limits in KV (`ai:social:characters:{network}`), supports strategies: `sentence_boundary`, `word_boundary`, `paragraph_preserve`, `thread_optimize`, `hashtag_preserve`. Multi-post threads automatically get threading indicators (`🧵 1/3`, `🧵 2/3`, etc.) with 10 chars reserved per post.

## Performance Guidelines

### KV Storage Optimization

```typescript
// Use hierarchical keys for efficient querying
"metrics:api:ok" // Good: hierarchical
"metrics:api:tokens:usage" // Good: specific scope
"user_data_12345" // Bad: flat structure

// Simple values only, no complex objects
await kv.put("metrics:api:ok", "42") // Good: simple value
await kv.put("user:123", JSON.stringify(userObject)) // Bad: complex object
```

### Async Operation Patterns

```typescript
// Non-blocking metrics (fire and forget)
recordAPIMetricsAsync(event, statusCode) // Good: doesn't block response
await recordAPIMetrics(event, statusCode) // Bad: blocks response

// Real service calls (no mocks except tests)
const result = await env.AI.run(model, prompt) // Good: real AI call
const result = mockAI.generate() // Bad: mock data
```

## Security Standards

### Input Validation (MANDATORY)

```typescript
// Always validate at API boundaries
const validated = RequestSchema.parse(await readBody(event))

// Use validation helpers
const uuid = getValidatedUUID(event, "uuid")
validateURL(imageUrl, "image URL")

// Never trust external data
const userInput = sanitizeInput(rawInput)
```

### Secret Management

```typescript
// Environment variables only
const secret = process.env.API_JWT_SECRET // Good
const secret = "hardcoded-secret" // Bad: never commit secrets

// Check for default secrets in development
if (secret === "dev-secret-change-in-production") {
  console.warn("Using default JWT secret - insecure for production!")
}
```

### Output Sanitization

```typescript
// Never expose internal errors in production
catch (error) {
  console.error("Internal error:", error)  // Log for debugging
  throw createApiError(500, "Internal server error")  // Safe public message
}

// Don't include sensitive fields in responses
const publicUser = { id: user.id, name: user.name }  // Good: filtered
return createApiResponse({ result: user })           // Bad: might expose secrets
```

## Anti-Patterns (DO NOT DO)

### ❌ Code Quality

```typescript
// Don't copy-paste code
if (condition1) {
  /* same logic */
}
if (condition2) {
  /* same logic */
}

// Extract to shared utility instead
const sharedLogic = (condition) => {
  /* logic */
}
```

### ❌ Error Handling

```typescript
// Don't fail silently
try {
  riskyOperation()
} catch {
  /* ignored */
}

// Always handle errors explicitly
try {
  riskyOperation()
} catch (error) {
  console.error("Operation failed:", error)
  throw createApiError(500, "Operation failed")
}
```

### ❌ Response Format

```typescript
// Don't return inconsistent formats
return { success: true, data: result }           // Bad: non-standard
return { ok: true, result, error: null, ... }   // Good: standard format
```

### ❌ Testing

```typescript
// Don't skip tests for business logic
function calculateTotal(items) {
  /* complex logic */
} // Needs tests

// Don't test trivial code
function getName() {
  return this.name
} // Skip testing
```

## Documentation Requirements

### JSDoc Standards

```typescript
/**
 * Generate alt-text for images using AI
 * @param imageBuffer - Raw image data
 * @param options - Processing options
 * @returns Promise<string> Generated alt-text
 * @throws {Error} When AI service is unavailable
 */
export async function generateAltText(imageBuffer: Buffer, options: AltTextOptions): Promise<string>
```

### Inline Comments

```typescript
// Use comments for business logic, not obvious code
const tax = subtotal * 0.1 // 10% tax rate for region

// Don't comment obvious code
const name = user.name // Gets the user name ← unnecessary
```

## Troubleshooting Checklist

### Build Failures

```bash
1. bun run lint:eslint    # Fix code style issues
2. bun run lint:types    # Fix TypeScript errors
3. bun run test          # Fix failing tests
4. Check imports/exports # Resolve module issues
```

### Runtime Errors

```bash
1. Check environment variables (API_JWT_SECRET, etc.)
2. Verify Cloudflare bindings (KV, AI, Images)
3. Check schema validation errors
4. Review auth token permissions
```

### Common Issues

```bash
"Cannot read file" → Use absolute paths
"Schema not found" → Check imports in schemas.ts
"Auth required" → Add requireAuth() call
"Invalid UUID" → Use getValidatedUUID()
"AI service unavailable" → Check env.AI binding
```

## Immediate Plans

- Implement runtime validation for API responses using Zod schemas, to ensure all responses conform to standardized structure with `createApiResponse()`.
