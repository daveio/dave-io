# dave.io

*Because why have one thing when you can have ALL the things?*

Welcome to my delightfully over-engineered corner of the internet. What started as "I should probably have a personal website" has somehow evolved into a full-blown platform that does... well, a bit of everything, really.

![License](https://img.shields.io/github/license/daveio/dave-io-api)

## What Even Is This?

dave.io is what happens when you give a developer Cloudflare Workers and tell them "just make a simple website." It's both a personal website AND a comprehensive API platform, all living harmoniously in a single Workers deployment because apparently I enjoy making things complicated.

Think of it as my digital Swiss Army knife - it's got a website, URL shortener, AI services, authentication system, dashboard feeds, network scripts, and probably a few other things I've forgotten about. It's the kind of project where "just add one more endpoint" is a dangerous phrase.

## The Good Stuff

### 🌐 **Personal Website**

A slick Vue.js single-page application that actually tells you about me. Revolutionary, I know.

### 🔗 **URL Shortener**

`dave.io/go/something` - because long URLs are for people who don't host their own redirects.

### 🤖 **AI Alt Text Generation**

Point it at an image, get back descriptive alt text. Powered by Cloudflare's LLaVA model because accessibility matters (and because AI, used appropriately, is funky).

### 📊 **Dashboard Feeds**

JSON/YAML feeds for dashboard widgets. Currently serves demo data and Hacker News. There's also a `dashkit` widget for Hacker News in `dashkit/`.

### 🌐 **RouterOS Script Generator**

Generates MikroTik RouterOS scripts for blocking/allowing IP ranges. Currently handles put.io because... look, we all have our reasons.

### 📈 **Metrics Galore**

Tracks everything in multiple formats (JSON, YAML, Prometheus) because if you're not measuring it, are you even doing it right?

### 🔐 **Enterprise-Grade Auth**

JWT authentication with hierarchical permissions, token revocation, usage tracking, and all the bells and whistles. It's probably overkill for a personal site, but hey, at least my API is secure.

## Quick Start (Or: How to Run This Monster)

### Prerequisites

- [Bun](https://bun.sh/) (because I got bored with Node)
- A Cloudflare account (because where else would you run this?)
- Patience (because setting up Cloudflare services takes time)

### Development Setup

```bash
# Clone this beautiful mess
git clone https://github.com/daveio/dave-io-api.git
cd dave-io-api

# Install all the dependencies (there are... many)
bun install

# Set up your environment
cp .env.example .env  # Create this file with your secrets

# Start the unified development server
bun run dev

# Or if you hate yourself, run things separately:
bun run dev-frontend   # Just the Vue.js app
bun run dev-worker     # Just the API
```

### Environment Variables

Create a `.env` file because hardcoding secrets is for amateurs:

```bash
# JWT secret for authentication (make it good)
API_JWT_SECRET=your-super-secret-key-that-definitely-isnt-password123

# Cloudflare API access (for CLI tools)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
```

## Available Commands

Because I like having options:

```bash
# Development
bun run dev              # Start the dev server

# Building and deploying
bun run build           # Build everything
bun run deploy          # Build and deploy to Cloudflare
bun run clean           # Clean up generated files

# Quality control
bun run typecheck       # TypeScript validation
bun run lint            # Code linting (Biome + Trunk)
bun run format          # Code formatting

# Useful utilities
bun run jwt --help      # JWT token management CLI
bun run kv --help       # KV data backup/restore
```

## Documentation

### Interactive API Docs

- **Swagger UI**: [`/api/docs`](https://dave.io/api/docs) - Test endpoints directly in your browser
- **ReDoc**: [`/api/redocs`](https://dave.io/api/redocs) - Clean, readable documentation
- **OpenAPI Schema**: [`/api/openapi.json`](https://dave.io/api/openapi.json) - Raw specification

Because good APIs deserve good docs, and bad APIs deserve them even more.

## The API Endpoints

### Core Services

- `GET /api/ping` - "Am I alive?" (Spoiler: usually)
- `GET /go/:slug` - URL redirection magic
- `GET /api/dashboard/:name` - Dashboard data feeds (demo, hackernews)
- `GET /api/routeros/putio` - RouterOS scripts for the networking nerds
- `GET /api/routeros/cache` - Cache status (because caching is hard)
- `GET /api/routeros/reset` - Nuclear option for cache
- `GET /api/metrics[/format]` - All the metrics, all the time

### Authentication & Token Stuff

- `GET /api/auth` - Test your JWT tokens
- `GET /api/tokens/:uuid/usage` - How much have you used that token?
- `POST /api/tokens/:uuid/revoke` - Burn it all down

### AI Services

- `GET /api/ai/alt?image=url` - "What's in this picture?"
- `POST /api/ai/alt` - Same thing but with base64 data

All endpoints come with comprehensive OpenAPI documentation at `/api/docs` because I'm not a monster.

## JWT Authentication (The Serious Bit)

Because even personal projects need enterprise-grade security apparently:

### Quick Setup

1. **Set your JWT secret** (and make it actually secret):

```bash
# For production
bun run wrangler secret put API_JWT_SECRET

# For local development (create .env file)
API_JWT_SECRET=your-super-secret-key-here
```

2. **Set up CLI environment** (if you want the fancy tools):

```bash
export CLOUDFLARE_API_TOKEN=your-token
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_D1_DATABASE_ID=your-d1-database-id
```

3. **Generate tokens** (the fun part):

```bash
# Create a token (interactive mode is your friend)
bun jwt create --interactive

# Or if you're feeling dangerous:
bun jwt create --sub "ai:alt" --expiry "30d" --description "Alt text access"

# List your tokens (because you'll forget)
bun jwt list

# Show specific token details
bun jwt show <uuid>

# Revoke a token (trust issues?)
bun jwt revoke <uuid>
```

### Token Features

- **Default 30-day expiration** (because permanent tokens are scary)
- **Hierarchical permissions** (e.g., `ai` gives access to all AI endpoints, `ai:alt` just gives alt text access)
- **Usage tracking** (know how much you're actually using this thing)
- **Request limits** (prevent accidental DoS attacks on yourself)
- **UUID tracking** (each token is special and unique, just like you)
- **Revocation** (because sometimes trust is broken)

### Using Tokens

```bash
# Header method (recommended)
curl -H "Authorization: Bearer YOUR_TOKEN" https://dave.io/api/auth

# Query parameter method (for when headers are hard)
curl "https://dave.io/api/auth?token=YOUR_TOKEN"
```

## Data Management (The Boring But Important Stuff)

### KV Backup/Restore

Because data loss is not fun:

```bash
# Backup your data (smart move)
bun kv backup

# Backup EVERYTHING (dangerous move)
bun kv backup --all

# Restore from backup (recovery move)
bun kv restore backup-file.json

# Nuclear option (why would you do this?)
bun kv wipe
```

### Storage Architecture

Everything lives in a single KV namespace with hierarchical keys:

```plaintext
dashboard:demo:items              # Demo dashboard data
redirect:your-slug               # URL redirections
routeros:putio:ipv4             # Cached IP ranges
metrics:status:404              # Error tracking
auth:count:uuid:requests        # Token usage
```

It's like a filing cabinet, but digital and with more colons.

## Architecture (The Nerdy Bits)

### Frontend

- **Vue 3** with Composition API
- **Vite** for build tooling because it's fast and I'm impatient
- **Tailwind CSS + UnoCSS** for styling without the bloat
- **Auto-imports** because typing imports is tedious

### Backend

- **Hono** for the HTTP framework (it's like Express but for Workers)
- **Chanfana** for OpenAPI docs that actually work
- **Zod** for schema validation because runtime type checking is life
- **TypeScript** everywhere because JavaScript without types is chaos

### Storage & Services

- **Cloudflare KV** for persistent data storage
- **Analytics Engine** for tracking everything (yes, everything)
- **Workers AI** for the LLaVA vision model
- **D1 Database** for JWT token metadata
- **Workers Assets** for serving the Vue.js app

## Deployment (The Moment of Truth)

It all deploys as a single Cloudflare Worker because why use multiple services when one will do?

```bash
# Deploy to production (fingers crossed)
bun run deploy
```

The Worker serves both the Vue.js frontend and all API endpoints, handles redirects, serves shell scripts to curl requests, and probably makes coffee if you ask nicely.

## Analytics (Big Brother Is Watching)

This thing tracks everything:

- Every API request (with response times, because performance matters)
- Client information (IP, user-agent, the works)
- Error rates and status codes
- Cache hit/miss ratios
- JWT token usage patterns

All exported in your choice of JSON, YAML, or Prometheus format because variety is the spice of life.

No personally identifiable information is stored though - I'm not that creepy.

## Contributing (Welcome to the Madness)

Found a bug? Want to add a feature? Great! Fork it, fix it, send a PR. Just remember:

1. Run `bun run typecheck` before you commit (TypeScript errors are not optional)
2. Use `bun run format` to keep the code pretty
3. Write commit messages that actually explain what you did
4. Test your changes (revolutionary concept, I know)

## Project Structure (For the Curious)

```bash
dave.io/
├── frontend/                # Vue.js SPA
│   ├── App.vue             # Main app component
│   ├── components/         # Reusable components
│   ├── views/              # Page components
│   └── assets/             # Static assets
├── src/                    # Backend API
│   ├── endpoints/          # API endpoints
│   ├── kv/                 # KV storage utilities
│   ├── lib/                # Shared libraries
│   ├── schemas/            # Zod schemas
│   └── index.ts            # Main application
├── bin/                    # CLI utilities
│   ├── jwt.ts              # JWT management
│   └── kv.ts               # KV backup/restore
├── dashkit/                # Dashboard widget example
└── public/                 # Static files
```

## Testing AI Alt Text (The Fun Part)

Want to test the AI endpoint? Here's a fish script because why not:

```fish
begin
set -l jwt YOUR_JWT_TOKEN && \
set -l img /path/to/image.jpg && \
curl -X POST "https://dave.io/api/ai/alt" \
    -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -d "{\"image\": \"data:image/jpeg;base64,$(base64 < $img | tr -d '\n')\"}" | jq .
end
```

Or just use the GET endpoint if you're not into base64 encoding:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://dave.io/api/ai/alt?image=https://example.com/image.jpg"
```

## License

MIT License. Sharing is caring, and lawyers are expensive.

## Final Thoughts

This project is simultaneously over-engineered and exactly what I needed. It's a testament to what happens when you give a developer too much free time and access to modern serverless platforms.

Is it overkill for a personal website? Absolutely.
Do I regret it? Not even a little bit.
Would I do it again? ...probably.

The whole thing runs on a single Cloudflare Worker, serves a Vue.js SPA, provides a comprehensive API, tracks everything, and even makes decent coffee (disclaimer: coffee-making functionality not actually implemented).

It's like having a datacenter in your pocket, except the datacenter is actually just someone else's computer and you're paying them to run your code. Modern technology is weird, but I'm here for it.

Enjoy the code, and may your Workers deploy successfully. 🚀

---

*Built with an unreasonable amount of TypeScript, a healthy dose of "why not?", and way too much caffeine.*

**Author**: Dave Williams ([@daveio](https://github.com/daveio)) - [dave@dave.io](mailto:dave@dave.io)
