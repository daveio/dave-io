# `dave.io`: Nuxt Edition 🌟

Welcome to the most spectacularly over-engineered personal website you'll encounter today.

This isn't just a website; it's a full-blown API fortress masquerading as a humble Nuxt application.

I decided my personal site needed JWT authentication, hierarchical permissions, schema validation, backup systems, and enough security features to make the **[Fortress of Solitude](https://dc.fandom.com/wiki/Fortress_of_Solitude)** feel inadequate.

## What Is This Beautiful Monstrosity?

This is a Nuxt 3 application that combines a personal website with a comprehensive API.

Most people would put these in separate repos. I am not most people.

1. **A Nuxt Website**: because everyone needs a place to dump their thoughts on the internet
2. **A Production API**: with JWT authentication, hierarchical permissions, and more enterprise features than most actual enterprises

Originally, my site was a simple **[Cloudflare Worker](https://developers.cloudflare.com/workers/)**. But why keep things simple when you can rebuild everything with type safety, comprehensive testing, CLI tools, backup systems, and enough abstractions to make you want to eat your own head?

## Features Which Nobody Asked For (But Everyone Secretly Wants)

### 🔐 Enterprise-Grade Authentication

JWT-based fortress protecting my digital empire with dual authentication methods:

- **Bearer Token Headers**: `Authorization: Bearer <jwt>` - For sophisticated API consumers
- **URL Parameters**: `?token=<jwt>` - For browsers and commitment-phobic clients
- **Hierarchical permissions** (`api:metrics`, `ai:alt`, etc.) with "Russian nesting dolls" approach
- **Token introspection** and validation endpoints
- **Token revocation** support with KV-based blacklist for immediate invalidation
- **CLI-based token management** with D1 database storage that would make enterprise admins weep with joy

#### 🔓 Public Endpoints (No JWT Required)

- `/api/internal/health`, `/api/internal/ping`, `/api/internal/worker` - Core system endpoints
- `/api/go/{slug}` and `/go/{slug}` - URL redirection service (gh, tw, li)

#### 🔒 Protected Endpoints (JWT Required)

- **`/api/internal/auth`** - Token validation (any valid JWT)
- **`/api/internal/metrics`** - API metrics (`api:metrics`, `api`, `admin`, or `*`)
- **`/api/ai/alt`** (GET/POST) - Alt-text generation (`ai:alt`, `ai`, `admin`, or `*`)
- **`/api/tokens/{uuid}/*`** - Token management (`api:tokens`, `api`, `admin`, or `*`)
#### 🔧 Token Generation

```bash
# Metrics dashboard access
bun jwt create --sub "api:metrics" --description "Metrics access" --expiry "30d"

# AI service access
bun jwt create --sub "ai:alt" --description "Alt-text generation" --expiry "7d"

# Full API access
bun jwt create --sub "api" --description "Full API access" --expiry "1d"

# Interactive mode
bun jwt create --interactive
```

**Permission Hierarchy**: `api:metrics` → `api` → `admin` → `*` (each level inherits access to lower levels)

-### 🤖 AI Integration (Now With Real AI Magic!)

- Alt-text generation for images (URL or raw base64) using Cloudflare AI
- Powered by `@cf/llava-hf/llava-1.5-7b-hf` model (because we don't mess around with fake AI)
- Because accessibility matters, even for personal sites that are way too complicated
- File size validation and proper error handling (up to 4MB images)
- **🚨 BREAKING CHANGE**: POST body now accepts raw base64 only (no data URLs)
- Consistent authentication and response formatting across both GET and POST endpoints

### 📊 KV Metrics Which Would Make Google Jealous

**🚨 BREAKING CHANGE**: New flat key schema implemented!

- Comprehensive API metrics in JSON, YAML, or Prometheus formats
- Request/response statistics with Cloudflare metadata
- Perfect for when you want to obsess over your site's performance
- **Flat Key Storage**: colon-separated, lowercase, kebab-cased keys with simple values
- **Resource-Based Tracking**: Separate metrics for API resources (`internal`, `ai`, etc.)
- **Redirect Analytics**: Individual tracking for each redirect slug
- **Comprehensive Metrics**: Hit counts, visitor classification, status codes, timing data
- **Real-time Updates**: Atomic updates to metric values for consistency

### 🔗 URL Shortening & Redirects

- `/go/gh` → GitHub profile (which saves you from typing)
- `/go/tw` → Twitter/X (when I remember social media exists)
- `/go/li` → LinkedIn (for professional pretenses)
- Click tracking with KV metrics integration


### 📱 Dashboard Data Feeds

- Hacker News RSS integration with hourly caching
- Because even personal sites need dashboards these days

### 💾 KV Storage Management (The Crown Jewel)

**🚨 BREAKING CHANGE**: Enhanced YAML support with anchors and a hierarchical layout for readability while storing values as flat KV keys.

- Complete export/import system with structured YAML
- YAML anchor/reference support for DRY configuration management
- Integer values exported as integers (not strings)
- Pattern-based data filtering
- Production-ready with multiple safety confirmations
- CLI tool that handles your data with kid gloves

### 🛡️ Security Features Which Would Impress the NSA

- CORS headers that actually make sense
- Input sanitisation and validation with Zod
- Security headers that would make OWASP shed a single tear of joy
- Shell script responses for curl/wget requests

## Getting Started (For the Brave and Caffeinated)

### Prerequisites

- **Bun** (because npm is so last decade)
- **Node.js 18+** (if you insist on being traditional)
- **Cloudflare Account** (for the full experience)
- **A sense of humor** (for dealing with my code comments)
- **Coffee** (lots of it)

### Installation

```bash
# Clone this magnificent monstrosity
git clone https://github.com/daveio/next-dave-io.git
cd next-dave-io

# Install dependencies (bun is preferred, but we don't judge)
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your secrets (don't commit them, I have trust issues)

# Generate types and prepare Nuxt
bun run types
bun run nuxt prepare

# Start the development server
bun run dev
```

### Environment Variables

Create a `.env` file with these variables (we promise not to judge your naming conventions):

```bash
# JWT Secret (change this, seriously, I'm watching)
API_JWT_SECRET=your-super-secret-jwt-key-that-definitely-isnt-password123

# Cloudflare credentials (for when you want the full production experience)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Public API base URL
NUXT_PUBLIC_API_BASE_URL=/api
```

## API Documentation (The Crown Jewels)

### Authentication (Gateway to the Kingdom)

All protected endpoints require a JWT token. You can provide it via:

- **Authorization header**: `Authorization: Bearer <token>`
- **Query parameter**: `?token=<token>` (for when headers are too mainstream)

### Core Endpoints (The Essentials)

#### `GET /api/internal/health`

The only endpoint that doesn't judge you for not having authentication.

```bash
curl http://localhost:3000/api/internal/health
```

#### `GET /api/internal/ping`

Simple ping endpoint that logs KV metrics and shows off Cloudflare headers like a peacock.

```bash
curl http://localhost:3000/api/internal/ping
```

#### `GET /api/internal/worker`

Internal Worker runtime information (because transparency is trendy).

```bash
curl http://localhost:3000/api/internal/worker
```

#### `GET /api/internal/auth`

Token introspection and validation. Perfect for existential questions about your JWT's purpose in life.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/auth
```

#### `GET /api/internal/metrics`

Get comprehensive API metrics in your preferred format (because choice matters).

```bash
# JSON (the sensible default)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics

# YAML (for the hipsters)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics?format=yaml

# Prometheus (for the monitoring-obsessed)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/metrics?format=prometheus
```

#### `GET/POST /api/ai/alt`

Generate alt-text for images. Because accessibility is cooler than avocado toast.

```bash
# Via URL parameter (the lazy way)
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/ai/alt?url=https://example.com/image.jpg"

# Via POST body (raw base64)
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"image": "<base64-image>"}' \
  http://localhost:3000/api/ai/alt
```


### Dashboard Endpoints (Because Data Is Beautiful)

#### `GET /api/dashboard/{name}`

Get dashboard data feeds. Currently supports `hackernews`.

```bash
# Hacker News feed (for your daily dose of tech drama)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/dashboard/hackernews
```

### Statistics & Redirects


#### `GET /go/{slug}`

URL redirects for the chronically lazy (we've all been there).

- `/go/gh` → My GitHub
- `/go/tw` → My Twitter/X
- `/go/li` → My LinkedIn

### Token Management (Handle With Care)

#### `GET /api/tokens/{uuid}`

Get token usage information.

#### `GET /api/tokens/{uuid}/metrics`

Detailed metrics for a specific token.

#### `GET /api/tokens/{uuid}/usage`

Token usage statistics.

#### `POST /api/tokens/{uuid}/revoke`

Revoke a token (relationship status: it's complicated).

## Scripts & Utilities (My Toolbox)

I have lovingly crafted some handy scripts in the `bin/` directory, now with shared modules to eliminate code duplication (because even I believe in DRY principles):

### `bin/jwt.ts` - JWT Token Management CLI (Now With Database Powers!)

```bash
# Initialize D1 database schema (one-time setup, like assembling IKEA furniture)
bun jwt init

# Create a new token (with great power...)
bun jwt create --sub "api:metrics" --description "Metrics access" --expiry "30d"

# Create an admin token (comes great responsibility)
bun jwt create --sub "admin" --description "God mode" --no-expiry --seriously-no-expiry

# Verify a token (trust, but verify)
bun jwt verify "eyJhbGciOiJIUzI1NiJ9..."

# List all your beautiful tokens (like a digital collection)
bun jwt list

# Show detailed info about a specific token (for the detail-oriented)
bun jwt show <uuid>

# Search for tokens (because sometimes you forget what you created)
bun jwt search --sub "api"                    # Find by subject
bun jwt search --description "test"           # Find by description
bun jwt search --uuid "123e4567-e89b"         # Find by UUID

# Revoke a token (relationship status: it's complicated)
bun jwt revoke <uuid>
bun jwt revoke <uuid> --confirm               # Skip the dramatic confirmation

# Interactive mode (for the GUI enthusiasts)
bun jwt create --interactive
```

**New Features Which Will Make Your Life Better:**

- **Automatic Configuration**: Reads D1 and KV IDs from `wrangler.jsonc` (because hardcoded IDs are so 2023)
- **Environment Override**: Environment variables still win over config files (hierarchy matters)
- **Graceful Degradation**: Works without Cloudflare credentials for basic operations (perfect for offline work)
- **D1 Storage**: Token metadata lives in your production database (persistent and searchable)
- **KV Revocation**: Immediate token blacklisting via KV storage (no waiting around)
- **Smart Error Handling**: Helpful error messages which actually help (revolutionary concept)

### `bin/api-test.ts` - HTTP API Testing Suite

```bash
# Test against local development server
bun run test:api

# Test against production (if you're feeling brave)
bun run test:api --url https://dave.io

# Test specific endpoints (because targeted testing is efficient)
bun run test:api --auth-only
bun run test:api --metrics-only
bun run test:api --ai-only
bun run test:api --dashboard-only

# Use an existing token (for when you're feeling prepared)
bun run test:api --token "eyJhbGciOiJIUzI1NiJ9..."
```

### `bin/kv.ts` - KV Storage Management (The Data Whisperer)

**🚨 BREAKING CHANGE**: Enhanced YAML with anchors and integer handling!

```bash
# Remote operations (production-ready, requires API credentials)
bun run kv export                    # Export selected data patterns to YAML
bun run kv export --all              # Export everything to YAML (readable chaos)
bun run kv import data/kv/kv-20241201-120000.yaml     # Import with confirmation
bun run kv import kv-backup.yaml --yes                # Skip confirmation (live dangerously)
bun run kv import backup.yaml --wipe                  # Nuclear import (wipe first)
bun run kv list                      # List all KV keys
bun run kv list --pattern "metrics" # Filter by pattern
bun run kv wipe                      # Nuclear option (requires CONFIRM_WIPE=yes)

# Local operations (development mode - uses wrangler simulator)
bun run kv --local export           # Export from local dev storage
bun run kv --local import backup.yaml  # Import to local dev storage
bun run kv --local list              # List local dev keys
bun run kv --local wipe              # Wipe local dev storage (safe!)
```

**YAML All The Things! (Now With More Structure!):**

The new YAML export/import system is even better:
- **Human-Readable**: Hierarchical YAML for readability, automatically converted to flat KV keys
- **Git-Friendly**: Proper diff support and version control
- **Anchor Support**: YAML anchors and references for DRY configuration
- **Integer Handling**: Numbers exported as integers, not strings
- **Schema Validation**: TypeScript schemas ensure data integrity
- **Config Management**: Perfect for environment setup and data seeding

**New Schema Structure:**
```yaml
_anchors:  # Anchor definitions (excluded from import)
  sample_metrics: &sample_metrics
    ok: 0
    error: 0
    times: { last-hit: 0, last-error: 0, last-ok: 0 }
    # ... more metrics template

metrics:
  resources:
    internal:
      <<: *sample_metrics  # Reference anchor
      ok: 100             # Override specific values
    ai:
      <<: *sample_metrics
      ok: 50
  redirect: {}
  <<: *sample_metrics      # Top-level metrics

redirect:
  gh: https://github.com/daveio
  blog: https://blog.dave.io
```

**Local Mode Benefits (Finally, Development That Doesn't Break Production!):**

- **Safe Sandbox**: Uses wrangler's built-in KV simulator - your production data stays untouched
- **No API Keys**: No need for Cloudflare credentials during development
- **Fast Iteration**: Test export/import cycles without hitting rate limits
- **Team Friendly**: Share KV data via YAML files without exposing production secrets
- **Offline Development**: Work without internet connectivity (once wrangler is set up)

**Import Safety Features (Because I've Seen Things):**

- **Overwrite Detection**: Warns you about existing keys that will be overwritten
- **Confirmation Required**: Uses `--yes`/`-y` flags or `KV_IMPORT_ALLOW_OVERWRITE=1` environment variable
- **Clean Slate Option**: `--wipe`/`-w` flag nukes everything first (for the perfectionist restores)
- **Smart Path Resolution**: Handles `data/kv/filename.yaml`, `./data/kv/filename.yaml`, or absolute paths
- **Anchor Processing**: Properly handles YAML anchors and excludes `_anchors` section
- **Schema Conversion**: Converts nested YAML back to flat KV keys automatically

**Export Patterns (hierarchical YAML, flat KV keys like `metrics:ok` and `redirect:gh`):**

- `metrics` - YAML tree of metrics, stored using keys like `metrics:ok`
- `redirect` - YAML tree of redirect mappings, stored using keys like `redirect:gh`
- `dashboard:*` - Dashboard cache data
- `routeros:*` - RouterOS cache (legacy, may be removed)

### `bin/deploy-env.ts` - Secure Environment Deployment (The Security-Conscious Wizard)

```bash
# Deploy production environment variables from .env
bun run deploy:env
```

**What It Does (With Military Precision):**

- **Validates Configuration**: Ensures `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `API_JWT_SECRET` are set
- **Security First**: Refuses to deploy if dangerous API key/email combo is configured without proper tokens
- **Smart Filtering**: Excludes all `API_DEV_*` variables and legacy `CLOUDFLARE_API_KEY`/`CLOUDFLARE_EMAIL`
- **Production Safe**: Only deploys variables intended for production use
- **Secure Deployment**: Uses `wrangler secret put` with STDIN for maximum security (no secrets in command history)
- **Comprehensive Logging**: Shows what's being deployed, what's being skipped, and why

**Safety Features (Because Your Data Matters):**

- Won't deploy development variables (`API_DEV_*` prefix)
- Won't deploy insecure legacy authentication (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`)
- Validates environment before attempting deployment
- Provides clear error messages when configuration is invalid
- Exits with proper status codes for CI/CD integration

## Testing (Because I Believe in Quality)

```bash
# Run unit tests (the foundation of trust)
bun run test

# Run tests with UI (fancy visual feedback)
bun run test:ui

# Run tests with coverage (for the perfectionists)
bun run test:coverage

# Test the API over HTTP (integration testing at its finest)
bun run test:api

# Type checking and linting (because standards matter)
bun run typecheck
bun run lint
bun run format

# The full monty (what I run before committing, and you should too)
bun check
```

## Deployment (To The Clouds!)

### Development

```bash
bun run dev
```

### Production Build

```bash
bun run build
```

### Cloudflare Workers Deployment (The Big Leagues)

#### Initial Setup (One-Time Pain)

```bash
# Create Cloudflare resources
wrangler kv:namespace create DATA
wrangler d1 create NEXT_API_AUTH_METADATA

# Update wrangler.jsonc with the resource IDs
# (Copy the IDs from the output above - the JWT tool will read them automatically)

# Initialize the D1 database schema (because empty databases are useless)
bun jwt init

# Deploy environment variables securely (reads from .env)
bun run deploy:env

# Deploy to the cloud
bun run deploy

# Test your production deployment
bun run test:api --url https://your-worker.your-subdomain.workers.dev

# Create your first production token (you'll need this)
bun jwt create --sub "admin" --description "Production admin access" --expiry "90d"
```

#### Ongoing Deployment (The Daily Grind)

```bash
# Make changes, test locally
bun run dev

# Run quality checks (don't skip this, I'm watching)
bun check

# Deploy to production
bun run deploy

# Verify everything works
curl https://your-production-url.com/api/health
```

## Project Structure (For the Architecturally Curious)

```plaintext
├── server/                  # The backend kingdom
│   ├── api/                 # API endpoints (the crown jewels)
│   │   ├── internal/        # Internal system endpoints
│   │   │   ├── auth.get.ts  # JWT validation
│   │   │   ├── health.get.ts # Health check
│   │   │   ├── ping.get.ts  # Simple ping
│   │   │   ├── metrics.get.ts # API metrics
│   │   │   ├── headers.get.ts # Request headers
│   │   │   └── worker.get.ts # Worker info
│   │   ├── ai/              # AI endpoints
│   │   │   ├── alt.get.ts   # Alt-text (GET)
│   │   │   └── alt.post.ts  # Alt-text (POST)
│   │   ├── dashboard/       # Dashboard data
│   │   │   └── [name].get.ts # Named dashboards
│   │   ├── go/              # URL redirects
│   │   │   └── [slug].get.ts # Redirect handler
│   │   └── tokens/          # Token management
│   │       └── [uuid]/      # Token operations
│   ├── utils/               # Server utilities (the workhorses)
│   │   ├── auth.ts          # Authentication logic
│   │   ├── response.ts      # Response helpers
│   │   ├── schemas.ts       # Zod validation schemas
│   │   └── environment.ts   # Runtime configuration
│   └── middleware/          # Server middleware (the gatekeepers)
│       ├── cors.ts          # CORS configuration
│       ├── error.ts         # Error handling
│       └── shell-scripts.ts # Shell script responses
├── test/                    # Unit tests (the safety net)
├── bin/                     # CLI scripts (my toolbox)
│   ├── jwt.ts              # JWT token management
│   ├── api-test.ts         # HTTP API testing
│   ├── kv.ts               # KV storage management
│   └── shared/             # Shared CLI utilities (DRY principles in action)
│       ├── cloudflare.ts   # Cloudflare client management
│       └── cli-utils.ts    # Common utilities and helpers
├── types/                   # TypeScript definitions
├── app.vue                  # Minimal frontend (placeholder for now)
└── public/                  # Static assets
```

## Technologies Used (The Foundation)

- **Nuxt 3**: Because Vue is delightful
- **TypeScript**: For when JavaScript isn't painful enough
- **Zod**: Schema validation which actually works
- **JOSE**: JWT handling done right
- **Vitest**: Testing which doesn't make you cry
- **Cloudflare Workers**: Because serverless is the future
- **Bun**: The runtime that makes everything faster
- **Biome**: Linting and formatting which just works
- **Commander**: CLI framework for the command-line warriors

## Contributing (If You Dare)

Found a bug? Want to add a feature? I welcome contributions, but be warned: I have strong opinions about code style and will judge your commit messages.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (and write tests, I'm definitely watching)
4. Run the test suite (`bun run test && bun run test:api`)
5. Ensure everything passes (`bun check`)
6. Submit a pull request with a description that makes me smile
7. Prepare for code review feedback (I'm thorough)

## KV Metrics Schema (The Data Nerd's Paradise)

**Current Implementation**: Simple flat key hierarchy with individual string/integer values for maximum simplicity.

My implementation uses straightforward flat KV keys with simple values, prioritizing code simplicity over query performance (because sometimes the simple solution is the right solution).

### KV Store Structure Overview

For a visual representation of the complete KV data structure and key hierarchy:

- **📊 [Interactive Mermaid Diagram](KV.mmd)** - Source diagram with live editing capabilities
- **🖼️ [Vector Graphic (SVG)](KV.svg)** - Scalable diagram for documentation
- **📸 [Raster Image (PNG)](KV.png)** - Static diagram for quick reference

![KV Store Structure & Key Hierarchy Diagram](KV.svg){width=800 height=600}

### Current KV Storage Architecture

All metrics are stored as individual KV keys with simple values (strings, integers) using a flat hierarchical structure:

```plaintext
// Individual KV keys with simple values
metrics:requests:total = "1050"
metrics:requests:ok = "1000"
metrics:requests:error = "50"
metrics:requests:last-hit = "1704067200000"
metrics:requests:last-error = "1704060000000"
metrics:requests:last-ok = "1704067200000"

metrics:visitor:human = "800"
metrics:visitor:bot = "200"
metrics:visitor:unknown = "50"

metrics:status:200 = "900"
metrics:status:302 = "30"
metrics:status:404 = "15"
metrics:status:500 = "5"

// Resource-specific metrics
metrics:internal:ok = "500"
metrics:internal:error = "20"
metrics:internal:last-hit = "1704067000000"

metrics:ai:ok = "200"
metrics:ai:error = "10"
metrics:ai:last-hit = "1704066000000"

// Redirect mappings
redirect:gh = "https://github.com/daveio"
redirect:blog = "https://blog.dave.io"
redirect:tw = "https://twitter.com/daveio"

// Redirect metrics
metrics:redirect:gh:ok = "150"
metrics:redirect:gh:error = "5"
metrics:redirect:blog:ok = "100"
metrics:redirect:blog:error = "2"
```

**Trade-offs**: Simple flat keys prioritize code maintainability over query performance. Multiple KV lookups required for dashboard aggregation.

The API now tracks how long each KV lookup takes. Aggregated timings are stored under `metrics:timings:lookup:*` and exposed via the `/api/internal/metrics` endpoint. Example snippet:

```json
{
  "kv_timings_ms": {
    "metrics:ok": 12,
    "metrics:error": 5
  }
}
```

### Current Architecture Benefits

1. **🔧 Simple to Debug**: Individual keys are easy to inspect and modify manually
2. **📝 Readable Code**: Straightforward key-value operations without JSON parsing
3. **🎯 Atomic Operations**: Each metric update is independent and atomic
4. **🔍 Easy Filtering**: Pattern-based key filtering for exports and analysis
5. **💡 Low Complexity**: No schema versioning or migration concerns
6. **🛠️ Tool Friendly**: KV management tools can easily inspect individual values

### Performance Considerations

The flat key approach trades query performance for operational simplicity:

- **Dashboard Loading**: Requires multiple KV `get()` calls for metric aggregation
- **Batch Operations**: No single-key reads for comprehensive data
- **Network Overhead**: More round trips to KV storage for complex queries
- **Edge Performance**: Acceptable for current traffic levels, may need optimization at scale

### Function Updates

Current helper functions work with individual KV keys:

```typescript
// Individual key updates
await incrementKVCounter(kv, `metrics:${endpoint}:ok`)
await setKVValue(kv, `metrics:${endpoint}:last-hit`, Date.now().toString())

// Pattern-based retrieval for aggregation
const allMetrics = await getKVKeysByPattern(kv, 'metrics:*')
console.log(`Total API requests: ${calculateTotalFromKeys(allMetrics)}`)
```

The current flat approach delivers reliable metrics with operational simplicity, accepting the performance trade-off for maintainability!

## License

MIT License - Because sharing is caring, and I believe in open source (and good karma).

## Next Steps

### Immediate Improvements

- **Frontend Development**: Build actual website content (the current `app.vue` is a bit lonely)
- **Enhanced Monitoring**: Add comprehensive logging and alerting
- **JWT Management Dashboard**: Build a web UI for token management (because CLI tools are great, but pretty interfaces are better)

### Security Enhancements

- **Token Rotation**: Automatic JWT refresh capabilities
- **IP Allowlisting**: Geographic and IP-based restrictions
- **Audit Logging**: Enhanced security event tracking
- **Content Validation**: File scanning and validation improvements

### Performance Optimizations

- **Response Caching**: Intelligent caching strategies
- **Bundle Optimisation**: Reduce Worker bundle size
- **Compression**: Response compression for large payloads
- **CDN Integration**: Optimize static asset delivery

## Final Thoughts

This project started as a simple personal website and evolved into a full-fledged API platform with database integration, CLI management tools, and enough enterprise features to make Fortune 500 companies jealous. Why? Because I don't do things halfway. If you're looking for a simple static site generator, this probably isn't for you. If you want to see how to build a production-ready API with authentication, validation, testing, deployment automation, backup systems, database integration, and enough features to power a small startup, welcome to the rabbit hole.

The codebase demonstrates modern TypeScript patterns, proper error handling, comprehensive testing, real-world deployment scenarios, database integration, CLI tool development, and enterprise-grade features that would make your DevOps team weep with joy. It's simultaneously a personal website, a learning resource, and a testament to what happens when a developer has too much free time and strong opinions about code quality.

The latest addition of comprehensive JWT token management with D1 database storage proves that sometimes over-engineering is exactly the right amount of engineering. You can now manage tokens like a proper enterprise application, complete with search, revocation, and metadata storage that would make GitHub's token management system take notes.

Remember: with great power comes great responsibility. Use these APIs wisely, back up your data religiously, initialize your databases properly, and may your tokens never expire unexpectedly (unless you want them to).

## Build Warnings (Which Are Not Worth Your Sanity)

During the build process, you'll see some warnings about `this` keyword in the Cloudflare library that look scary but are completely harmless:

```plaintext
node_modules/cloudflare/core.mjs (...): The 'this' keyword is equivalent to 'undefined' at the top level of an ES module, and has been rewritten
```

These warnings come from the official Cloudflare SDK and are more trouble to fix than they're worth. The library works perfectly fine despite the warnings, and attempting to suppress them would require more effort than the heat death of the universe. Just ignore them like that weird noise your car makes which doesn't affect driving.

---

  *Built with ❤️ (and perhaps too much caffeine) by [Dave Williams](https://dave.io)*

*P.S. - If you curl the root URL, you'll get a shell script response. Pipe it to `sh`.*
