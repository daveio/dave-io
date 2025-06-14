# `next.dave.io`

## 🛑 MANDATORY RULES - CHECK BEFORE EVERY ACTION

### PRE-TASK CHECKLIST (Mental Review Required)

□ Am I following ALL 11 rules below?
□ Have I checked `AGENTS.md` for latest specs?
□ Will my code be production-ready?

### THE 11 COMMANDMENTS

**1. BREAK**: Ship breaking changes freely. Document in `AGENTS.md`. Never add migration code.

**2. PERFECT**: Take unlimited time/calls for correctness. Refactor aggressively. No "good enough".

**3. TEST**: Test everything with logic/side effects. Commands: `bun run test`, `bun run test:ui`, `bun run test:api`. Skip only: trivial getters, UI components, config.

**4. SYNC**: `AGENTS.md` = truth. Update after API/feature/auth changes. `CLAUDE.md` & `README.md` = symlinks to `AGENTS.md`.

**5. VERIFY**: `bun run build` → `bun run lint:biome`, `bun run lint:trunk`, `bun run lint:types`, `bun run test` → `bun run check`. Never continue with errors.

**6. COMMIT**: `git add -A . && oco --fgm --yes` after each feature/fix/refactor.

**7. REAL**: Use actual service calls only (`env.AI.run()`, `env.DATA.get/put()`). Crash on failure. No mocks/randoms/delays (except tests).

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
**NEVER**: Migration code • Mock data • Silent failures • Copy-paste • Outdated docs • Complex KV values

---

## Tool Usage Strategy

### Read Before Edit (MANDATORY)

```bash
# ALWAYS read files before editing
Read file.ts → understand context → Edit/MultiEdit
```

**Never edit without reading first** - the Edit tool will error if you haven't read the file.

### Tool Selection Matrix

| Task Type                     | Tool Choice | Reasoning                         |
| ----------------------------- | ----------- | --------------------------------- |
| **Find files by name**        | `Glob`      | Fast pattern matching             |
| **Find code patterns**        | `Grep`      | Content-based search              |
| **Complex/multi-step search** | `Task`      | When uncertain about search scope |
| **Single file change**        | `Edit`      | Simple find/replace               |
| **Multiple changes in file**  | `MultiEdit` | Atomic operations                 |
| **New file creation**         | `Write`     | Clean slate                       |
| **Command execution**         | `Bash`      | System operations                 |

### Batching for Performance

```bash
# Good: Batch independent operations
Read + Read + Read (parallel)
Bash + Bash + Bash (parallel)

# Bad: Sequential when unnecessary
Read → Read → Read (sequential)
```

## Development Workflow

### 1. Task Planning (Use TodoWrite PROACTIVELY)

```markdown
# For any non-trivial task:

TodoWrite → plan subtasks → mark in_progress → complete as you go
```

**Always use TodoWrite for:**

- Multi-step features
- Bug fixes with multiple files
- Refactoring tasks
- When user provides multiple requirements

### 2. File Operations Pattern

```bash
1. Glob/Grep → find relevant files
2. Read → understand current state
3. TodoWrite → plan changes
4. Edit/MultiEdit/Write → implement
5. Bash → test/lint/verify
6. TodoWrite → mark completed
```

### 3. Schema-First Development

```bash
1. Read schemas.ts → understand patterns
2. Add new schemas → with .openapi() metadata
3. Edit endpoint → use schema.parse()
4. Bash → run generate:openapi
5. Verify public/openapi.json updated
```

## Error Handling & Validation

### Tool Error Recovery

```typescript
// If Read fails - file might not exist
try { Read } catch { assume new file, use Write }

// If Edit fails - check Read was called first
Read → Edit (required sequence)

// If Bash fails - check command syntax
Bash "bun run test" not Bash "test"
```

### Validation Flow

```bash
1. Schema validation FIRST (zod.parse())
2. Business logic validation
3. createApiResponse() for output
4. Never return raw objects
```

## Testing Integration

### Test Command Patterns

