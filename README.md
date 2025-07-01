# dave.io

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/daveio/dave-io)

<!-- trunk-ignore-all(trunk-toolbox/todo) -->

> A modern Nuxt 3 + Cloudflare Workers API platform with JWT authentication, AI integration, and automated OpenAPI documentation.

## 🛑 MANDATORY RULES - CHECK BEFORE EVERY ACTION

### PRE-TASK CHECKLIST (Mental Review Required)

□ Am I following ALL 11 rules below?
□ Have I checked `AGENTS.md` for latest specs?
□ Will my code be production-ready?

### THE 11 COMMANDMENTS

**1. BREAK**: Ship breaking changes freely. Document in `AGENTS.md`. Never add migration code. THIS DOES NOT APPLY TO DATABASE MIGRATIONS.

**2. PERFECT**: Take unlimited time/calls for correctness. Refactor aggressively. No "good enough".

**3. TEST**: Test everything with logic/side effects. Commands: `bun run test`, `bun run test:ui`, `bun run test:api`. Skip only: trivial getters, UI components, config.

**4. SYNC**: `AGENTS.md` = truth. Update after API/feature/auth changes. `CLAUDE.md` & `README.md` = symlinks to `AGENTS.md`.

**5. VERIFY**: `bun run build` → `bun run lint:biome`, `bun run lint:trunk`, `bun run lint:types`, `bun run test` → `bun run check`. Never continue with errors.

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

## Auth & Endpoints

- **Methods**: `Authorization: Bearer <jwt>` + `?token=<jwt>`
- **JWT**: `{sub, iat, exp?, jti?}` | **Permissions**: `category:resource` (parent grants child) | **Categories**: `api`, `ai`, `dashboard`, `admin`, `*`
- **Public**: `/api/ping`, `/api/images/optimise`, `/go/{slug}`, `/api/ai/tickets/*`
- **Protected**: `/api/ai/alt` (`ai:alt`+), `/api/tokens/{uuid}/*` (`api:tokens`+)

## Breaking Changes

- **CLI**: Removed `bun try internal ping` → use `bun try ping`
- **API Responses**: Standardized structure with `{ok, result, error, status, timestamp}`, sorted object keys
- **Endpoints**: Merged `/api/internal/*` → `/api/ping`
- **Auth**: `--auth` auto-generates tokens, `--token <JWT>` for provided tokens
- **Dev**: No reset cycle, starts in seconds, `test:all` for full suite
- **AI Alt**: Raw base64 POST or multipart form upload, 4MB limit with auto-optimization
- **Images**: Cloudflare Images service, BLAKE3 IDs, global CDN
- **KV**: Individual keys vs JSON blob, hierarchical colon-separated, YAML anchors

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

---

## Creating a New API Endpoint

### 1. File Naming Convention

API endpoints follow strict naming conventions for automatic discovery:

```bash
# Standard patterns
server/api/example.get.ts     # GET /api/example
server/api/example.post.ts    # POST /api/example
server/api/users/[uuid].get.ts # GET /api/users/{uuid}

# Multi-method endpoints
server/api/images/optimise.ts  # Handles both GET and POST
```

### 2. Basic Endpoint Structure

```typescript
// server/api/example.get.ts
import { createApiResponse, logRequest } from "~/server/utils/response"
import { recordAPIMetrics } from "~/server/middleware/metrics"
import { ExampleResponseSchema } from "~/server/utils/schemas"

export default defineEventHandler(async (event) => {
  try {
    // Your endpoint logic here
    const result = { message: "Hello, World!" }

    // Record metrics (always call this on success)
    recordAPIMetrics(event, 200)

    // Log request (optional but recommended)
    logRequest(event, "example", "GET", 200, {
      customField: "value"
    })

    return createApiResponse({
      result,
      message: "Example endpoint successful",
      error: null
    })
  } catch (error) {
    // Error handling is automatic via createApiResponse
    console.error("Example endpoint error:", error)
    throw error
  }
})
```

### 3. Schema Integration & OpenAPI

#### Step 1: Define Zod Schemas

Add your schemas to `server/utils/schemas.ts`:

