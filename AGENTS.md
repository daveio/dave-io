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
const auth = await requireAIAuth(event, "social") // ai:social
const auth = await requireAdminAuth(event) // admin

// Access user info from auth.payload
const userId = auth.payload?.sub
const tokenId = auth.payload?.jti
```

## Auth & Endpoints

- **Methods**: `Authorization: Bearer <jwt>` + `?token=<jwt>`
- **JWT**: `{sub, iat, exp?, jti?}` | **Permissions**: `category:resource` (parent grants child) | **Categories**: `api`, `ai`, `dashboard`, `admin`, `*`
- **Public**: `/api/ping`, `/go/{slug}`
- **Protected**: `/api/ai/social` (`ai:social`+), `/api/token/{uuid}/*` (`api:token`+)

## Breaking Changes

- **CLI**: Removed `bun try internal ping` → use `bun try ping`
- **API Responses**: Standardized structure with `{ok, result, error, status, timestamp}`, sorted object keys
- **Endpoints**: Merged `/api/internal/*` → `/api/ping`
- **API Structure**: Converted all endpoints to singular: `/tokens/` → `/token/`
- **Auth**: `--auth` auto-generates tokens, `--token <JWT>` for provided tokens
- **Dev**: No reset cycle, starts in seconds, `test:all` for full suite
- **KV**: Individual keys vs JSON blob, hierarchical colon-separated, YAML anchors
- **Redirects**: Fixed `/go/*` routes to bypass client-side routing - links now redirect properly on first click instead of requiring a page refresh
- **AI Social**: New `/api/ai/social` endpoint for splitting text into social media posts using Anthropic Claude 4 Sonnet via AI Gateway with automatic threading indicators (`🧵 x/y`). Uses strategy-based intelligent splitting with configurable strategies for optimal text processing.
- **AI Model Migration**: Migrated `/api/ai/social` from Cloudflare AI Llama model to Anthropic Claude 4 Sonnet via AI Gateway for improved text processing quality and observability.
- **AI Alt Text**: New `/api/ai/alt` endpoint for generating alt text for images using Anthropic Claude 4 Sonnet via AI Gateway. Supports both GET (with image URL) and POST (with image upload) methods. Includes image size validation and SSRF protection.
- **AI Alt Text Image Optimization**: Added automatic image optimization to `/api/ai/alt` using Cloudflare Images API. Images exceeding 5MB are automatically resized and compressed to fit within Claude's limits while maintaining quality.

## Core

- **Response**: Success `{ok: true, result, error: null, status: {message}, timestamp}` | Error `{ok: false, error, status: {message}?, timestamp}`
- **Environment**: `API_JWT_SECRET`, `ANTHROPIC_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Bindings: KV(KV), D1(D1), AI, BROWSER
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

**Prerequisites**: Node.js 22.17.0+, Bun

```bash
bun install && bun run dev  # Starts in ~3s
```

**Structure**: `server/{api,utils,middleware}`, `test/`, `bin/`, `types/`, `data/kv/`

## API Examples

```bash
curl http://localhost:3000/api/ping  # Status
curl -X POST -H "Authorization: Bearer <token>" -d '{"input": "Long text...", "networks": ["bluesky", "mastodon"]}' /api/ai/social  # Split text
```

## CLI Usage

```bash
bun jwt init && bun jwt create --sub "api:metrics" --expiry "30d"  # JWT
bun run kv export --all && bun run kv --local import backup.yaml  # KV
bun try --auth ai social "Long text to split"  # Try
bun run test:api --ai-only --url https://dave.io  # Test
```

## Deployment & Config

```bash
wrangler kv:namespace create KV && wrangler d1 create NEXT_API_AUTH_METADATA
bun jwt init && bun run deploy
```

**KV YAML**: `metrics: {ok: 0}` → `metrics:ok = "0"` | AI Social: `ai:social:characters:bluesky = "300"`
**Linting**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
**AI Social**: Character limits in KV (`ai:social:characters:{network}`). Uses strategy-based splitting with default strategies `["sentence_boundary", "paragraph_preserve"]`. Available strategies: `sentence_boundary` (split at sentences), `word_boundary` (split at words), `paragraph_preserve` (keep paragraphs intact), `thread_optimize` (optimize threading), `hashtag_preserve` (keep hashtags with content). Multi-post threads automatically get threading indicators (`🧵 1/3`, `🧵 2/3`, etc.) with 10 chars reserved per post.

## Best Practices

### KV Storage

- **Keys**: Hierarchical `metrics:api:ok`, kebab-case `auth:token-uuid`
- **Values**: Simple only, no complex objects
- **Pattern**: `await kv.put("metrics:api:ok", "42")` ✅ vs `JSON.stringify(object)` ❌

### Security (MANDATORY)

- **Input**: Always validate with `RequestSchema.parse()`, use `getValidatedUUID()`, `validateURL()`
- **Secrets**: Environment variables only, never hardcode
- **Output**: Log internally, return safe public messages via `createApiError()`
- **Responses**: Filter sensitive fields before returning

### Performance

- **Async**: Non-blocking metrics with `recordAPIMetricsAsync()`
- **Services**: Real calls only (`env.AI.run()`, `env.KV.get()`), no mocks except tests

### Code Quality

- **DRY**: Extract duplicated logic immediately to `server/utils/`
- **Errors**: Always handle explicitly, never fail silently
- **Responses**: Use `createApiResponse()` for consistent format
- **Tests**: Test business logic, skip trivial getters/UI components

### Code Standards

- **JSDoc**: All exported functions need full JSDoc with `@param`, `@returns`, `@throws`
- **Comments**: Business logic only, not obvious code
- **Linting**: Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` when needed

## Troubleshooting

- **Build**: `bun run lint:eslint` → `bun run lint:types` → `bun run test`
- **Runtime**: Check env vars (`API_JWT_SECRET`, `ANTHROPIC_API_KEY`), Cloudflare bindings (KV, AI), auth permissions
- **Common**: Use absolute paths, check schema imports, add `requireAuth()`, use `getValidatedUUID()`

## AI Social Media Text Splitting

**Endpoint**: `/api/ai/social` - Splits long text for social networks with character limits in KV (`ai:social:characters:{network}`)

**AI Model**: Uses Anthropic Claude 4 Sonnet via Cloudflare AI Gateway for intelligent text processing

**Strategy-Based Processing**: Uses configurable splitting strategies with sensible defaults

- **Default strategies**: `["sentence_boundary", "paragraph_preserve"]` (applied when no strategies specified)
- **Available strategies**: `sentence_boundary`, `word_boundary`, `paragraph_preserve`, `thread_optimize`, `hashtag_preserve`

**Features**: Auto threading (`🧵 1/3`), voice preservation, standalone posts, network optimization, AI Gateway observability

**Usage**: `bun try --auth ai social split "text" --networks "bluesky,mastodon"`

## AI Alt Text Generation

**Endpoints**:

- `GET /api/ai/alt?image=<url>` - Generate alt text from image URL
- `POST /api/ai/alt` - Generate alt text from uploaded image file

**AI Model**: Uses Anthropic Claude 4 Sonnet via Cloudflare AI Gateway for intelligent image analysis

**Features**:

- **Image URL Processing**: Fetch and analyze images from URLs with SSRF protection
- **File Upload**: Accept direct image uploads via multipart form data
- **Size Validation**: Automatic validation against Claude's 5MB limit
- **Image Optimization**: Automatic image optimization using Cloudflare Images API when images exceed 5MB
- **Format Detection**: Supports JPEG, PNG, GIF, WebP image formats
- **Security**: URL validation prevents localhost/private network access
- **AI Gateway**: Full observability and monitoring via Cloudflare AI Gateway

**Authentication**: Requires `ai:alt` permission

**Response Format**:

```json
{
  "ok": true,
  "result": {
    "alt_text": "Generated descriptive alt text for the image",
    "confidence": 0.95
  },
  "status": { "message": "Alt text generated successfully" },
  "error": null,
  "timestamp": "2025-01-07T..."
}
```

**Error Handling**:

- `400`: Invalid image format, malformed URL, or missing image data
- `413`: Image exceeds 5MB size limit
- `500`: Claude API failures or processing errors
- `503`: Missing API keys or service unavailable

**Usage Examples**:

```bash
# GET with image URL
curl "https://dave.io/api/ai/alt?image=https://example.com/image.jpg" \
  -H "Authorization: Bearer <token>"

# POST with file upload
curl -X POST "https://dave.io/api/ai/alt" \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"
```

## Immediate Plans

- Implement runtime validation for API responses using Zod schemas, to ensure all responses conform to standardized structure with `createApiResponse()`.