```bash
# Run tests during development
Bash "bun run test"           # Unit tests
Bash "bun run test:api"       # HTTP API tests
Bash "bun run test:ui"        # UI tests
Bash "bun run test:all"       # Full suite

# Always run after changes
Bash "bun run check"          # Full validation
```

### Test File Patterns

```bash
# Test file naming
feature.test.ts               # Unit tests
api-feature.test.ts          # API integration tests

# Test structure - follow existing patterns in test/
describe → it → expect
Mock external services (AI, KV, etc.)
Real data validation with Zod
```

## Git & Commit Workflow

### Commit Pattern (MANDATORY)

```bash
# After completing any feature/fix
Bash "git add -A . && oco --fgm --yes"

# Never commit without verification
Bash "bun run check" → MUST pass before commit
```

### Branch Management

```bash
# Work on main branch (as per project rules)
# Breaking changes are allowed and encouraged
```

## Response Standards for CLI

### Concise Communication

```bash
# Good: Direct answers
"4"
"src/auth.ts:42"
"npm install missing"

# Bad: Verbose explanations
"The answer to your question is 4 because..."
```

### Code References

```bash
# Always include file:line references
"Error in server/api/auth.ts:156"
"Check schemas.ts:245 for pattern"
```

### Progress Communication

```bash
# Use TodoWrite to show progress
# Keep text responses minimal unless asked for detail
```

## File Structure Awareness

### Endpoint Patterns

```bash
server/api/example.get.ts     # GET /api/example
server/api/example.post.ts    # POST /api/example
server/api/users/[uuid].get.ts # GET /api/users/{uuid}
server/routes/go/[slug].get.ts # GET /go/{slug}
```

### Utility Organization

```bash
server/utils/                 # Shared logic
├── auth.ts                   # Authentication
├── response.ts               # API responses
├── schemas.ts                # Zod schemas
├── validation.ts             # Input validation
└── *-helpers.ts              # Specific helpers
```

### Test Organization

```bash
test/                         # Test files
├── *.test.ts                 # Unit tests
└── api-*.test.ts             # API integration tests
```

## Common Anti-Patterns to Avoid

### ❌ Never Do This

```typescript
// Don't edit without reading
Edit file.ts → ERROR

// Don't create files unless necessary
Write new-file.ts → prefer editing existing

// Don't use manual responses
return { success: true } → use createApiResponse()

// Don't skip validation
body.email → EmailSchema.parse(body).email

// Don't ignore test failures
test fails → fix before continuing
```

### ✅ Always Do This

```typescript
// Read then edit
Read file.ts → Edit file.ts

// Use existing patterns
Read similar-endpoint.ts → follow patterns

// Validate everything
RequestSchema.parse(input)

// Use helpers
requireAuth(event, "api", "tokens")

// Test changes
Bash "bun run check"
```

## Troubleshooting Guide

### Tool Failures

```bash
Read fails → file doesn't exist → use Write
Edit fails → didn't Read first → Read then Edit
Bash fails → check command syntax → use quotes
Grep no results → try different pattern → use Task
```

### Build/Test Failures

```bash
lint:biome fails → fix code style
lint:types fails → fix TypeScript errors
test fails → fix failing tests
build fails → check imports/syntax
```

### Common Issues

```bash
"Cannot read file" → use absolute paths
"Schema not found" → check imports in schemas.ts
"Auth required" → add requireAuth() call
"Invalid UUID" → use getValidatedUUID()
```

---

> The following inherits from `AGENTS.md`.

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
- **Environment**: `API_JWT_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Bindings: KV(DATA), D1(DB), AI, Images
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
wrangler kv:namespace create DATA && wrangler d1 create NEXT_API_AUTH_METADATA
bun jwt init && bun run deploy
```

**KV YAML**: `metrics: {ok: 0}` → `metrics:ok = "0"`
**Linting**: `// biome-ignore lint/suspicious/noExplicitAny: [reason]`
**Images**: Cloudflare service, BLAKE3 IDs, 4MB limit, global CDN

## Immediate Plans

- Implement runtime validation for API responses using Zod schemas, to ensure all responses conform to standardized structure with `createApiResponse()`.