```typescript
// Request schema (for POST/PUT endpoints)
export const ExampleRequestSchema = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().min(0).max(150).optional()
  })
  .openapi({
    title: "Example Request",
    description: "Schema for creating examples"
  })

// Response schema
export const ExampleResponseSchema = z
  .object({
    ok: z.literal(true),
    result: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
      createdAt: z.string()
    }),
    message: z.string(),
    error: z.null(),
    timestamp: z.string()
  })
  .openapi({
    title: "Example Response",
    description: "Successful example creation response"
  })

// Export types
export type ExampleRequest = z.infer<typeof ExampleRequestSchema>
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>
```

#### Step 2: Use Schemas in Endpoint

```typescript
// server/api/examples.post.ts
import { readBody } from "h3"
import { ExampleRequestSchema, ExampleResponseSchema } from "~/server/utils/schemas"

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = ExampleRequestSchema.parse(body)

    // Your business logic
    const result = {
      id: crypto.randomUUID(),
      name: validatedData.name,
      email: validatedData.email,
      createdAt: new Date().toISOString()
    }

    recordAPIMetrics(event, 201)

    return createApiResponse({
      result,
      message: "Example created successfully",
      error: null
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createApiError(400, "Validation failed", error.errors)
    }
    throw error
  }
})
```

#### Step 3: OpenAPI Auto-Generation

The endpoint scanner automatically detects:

- **Method** from filename (`.get.ts`, `.post.ts`)
- **Path** from directory structure
- **Parameters** from `{param}` in path
- **Request Schema** from `Schema.parse()` usage
- **Response Schema** from imported schema types
- **Authentication** from `requireAuth()` calls

Run `bun run generate:openapi` to update `public/openapi.json`.

### 4. Dynamic Routes & Parameters

```typescript
// server/api/users/[uuid].get.ts
import { getValidatedUUID } from "~/server/utils/validation"

export default defineEventHandler(async (event) => {
  // Automatically validates UUID format and throws 400 if invalid
  const uuid = getValidatedUUID(event, "uuid")

  // Your logic here
  const user = await getUserById(uuid)

  return createApiResponse({
    result: user,
    message: "User retrieved successfully"
  })
})
```

### 5. Query Parameters

```typescript
// server/api/users.get.ts - with query parameters
import { z } from "zod"

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, limit, search } = QuerySchema.parse(query)

  // Your pagination logic
  const users = await getUsers({ page, limit, search })

  return createApiResponse({
    result: users,
    meta: {
      page,
      per_page: limit,
      total: users.total,
      total_pages: Math.ceil(users.total / limit)
    }
  })
})
```

## Authentication Integration

### 1. Hierarchical Permission System

The JWT system uses hierarchical permissions where parent permissions grant access to child resources:

```typescript
// Permission hierarchy examples:
"*"           // Grants everything (admin)
"api"         // Grants api:metrics, api:tokens, etc.
"ai"          // Grants ai:alt, ai:tickets, etc.
"api:tokens"  // Grants api:tokens:usage, api:tokens:revoke, etc.
"ai:alt"      // Grants only ai:alt endpoint

// JWT payload structure:
{
  sub: "api:tokens",        // Main permission
  iat: 1234567890,         // Issued at
  exp: 1234567890,         // Optional expiry
  jti: "uuid-v4",          // Optional revocation ID
  permissions?: ["ai:alt", "api:metrics"] // Optional additional permissions
}
```

### 2. Adding Authentication to Endpoints

**Simple Authorization:**

```typescript
// server/api/secure.get.ts
import { requireAPIAuth } from "~/server/utils/auth-helpers"

export default defineEventHandler(async (event) => {
  // Requires "api" permission (or higher)
  const auth = await requireAPIAuth(event)

  // Access user info
  const userId = auth.payload?.sub
  const tokenId = auth.payload?.jti

  return createApiResponse({
    result: { message: "Secure data", userId }
  })
})
```

**Specific Resource Authorization:**

```typescript
// server/api/admin/users.get.ts
import { requireAuth } from "~/server/utils/auth-helpers"

export default defineEventHandler(async (event) => {
  // Requires "admin:users" permission
  const auth = await requireAuth(event, "admin", "users")

  return createApiResponse({
    result: await getAdminUserList()
  })
})
```

**Convenience Helpers:**

