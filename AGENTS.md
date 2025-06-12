# `next.dave.io`

## 🚨 CRITICAL DEVELOPMENT RULES - MANDATORY FOR EVERY REQUEST

<!-- trunk-ignore-all(markdownlint/MD036) -->

**⚠️ THESE RULES MUST BE FOLLOWED AT ALL TIMES, IN EVERY REQUEST ⚠️**

**1. Breaking Changes**: NO backwards compatibility. Document in AGENTS.md. ❌ No migration code.

**2. Quality > Speed**: Unlimited time/calls for correct implementations. Refactor ruthlessly. ❌ No "good enough".

**3. Mandatory Testing**: EVERYTHING with logic/side effects needs tests. Commands: `bun run test`, `bun run test:ui`, `bun run test:api`. ❌ Skip trivial getters, frontend components, config.

**4. Documentation Sync**: AGENTS.md = source of truth. Update after API/feature/auth changes.

**5. Quality Verification**: `bun run build` → `bun run lint:biome`, `bun run lint:trunk`, `bun run lint:types`, `bun run test` → `bun run check`. ❌ Never commit broken code.

**6. Commit Hygiene**: `git add -A . && oco --fgm --yes` or `git add -A . && git commit -am "[emoji] [description]"`. Commit after features/bugs/refactoring.

**7. Zero Mock Data**: Only real service calls (`env.AI.run()`, `env.DATA.get/put()`). Crash loudly on failure. ❌ No `Math.random()`, hardcoded values, fake delays. Exception: test files.

**8. No Incomplete Code**: Mark with `// TODO: [description]`. Prefer explicit errors over silent failures.

**9. TODO Management**: Use 6-hex IDs per logical issue. Update TODO.md. Examples:

```typescript
// TODO: (37c7b2) Skip Bun mocking - test separately
```

```markdown
- **TODO:** _37c7b2_ `test/file.ts:18` Description
```

**10. KV Data**: Simple values only. Hierarchical keys: `metrics:api:ok`. Kebab-case: `auth:token-uuid`. Update `data/kv/_init.yaml`.

**11. Shared Code**: Extract duplicated logic to `server/utils/` immediately. Add JSDoc, tests, types. ❌ No copy-pasting.

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
