# dave.io

A modern web platform built with Nuxt 4 and Cloudflare Workers, featuring AI-powered text processing, image analysis, and URL redirection services.

## ✨ Features

- **AI Text Splitting**: Break long text into social media-friendly posts with intelligent threading
- **AI Alt Text Generation**: Generate descriptive alt text for images using AI vision
- **AI Word Alternatives**: Find better word choices with context-aware suggestions
- **URL Redirects**: Short link redirection system with `/go/{slug}` routes
- **JWT Authentication**: Hierarchical permission system with fine-grained access control
- **Real-time APIs**: Fast, validated endpoints with comprehensive error handling

## 🚀 Quick Start

**Prerequisites**: Node.js 22.17.0+, Bun

```bash
# Install dependencies and start development server
bun install && bun run dev  # Starts in ~3s
```

## 🛠️ Tech Stack

- **Runtime**: Nuxt 4 + Cloudflare Workers
- **Auth**: JWT + JOSE hierarchical permissions
- **Validation**: Zod + TypeScript
- **Testing**: Vitest + HTTP API testing
- **Tools**: Bun, Biome
- **AI**: Anthropic Claude 4 Sonnet via Cloudflare AI Gateway

## 🔗 API Endpoints

### Public Endpoints

- `GET /api/ping` - Health check and status
- `GET /go/{slug}` - URL redirection service

### AI Services (Authenticated)

- `POST /api/ai/social` - Split text for social media networks
- `GET|POST /api/ai/alt` - Generate alt text for images
- `POST /api/ai/word` - Find word alternatives and synonyms

### Token Management (Authenticated)

- `GET /api/token/{uuid}/*` - Token operations and metadata

## 🔐 Authentication

All protected endpoints use JWT tokens with hierarchical permissions:

```bash
# Authorization header
Authorization: Bearer <jwt>

# Query parameter (alternative)
?token=<jwt>
```

**Permission Categories**: `api`, `ai`, `dashboard`, `admin`, `*`
**Permission Format**: `category:resource` (parent permissions grant child access)

## 💡 Usage Examples

### AI Text Splitting

Split long text into social media posts with automatic threading:

```bash
curl -X POST "https://dave.io/api/ai/social" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Your long text here...",
    "networks": ["bluesky", "mastodon"],
    "strategies": ["sentence_boundary", "paragraph_preserve"]
  }'
```

### AI Alt Text Generation

Generate descriptive alt text for images:

```bash
# From image URL
curl "https://dave.io/api/ai/alt?image=https://example.com/image.jpg" \
  -H "Authorization: Bearer <token>"

# From file upload
curl -X POST "https://dave.io/api/ai/alt" \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"
```

### AI Word Alternatives

Find better word choices:

```bash
# Single word mode
curl -X POST "https://dave.io/api/ai/word" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single", "word": "happy"}'

# Context mode
curl -X POST "https://dave.io/api/ai/word" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "context",
    "text": "I am very happy about the result.",
    "target_word": "happy"
  }'
```

## ⚙️ Development Commands

| Command            | Purpose                   |
| ------------------ | ------------------------- |
| `bun run dev`      | Start development server  |
| `bun run build`    | Build for production      |
| `bun run test`     | Run unit tests            |
| `bun run test:api` | Run API integration tests |
| `bun run check`    | Full CI/CD validation     |
| `bun run deploy`   | Deploy to Cloudflare      |

## 🧪 Testing

```bash
# Unit tests
bun run test

# API integration tests
bun run test:api

# Test with authentication
bun run test:api --auth-only --url https://dave.io

# Test AI endpoints only
bun run test:api --ai-only
```

## 🔧 CLI Tools

The project includes powerful CLI tools for development and testing:

```bash
# JWT token management
bun jwt init                                    # Initialize JWT system
bun jwt create --sub "api:metrics" --expiry "30d"  # Create token
bun jwt list                                    # List active tokens
bun jwt verify <token>                          # Verify token

# KV storage management
bun run kv export --all                         # Export all KV data
bun run kv import backup.yaml                   # Import KV data
bun run kv list                                 # List KV entries

# API testing
bun try --auth ping                             # Test ping with auth
bun try --auth ai social "Long text to split"  # Test AI social
bun try --auth ai word "happy"                  # Test AI word alternatives
```

## 📁 Project Structure

```text
app/
├── components/    # Vue components
├── pages/         # Application pages
├── plugins/       # Client/server plugins
└── assets/        # CSS and static assets

server/
├── api/           # API endpoint handlers
├── routes/        # Server-side routes (redirects)
├── utils/         # Shared utilities and schemas
└── middleware/    # Request processing middleware

test/              # Test suites
bin/               # CLI tools
types/             # TypeScript type definitions
data/kv/           # KV storage initialization
```

## 🚀 Deployment

Deploy to Cloudflare Workers:

```bash
# Create required resources
wrangler kv:namespace create KV
wrangler d1 create NEXT_API_AUTH_METADATA

# Initialize and deploy
bun jwt init
bun run deploy
```

**Required Environment Variables**:

- `API_JWT_SECRET` - JWT signing secret
- `ANTHROPIC_API_KEY` - Claude AI API key
- `CLOUDFLARE_API_TOKEN` - Cloudflare API access
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

## 🔧 Troubleshooting

**Build Issues**:

```bash
bun run lint:eslint  # Check linting
bun run lint:types   # Check TypeScript
bun run test         # Run tests
```

**Runtime Issues**:

- Verify environment variables are set
- Check Cloudflare bindings (KV, D1, AI, IMAGES)
- Confirm JWT token has required permissions
- Validate request schemas match API expectations

**Common Patterns**:

- Use absolute file paths in imports
- Validate UUIDs with `getValidatedUUID()`
- Protect URLs with `validateURL()`
- Handle errors with `createApiError()`

## 📋 Response Format

All API responses follow a consistent structure:

```json
{
  "ok": true,
  "result": {
    /* response data */
  },
  "error": null,
  "status": { "message": "Operation successful" },
  "timestamp": "2025-07-11T..."
}
```

Error responses:

```json
{
  "ok": false,
  "error": {
    /* error details */
  },
  "status": { "message": "Error description" },
  "timestamp": "2025-07-11T..."
}
```

## 🔗 Links

- [Live Site](https://dave.io)
- [API Documentation](https://dave.io/openapi.json)
- [Issue Tracker](https://linear.app/dave-io)

---

Built with ❤️ using modern web technologies and AI-powered services.