```typescript
// Available auth helpers:
requireAPIAuth(event, resource?)     // "api" or "api:resource"
requireAIAuth(event, resource?)      // "ai" or "ai:resource"
requireDashboardAuth(event, resource?) // "dashboard" or "dashboard:resource"
requireAdminAuth(event)              // "admin"
```

### 3. Custom Authorization Logic

```typescript
import { extractToken, verifyJWT } from "~/server/utils/auth"

export default defineEventHandler(async (event) => {
  const token = extractToken(event)
  if (!token) {
    throw createApiError(401, "Token required")
  }

  const secret = process.env.API_JWT_SECRET
  const verification = await verifyJWT(token, secret)

  if (!verification.success) {
    throw createApiError(401, verification.error)
  }

  // Custom permission logic
  const hasSpecialAccess = verification.payload?.sub === "special:user"
  if (!hasSpecialAccess) {
    throw createApiError(403, "Special access required")
  }

  return createApiResponse({ result: "Special data" })
})
```

## Testing Patterns

### 1. Unit Tests Structure

```typescript
// test/my-feature.test.ts
import { describe, expect, it, beforeEach } from "vitest"
import { createApiResponse, createApiError } from "~/server/utils/response"

describe("My Feature", () => {
  beforeEach(() => {
    // Reset state before each test
  })

  it("should handle valid input", () => {
    const result = createApiResponse({
      result: { test: "data" },
      message: "Success"
    })

    expect(result.ok).toBe(true)
    expect(result.result).toEqual({ test: "data" })
    expect(result.timestamp).toBeDefined()
  })

  it("should throw error for invalid input", () => {
    expect(() => {
      createApiError(400, "Bad request")
    }).toThrow()
  })
})
```

### 2. Authentication Testing

```typescript
// test/auth-feature.test.ts
import { SignJWT } from "jose"
import { verifyJWT, hasPermission } from "~/server/utils/auth"

describe("Authentication", () => {
  const testSecret = "test-secret-key"

  it("should verify valid JWT", async () => {
    const encoder = new TextEncoder()
    const secretKey = encoder.encode(testSecret)

    const token = await new SignJWT({
      sub: "api:tokens",
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secretKey)

    const result = await verifyJWT(token, testSecret)

    expect(result.success).toBe(true)
    expect(result.payload?.sub).toBe("api:tokens")
  })

  it("should check hierarchical permissions", () => {
    expect(hasPermission(["api"], "api:tokens")).toBe(true)
    expect(hasPermission(["api:tokens"], "api")).toBe(false)
    expect(hasPermission(["*"], "anything")).toBe(true)
  })
})
```

### 3. HTTP API Testing

Use the built-in API testing tool:

```bash
# Test all endpoints
bun run test:api

# Test specific service
bun run test:api --ai-only

# Test against remote URL
bun run test:api --url https://staging.example.com

# Test with authentication
bun run test:api --auth

# Test with specific token
bun run test:api --token "eyJ..."
```

### 4. Mocking Cloudflare Services

```typescript
// test/cloudflare-feature.test.ts
import { vi } from "vitest"

describe("Cloudflare Integration", () => {
  it("should handle AI service", async () => {
    const mockAI = {
      run: vi.fn().mockResolvedValue({
        description: "Test alt text"
      })
    }

    const mockEnv = { AI: mockAI }

    // Test your function with mocked AI
    const result = await generateAltText(mockEnv, imageBuffer)

    expect(mockAI.run).toHaveBeenCalledWith(
      "@cf/llava-hf/llava-1.5-7b-hf",
      expect.objectContaining({
        image: expect.any(Array),
        prompt: expect.stringContaining("Describe this image")
      })
    )

    expect(result).toBe("Test alt text")
  })
})
```

## Development Patterns & Best Practices

### 1. Error Handling

**Consistent Error Responses:**

```typescript
// Good: Use createApiError for consistent format
throw createApiError(400, "Validation failed", validationDetails)

// Bad: Manual error throwing
throw new Error("Something went wrong")
```

**Error Logging:**

```typescript
export default defineEventHandler(async (event) => {
  try {
    // Your logic
  } catch (error) {
    console.error("Endpoint error:", error)

    // Record metrics for error tracking
    recordAPIErrorMetrics(event, error)

    // Re-throw to let global handler format response
    throw error
  }
})
```

### 2. Response Standardization

**Always use `createApiResponse()`:**

```typescript
// Good: Standardized response
return createApiResponse({
  result: data,
  message: "Operation successful",
  error: null
})

// Bad: Manual response object
return {
  success: true,
  data: data
}
```

**Include Metadata for Pagination:**

```typescript
return createApiResponse({
  result: items,
  meta: {
    total: 150,
    page: 2,
    per_page: 20,
    total_pages: 8
  }
})
```

### 3. Validation Patterns

**Always validate at API boundaries:**

```typescript
// Request validation
const validatedInput = RequestSchema.parse(await readBody(event))

// Parameter validation
const uuid = getValidatedUUID(event, "uuid")

// Query validation
const query = QuerySchema.parse(getQuery(event))
```

### 4. Metrics & Logging

**Standard Metrics Recording:**

```typescript
// Success path
recordAPIMetrics(event, 200)

// Error path (in catch blocks)
recordAPIErrorMetrics(event, error)
```

**Structured Logging:**

```typescript
logRequest(event, "endpoint-name", "POST", 201, {
  userId: auth.payload?.sub,
  itemCount: results.length,
  processingTime: Date.now() - startTime
})
```

### 5. Environment & Configuration

**Accessing Cloudflare Bindings:**

```typescript
import { getCloudflareEnv } from "~/server/utils/cloudflare"

const env = getCloudflareEnv(event)
if (!env?.AI) {
  throw createApiError(503, "AI service not available")
}

// Use bindings
const aiResult = await env.AI.run(model, prompt)
const kvValue = await env.KV.get("key")
await env.KV.put("key", "value")
```

## Pitfalls to Avoid

### 1. Security Anti-Patterns

❌ **Never commit secrets:**

```typescript
// Bad
const secret = "hardcoded-jwt-secret"

// Good
const secret = process.env.API_JWT_SECRET
```

❌ **Never expose sensitive data:**

```typescript
// Bad
return createApiResponse({
  result: { ...user, passwordHash, apiKey }
})

// Good
return createApiResponse({
  result: { id: user.id, name: user.name, email: user.email }
})
```

### 2. Validation Bypassing

❌ **Don't skip validation for "trusted" inputs:**

```typescript
// Bad
const uuid = getRouterParam(event, "uuid") // No validation

// Good
const uuid = getValidatedUUID(event, "uuid")
```

### 3. Error Information Leakage

❌ **Don't expose internal errors in production:**

```typescript
// Bad
catch (error) {
  throw createApiError(500, error.stack)
}

// Good
catch (error) {
  console.error("Internal error:", error)
  throw createApiError(500, "Internal server error")
}
```

### 4. Performance Issues

❌ **Don't make blocking KV operations:**

```typescript
// Bad - blocks response
await updateMetrics(...)
return response

// Good - fire and forget
updateMetricsAsync(...)
return response
```

❌ **Don't forget to implement caching:**

```typescript
// Consider caching for expensive operations
const cacheKey = `user:${uuid}`
let user = await kv.get(cacheKey)
if (!user) {
  user = await fetchUserFromDatabase(uuid)
  await kv.put(cacheKey, user, { expirationTtl: 300 })
}
```

### 5. OpenAPI Documentation Issues

❌ **Missing schema definitions:**

```typescript
// Bad - no schema, poor OpenAPI docs
return { data: someObject }

// Good - schema-validated response
const result = ResponseSchema.parse(someObject)
return createApiResponse({ result })
```

## Code Quality & Improvement Opportunities

### 1. Current Issues & Technical Debt

**Schema Consistency Gaps:**

- Some endpoints use manual validation instead of Zod schemas
- Response schemas could be more granular for better OpenAPI docs
- Query parameter schemas need standardization

**Code Duplication Opportunities:**

- Image validation logic appears in multiple files
- Error response formatting has minor inconsistencies
- Auth helper patterns could be further consolidated

**Testing Coverage Gaps:**

- Some utility functions lack comprehensive test coverage
- Edge cases in error handling need more tests
- Integration tests for Cloudflare service mocking

### 2. Standardization Improvements

**Extract Common Patterns:**

```typescript
// Opportunity: Create reusable image upload handler
export async function handleImageUpload(event: H3Event, options: ImageUploadOptions) {
  // Consolidate parseImageUpload, validation, and optimization
}

// Opportunity: Standardize paginated responses
export function createPaginatedResponse<T>(items: T[], pagination: PaginationOptions) {
  // Standard pagination metadata
}

// Opportunity: Common async operation wrapper
export async function withMetrics<T>(event: H3Event, operation: () => Promise<T>): Promise<T> {
  // Automatic metrics recording and error handling
}
```

**Error Metadata Standardization:**

```typescript
// Current: Inconsistent error details
throw createApiError(400, "Validation failed", details)

// Improved: Structured error metadata
throw createApiError(400, "Validation failed", {
  code: "VALIDATION_ERROR",
  field: "email",
  details: validationErrors
})
```

### 3. Performance Optimizations

**KV Storage Patterns:**

```typescript
// Current: Individual get/set operations
await kv.get("metrics:api:ok")
await kv.get("metrics:api:error")

// Opportunity: Batch operations where possible
const keys = ["metrics:api:ok", "metrics:api:error"]
const values = await kv.getMultiple(keys)
```

**Response Caching:**

```typescript
// Opportunity: Add caching layer for expensive operations
export async function withCache<T>(key: string, operation: () => Promise<T>, ttl = 300): Promise<T> {
  // Check cache, execute if miss, store result
}
```

### 4. Developer Experience Improvements

**Enhanced CLI Tools:**

- Add `bun dev:docs` for local OpenAPI UI
- Create `bun test:watch:api` for continuous API testing
- Add `bun lint:fix` for automatic code formatting

**Better Error Messages:**

```typescript
// Current: Generic validation errors
"Validation failed"

// Improved: Specific, actionable errors
"Image file is too large (5.2MB). Maximum allowed size is 4MB. Consider compressing the image before upload."
```

**Documentation Generation:**

- Auto-generate endpoint documentation from JSDoc comments
- Create interactive examples for each endpoint
- Add request/response samples to OpenAPI spec

### 5. Future Architecture Considerations

**Type Safety Improvements:**

```typescript
// Opportunity: End-to-end type safety
type ApiEndpoints = {
  "GET /api/users/{uuid}": {
    params: { uuid: string }
    response: UserResponse
  }
  "POST /api/users": {
    body: CreateUserRequest
    response: UserResponse
  }
}
```

**Configuration Management:**

```typescript
// Opportunity: Centralized config validation
const ConfigSchema = z.object({
  API_JWT_SECRET: z.string().min(32),
  CLOUDFLARE_API_TOKEN: z.string(),
  NODE_ENV: z.enum(["development", "production"])
})

export const config = ConfigSchema.parse(process.env)
```

## API Examples

```bash
curl http://localhost:3000/api/ping  # Status
curl -H "Authorization: Bearer <token>" "/api/ai/alt?url=https://example.com/image.jpg"  # Alt-text via URL
curl -X POST -F "image=@path/to/image.jpg" -H "Authorization: Bearer <token>" http://localhost:3000/api/ai/alt  # Alt-text via form
curl -X POST -d '{"description": "Fix bug"}' /api/ai/tickets/title  # AI title (public)
curl -X POST -d '{"image": "<base64>", "quality": 80}' /api/images/optimise  # Optimize via JSON
curl -F "image=@path/to/image.jpg" -F "quality=80" http://localhost:3000/api/images/optimise  # Optimize via form
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

**KV YAML**: `metrics: {ok: 0}` → `metrics:ok = "0"`
**Linting**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any
**Images**: Cloudflare service, BLAKE3 IDs, 4MB limit, global CDN

## Immediate Plans

### Runtime Validation

Implement runtime validation for API responses using Zod schemas, to ensure all responses conform to standardized structure with `createApiResponse()`.

### Cloudflare Zero Trust

Replace the current custom JWT authentication system with Cloudflare Zero Trust for enhanced security, reduced maintenance, and better audit capabilities while maintaining stateless operation.

#### Frontend Authentication Strategy

The frontend follows a hybrid authentication model designed for optimal user experience:

**Public Access by Default:**

- Landing pages, documentation, and marketing content accessible without authentication
- Progressive enhancement for authenticated features
- Graceful degradation when users aren't logged in

**Interactive Authentication:**

- Cookie-based authentication (`CF_Authorization`) for browser sessions
- Seamless login flow through Cloudflare Access
- Persistent sessions with configurable timeout
- Automatic token refresh for long-running sessions

**Protected Routes:**

- Admin dashboard requires `dashboard:admin` group membership
- API management pages require `api:management` group membership
- AI features require `ai:users` group membership
- User settings and profile management for authenticated users

**Multiple Identity Provider Support:**

Cloudflare Zero Trust supports numerous identity providers for maximum flexibility:

- **Enterprise SSO**: Azure AD, Okta, Ping Identity, Auth0, OneLogin
- **Developer-Friendly**: GitHub, GitLab, Bitbucket
- **Consumer**: Google, Microsoft, LinkedIn, Facebook
- **Standards-Based**: Generic OIDC, SAML 2.0
- **Security-First**: Certificate-based authentication, hardware tokens
- **Fallback**: One-time PIN via email

#### API Authentication

APIs maintain single-token access patterns while leveraging Zero Trust infrastructure:

**Service Tokens for Programmatic Access:**

<!-- trunk-ignore-begin(gitleaks/curl-auth-header) -->

```bash
# API-to-API authentication with service tokens
curl -H "CF-Access-Client-Id: your-client-id" \
     -H "CF-Access-Client-Secret: your-client-secret" \
     https://dave.io/api/ping

# JWT-style tokens for user API access
curl -H "Authorization: Bearer jwt-token" \
     https://dave.io/api/ai/alt

# Direct JWT assertion header (preferred)
curl -H "cf-access-jwt-assertion: jwt-token" \
     https://dave.io/api/ai/alt
```

<!-- trunk-ignore-end(gitleaks/curl-auth-header) -->

**No Subdomain Requirement:**
APIs remain available at `dave.io/api/*` without requiring separate subdomains, maintaining backward compatibility and simplifying deployment.

#### Complete Zero Trust Implementation

Replace the entire custom JWT system with Cloudflare Access authentication:

**Current Implementation Replacement:**

```typescript
// server/utils/zero-trust-auth.ts - New implementation
import { jwtVerify, createRemoteJWKSet } from "jose"

const TEAM_DOMAIN = process.env.CLOUDFLARE_TEAM_DOMAIN // "your-team.cloudflareaccess.com"
const CLOUDFLARE_JWKS = createRemoteJWKSet(new URL(`https://${TEAM_DOMAIN}/cdn-cgi/access/certs`))

export async function verifyAccessToken(token: string, audience: string): Promise<AccessAuthResult> {
  const { payload } = await jwtVerify(token, CLOUDFLARE_JWKS, {
    issuer: `https://${TEAM_DOMAIN}`,
    audience,
    algorithms: ["RS256"]
  })

  return {
    success: true,
    email: payload.email as string,
    sub: payload.sub as string,
    groups: (payload.groups as string[]) || [],
    iat: payload.iat as number,
    exp: payload.exp as number
  }
}

// Service token authentication for API-to-API communication
export function extractServiceToken(event: H3Event): { clientId: string; clientSecret: string } | null {
  const clientId = getHeader(event, "cf-access-client-id")
  const clientSecret = getHeader(event, "cf-access-client-secret")

  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

// Unified authentication supporting both cookies and headers
export async function requireAccessAuth(
  event: H3Event,
  audience: string,
  requiredGroup?: string
): Promise<AccessAuthResult> {
  // Try JWT assertion header first (API calls)
  let token = getHeader(event, "cf-access-jwt-assertion")

  // Fall back to Authorization header
  if (!token) {
    const authHeader = getHeader(event, "authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
  }

  // Fall back to cookie (browser sessions)
  if (!token) {
    const cookies = parseCookies(event)
    token = cookies.CF_Authorization
  }

  if (!token) {
    throw createApiError(401, "Access token required")
  }

  const auth = await verifyAccessToken(token, audience)

  if (requiredGroup && !auth.groups.includes(requiredGroup)) {
    throw createApiError(403, `Group ${requiredGroup} required`)
  }

  return auth
}

// Convenience helpers for different application types
export async function requireAPIAuth(event: H3Event, resource?: string) {
  const audience = process.env.CLOUDFLARE_API_AUDIENCE
  const group = resource ? `api:${resource}` : "api"
  return requireAccessAuth(event, audience, group)
}

export async function requireAIAuth(event: H3Event, resource?: string) {
  const audience = process.env.CLOUDFLARE_AI_AUDIENCE
  const group = resource ? `ai:${resource}` : "ai"
  return requireAccessAuth(event, audience, group)
}

export async function requireDashboardAuth(event: H3Event, resource?: string) {
  const audience = process.env.CLOUDFLARE_DASHBOARD_AUDIENCE
  const group = resource ? `dashboard:${resource}` : "dashboard"
  return requireAccessAuth(event, audience, group)
}
```

**Zero Trust Application Configuration:**

```yaml
# Cloudflare Zero Trust Setup
applications:
  - name: "dave.io Frontend"
    domain: "dave.io"
    type: "self_hosted"
    session_duration: "24h"
    policies:
      - name: "Public Access"
        decision: "bypass"
        include: [{ everyone: true }]
        # Apply to public routes only

      - name: "Dashboard Access"
        decision: "allow"
        include: [{ groups: ["dashboard-users", "admins"] }]
        # Apply to /dashboard/* routes

  - name: "dave.io API"
    domain: "dave.io"
    path: "/api/*"
    type: "self_hosted"
    policies:
      - name: "API Access"
        decision: "allow"
        include: [{ groups: ["api-users", "developers", "admins"] }]

      - name: "AI Service Access"
        decision: "allow"
        include: [{ groups: ["ai-users", "developers", "admins"] }]
        # Apply to /api/ai/* routes

service_tokens:
  - name: "Internal API Token"
    duration: "1y"
    # Use for server-to-server communication

  - name: "CI/CD Pipeline Token"
    duration: "90d"
    # Use for automated deployments and testing

groups:
  - name: "developers"
    include: [{ email_domain: "dave.io" }]

  - name: "api-users"
    include: [{ groups: ["developers"] }, { email: ["external-partner@company.com"] }]

  - name: "ai-users"
    include: [{ groups: ["api-users"] }]

  - name: "dashboard-users"
    include: [{ groups: ["developers"] }]

  - name: "admins"
    include: [{ email: ["dave@dave.io"] }]
```

**Breaking Changes Required:**

- Remove `server/utils/auth.ts` completely
- Replace `server/utils/auth-helpers.ts` with Zero Trust equivalents
- Update all protected endpoints to use `requireAccessAuth()` functions
- Remove JWT generation CLI commands (`bun jwt init`, `bun jwt create`, etc.)
- Replace permission strings (`api:tokens`) with Zero Trust groups (`api-users`)
- Update environment variables:
  - Remove: `API_JWT_SECRET`
  - Add: `CLOUDFLARE_TEAM_DOMAIN`, `CLOUDFLARE_API_AUDIENCE`, `CLOUDFLARE_AI_AUDIENCE`, `CLOUDFLARE_DASHBOARD_AUDIENCE`

#### Migration Benefits

**Security Enhancements:**

- Cloudflare-managed key rotation (automatic every 6 weeks)
- Enhanced audit logging via Zero Trust dashboard
- Device posture integration and conditional access
- Advanced threat detection and real-time monitoring
- Geographic restrictions and session management

**Operational Benefits:**

- Reduced maintenance (no custom JWT secret management)
- Centralized user management across all applications
- Built-in SSO integration with major identity providers
- Automatic token revocation and session invalidation

**Developer Experience:**

- Simplified authentication logic in application code
- Better error messages and debugging via Access dashboard
- Built-in rate limiting and DDoS protection
- Consistent authentication across frontend and API

**Migration Path:**

1. **Setup Phase**: Configure Zero Trust applications and policies
2. **Implementation Phase**: Replace authentication utilities
3. **Testing Phase**: Verify all endpoints with new auth methods
4. **Deployment Phase**: Switch to Zero Trust authentication

This migration eliminates custom JWT management complexity while maintaining stateless authentication and adding enterprise-grade security features with minimal code changes.
