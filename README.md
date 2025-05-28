# dave.io

A multipurpose personal API powered by Cloudflare Workers.

![License](https://img.shields.io/github/license/daveio/dave.io)

## Overview

This project implements a multipurpose personal API that runs on Cloudflare Workers, providing several endpoints for various services:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations (currently implements put.io IP ranges)
- **Metrics**: View API metrics in JSON, YAML, or Prometheus format
- **Authentication**: JWT-based authentication system with scope-based authorization
- **AI**: AI-powered services including alt text generation for images

The API is built with [Hono](https://hono.dev/) and uses [Chanfana](https://github.com/cloudflare/chanfana) for automatic OpenAPI 3.1 documentation generation and schema validation.

## Features

- **OpenAPI 3.1 Documentation**: Interactive Swagger UI at `/api/docs` and ReDoc at `/api/redocs`
- **Auto-Generated API Schema**: Complete OpenAPI specification available at `/api/openapi.json`
- **Type-Safe Development**: Built with TypeScript and Zod for runtime type validation and request/response validation
- **Cloudflare Integration**:

  - KV Namespace for unified data storage
  - Analytics Engine for request tracking and detailed analytics
  - Automatic deployment via Wrangler

- **Metrics Tracking**: Monitors error rates and status codes via KV storage
- **Error Monitoring**: All non-success/non-redirect responses are tracked for debugging
- **KV Backup/Restore**: Command-line tools for data management
- **Multiple Output Formats**: Support for JSON, YAML, and Prometheus metrics formats
- **JWT Authentication**: Secure token-based authentication with configurable scopes, usage tracking, and token revocation
- **CLI Tools**: Built-in utilities for JWT token generation with D1 metadata storage and KV management via Cloudflare SDK

## Documentation

The API provides comprehensive OpenAPI 3.1 documentation with interactive interfaces:

- **Interactive Swagger UI**: Available at `/api/docs` - test endpoints directly in your browser
- **ReDoc Documentation**: Available at `/api/redocs` - clean, readable API documentation
- **OpenAPI Schema**: Raw OpenAPI 3.1 specification at `/api/openapi.json`

All endpoints include detailed request/response schemas, parameter descriptions, and example responses.

## Endpoints

### Ping

- `GET /api/ping`: Simple health check endpoint
- Returns: `{ "service": "api", "response": "pong" }`

### Redirect

- `GET /api/redirect/:slug`: Get URL for a redirect by slug
- Returns: Redirect information or 404 if not found

### Dashboard

- `GET /api/dashboard/:name`: Get dashboard data by name
- Supported dashboards:
  - `demo`: Sample dashboard data
  - `hacker-news`: Latest stories from Hacker News RSS feed

### RouterOS

- `GET /api/routeros/putio`: Generate RouterOS script for put.io IP ranges
- Returns: RouterOS script for creating address lists for put.io IPv4 and IPv6 ranges
- `GET /api/routeros/cache`: Get cache status for RouterOS data
- Returns: Cache status information including age and any errors
- `GET /api/routeros/reset`: Reset the cache for RouterOS data
- Returns: Confirmation of cache reset

### Metrics

- `GET /api/metrics`: Default metrics endpoint (returns JSON)
- `GET /api/metrics/json`: Get metrics data in JSON format
- `GET /api/metrics/yaml`: Get metrics data in YAML format
- `GET /api/metrics/prometheus`: Get metrics data in Prometheus format
- Returns: Metrics tracked in KV storage, including:
  - Status code counts (`metrics:status:xxx`)
  - Status code group counts (`metrics:group:xxx`)
  - RouterOS cache metrics
  - Other application-specific metrics

### Authentication

- `GET /api/auth`: JWT authentication info endpoint
- Requires: Any valid JWT token (accepts any subject)
- Returns: Detailed information about the provided JWT token, including subject breakdown
- Headers: `Authorization: Bearer <token>` or query parameter `?token=<token>`

### AI

- `GET /api/ai/alt`: Generate alt text for images using AI
- `POST /api/ai/alt`: Generate alt text for uploaded images
- Requires: Valid JWT token with `ai` or `ai:alt` subject
- GET method: URL parameter `image` - URL of the image to generate alt text for
- POST method: Request body with base64-encoded image data
- Returns: Generated alt text for an image along with rate limit information
- Headers: `Authorization: Bearer <token>` or query parameter `?token=<token>`

## Analytics

This API uses Cloudflare Analytics Engine to track requests. The following data points are collected:

- Endpoint access (ping, redirect, dashboard, routeros)
- Slug information for redirects
- Dashboard names accessed
- Cache resets and status checks
- Status codes and error rates
- Request performance metrics
- Client information (IP, user-agent, referrer)

The API maintains a comprehensive record of non-successful responses (all status codes except 200, 301, and 302) in KV storage. These metrics are stored using hierarchical keys:

- `metrics:status:{code}`: Status code occurrence counter
- `metrics:group:{group}`: Status code group counter (4xx, 5xx)
- `metrics:routeros`: Shared metrics for all RouterOS endpoints
- `metrics:redirect:{slug}`: Click tracking data for redirect slugs

No personally identifiable information is stored. Analytics are used for monitoring service usage and debugging.

## 🔐 JWT Authentication

The API includes a comprehensive JWT authentication system with enterprise-grade features for protecting sensitive endpoints. Features include UUID-based token tracking, request limiting, usage monitoring, token revocation, and metadata storage in Cloudflare D1 database. All authorization information is encoded in the subject field of the JWT token.

### Quick Start

1. **Set JWT Secret**: Configure your JWT secret as a Cloudflare Workers secret:

```bash
# For production - the secret will be named API_JWT_SECRET in Cloudflare
bun run wrangler secret put API_JWT_SECRET

# For local development, add to .dev.vars file (already created for you)
# Edit .dev.vars and set your JWT secret:
API_JWT_SECRET=your-super-secret-key-here
```

2. **Set Environment Variables**: Configure the required environment variables for the CLI tools:

```bash
# Required for JWT CLI tool
export CLOUDFLARE_API_TOKEN=your-api-token-with-d1-permissions
export CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
export CLOUDFLARE_D1_DATABASE_ID=your-api-auth-metadata-database-id
export JWT_SECRET=your-jwt-secret  # or API_JWT_SECRET

# Required for KV CLI tool
export CLOUDFLARE_API_TOKEN=your-api-token-with-kv-permissions
export CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

3. **Generate a Token**: Use the enhanced CLI tool with full CRUD operations:

```bash
# Create a token (defaults to 30-day expiry for security)
bun run jwt create --sub "ai:alt" --description "Alt text generation"

# Create with custom expiry and request limits
bun run jwt create --sub "ai" --expiry "7d" --max-requests 1000 --description "AI services"

# Create without expiry (requires confirmation)
bun run jwt create --sub "admin" --no-expiry --seriously-no-expiry

# List all stored tokens
bun run jwt list

# Show detailed information about a token
bun run jwt show <uuid>

# Search tokens by criteria
bun run jwt search --sub "ai"
bun run jwt search --description "Dave"

# Revoke a token (via KV - see instructions)
bun run jwt revoke <uuid>
```

**Enhanced Features:**
- **UUID Tracking**: Each token gets a unique identifier for tracking
- **Usage Limits**: Optional `maxRequests` field for finite usage
- **Metadata Storage**: Token details stored in Cloudflare D1 database
- **Security Defaults**: 30-day default expiry with warnings for permanent tokens
- **Token Management**: Full CRUD operations via CLI commands

4. **Test Authentication**:

```bash
# Test the auth endpoint without a token (should return 401)
curl https://dave.io/api/auth # trunk-ignore(gitleaks/curl-auth-header)

# Test with invalid token (should return 401)
curl -H "Authorization: Bearer invalid-token" https://dave.io/api/auth

# Test with valid token (should return 200 with JWT details)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://dave.io/api/auth # trunk-ignore(gitleaks/curl-auth-header)

# Using query parameter instead of header
curl "https://dave.io/api/auth?token=YOUR_JWT_TOKEN"
```

**Expected Responses:**

- **No token**: `{"error":"Authentication required"}` (401)
- **Invalid token**: `{"error":"Invalid token"}` (401)
- **Valid token**: Success message with detailed JWT information (200)

### Subject-Based Authorization

The authentication system uses the subject field to encode user information and permissions. You can structure the subject to include user IDs, roles, and permissions as needed:

- `user123`: Simple user ID
- `admin:user123`: User with admin role
- `user123:read:write`: User with specific permissions
- `service:metrics`: Service account for metrics access

### Token Usage

JWT tokens can be provided in two ways:

1. **Authorization Header** (recommended):

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://dave.io/endpoint # trunk-ignore(gitleaks/curl-auth-header)
```

2. **Query Parameter**:

```bash
curl "https://dave.io/endpoint?token=YOUR_JWT_TOKEN"
```

### JWT CLI Tool

The enhanced JWT management tool (`bun run jwt`) provides comprehensive token lifecycle management:

**Available Commands:**

```bash
# Create tokens
bun run jwt create [options]

# List all tokens
bun run jwt list [--limit <number>]

# Show token details
bun run jwt show <uuid>

# Search tokens
bun run jwt search [--uuid <uuid>] [--sub <subject>] [--description <text>]

# Revoke tokens (instructions only)
bun run jwt revoke <uuid>

# Help
bun run jwt --help
```

**Create Command Options:**

- `--sub <subject>`: Subject for the token (required)
- `--expiry <time>`: Token expiration (default: 30d, e.g., "1h", "7d", "30m")
- `--max-requests <number>`: Maximum request limit for the token
- `--description <text>`: Description for the token
- `--no-expiry`: Create token without expiration (requires confirmation)
- `--seriously-no-expiry`: Skip confirmation for no-expiry tokens

**Database Integration:**

The CLI tool stores token metadata in a Cloudflare D1 database (`API_AUTH_METADATA`) including:
- UUID for unique identification
- Subject and description
- Creation and expiration timestamps
- Maximum request limits
- Usage tracking capabilities

**Environment Requirements:**

```bash
# Required environment variables
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_D1_DATABASE_ID=your-api-auth-metadata-database-id
JWT_SECRET=your-jwt-secret  # or API_JWT_SECRET
```

### Authentication Responses

**Success (200):**

```json
{
  "message": "Authentication successful! JWT details retrieved.",
  "jwt": {
    "subject": "ai:alt",
    "subjectParts": ["ai", "alt"],
    "issuedAt": 1640995200,
    "expiresAt": 1641081600,
    "timeToExpiry": 86400,
    "isExpired": false
  },
  "user": {
    "id": "ai:alt"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Authentication Required (401):**

```json
{
  "error": "Authentication required"
}
```

**Invalid Token (401):**

```json
{
  "error": "Invalid token"
}
```

### Implementing Authentication in Your Endpoints

To protect an endpoint with JWT authentication, use the `requireAuth()` middleware. Here's the correct implementation pattern:

```typescript
import { requireAuth, type AuthorizedContext } from "../lib/auth"
import type { Context } from "hono"

export class MyProtectedEndpoint extends OpenAPIRoute {
  async handle(c: Context) {
    // Create the authentication middleware
    const authMiddleware = requireAuth()

    // The middleware will return a Response if authentication fails
    let authResult: Response | void

    try {
      authResult = await authMiddleware(c, async () => {
        // This function only executes if auth succeeds
      })
    } catch (error) {
      console.error("Auth middleware error:", error)
      return c.json({ error: "Authentication failed" }, 500)
    }

    // If the middleware returned a Response, auth failed
    if (authResult instanceof Response) {
      return authResult
    }

    // Authentication succeeded - access user info
    const authContext = c as AuthorizedContext
    const userId = authContext.user.id

    // Your protected endpoint logic here...
    return c.json({
      message: "Success!",
      user: authContext.user,
      data: "sensitive data"
    })
  }
}
```

**Important**: The middleware returns a `Response` object when authentication fails (401 status), so you must check for this and return it directly. Don't assume the middleware throws errors - it handles HTTP responses internally.

### Endpoint-Specific Authorization

For more granular control, use the `authorizeEndpoint()` function to restrict access based on the JWT subject:

```typescript
import { authorizeEndpoint } from "../lib/auth"
import type { Context } from "hono"

export class DocumentsEndpoint extends OpenAPIRoute {
  async handle(c: Context) {
    // Authorize access to the 'documents' endpoint
    // This will validate the JWT and check if the subject matches 'documents'
    return authorizeEndpoint('documents')(c, async () => {
      return c.json({ message: "Access granted to documents endpoint" })
    })
  }
}

export class PublishDocumentEndpoint extends OpenAPIRoute {
  async handle(c: Context) {
    // Authorize access to the 'documents:publish' subresource
    // This requires a JWT with subject 'documents:publish' or just 'documents'
    return authorizeEndpoint('documents', 'publish')(c, async () => {
      return c.json({ message: "Document published successfully" })
    })
  }
}
```

**How it works**:
- If the JWT subject is exactly "ENDPOINT" (e.g., "documents"), it authorizes access to all subresources
- If the JWT subject is "ENDPOINT:SUBRESOURCE" (e.g., "documents:publish"), it only authorizes that specific subresource
- The subject in the JWT is cryptographically secured and cannot be modified without invalidating the token
- The function automatically handles responses from the handler and passes them through if authorized
- Authentication and authorization errors are handled with appropriate 401/403 status codes

This allows you to create JWTs with precise permissions for different operations:
- `documents` - Full access to all document operations
- `documents:read` - Read-only access to documents
- `documents:write` - Write access to documents
- `documents:publish` - Publishing access only

### Security Features

- **Industry Standard**: Uses the `jsonwebtoken` library following JWT best practices
- **Configurable Expiration**: Support for flexible token expiration times
- **Subject-Based Authorization**: Encode all permissions and roles in the subject field
- **Multiple Token Sources**: Accepts tokens via header or query parameter
- **Proper Error Handling**: Clear error messages for different failure scenarios
- **Type Safety**: Full TypeScript support with proper type definitions

## Project Structure

```bash
dave.io/
├── dashkit/              # Dashboard widget example
│   └── feed.js           # Simple list panel implementation
├── src/                  # Main source code
│   ├── endpoints/        # API endpoint implementations
│   │   ├── ai/           # AI-related endpoints
│   │   │   ├── index.ts  # AI endpoints export
│   │   │   ├── base.ts   # Shared AI functionality
│   │   │   ├── alt-get.ts # AI alt text (GET)
│   │   │   ├── alt-post.ts # AI alt text (POST)
│   │   │   └── image-processing.ts # Image utilities
│   │   ├── auth.ts       # Authentication info endpoint
│   │   ├── dashboard.ts  # Dashboard data endpoints
│   │   ├── metrics.ts    # Metrics data endpoints
│   │   ├── ping.ts       # Simple health check endpoint
│   │   ├── redirect.ts   # URL redirection service
│   │   └── routeros.ts   # RouterOS script generators
│   ├── kv/               # KV storage operations
│   │   ├── dashboard.ts  # Dashboard KV operations
│   │   ├── redirect.ts   # Redirect KV operations
│   │   ├── routeros.ts   # RouterOS KV operations
│   │   ├── metrics.ts    # Metrics tracking in KV
│   │   └── init.ts       # KV initialization module
│   ├── lib/              # Utility libraries
│   │   ├── analytics.ts  # Request tracking via Analytics Engine
│   │   ├── auth.ts       # JWT authentication middleware
│   │   └── ip-address-utils.ts # IP address utilities
│   ├── schemas/          # Zod schema definitions
│   ├── index.ts          # Main application setup
│   └── types.ts          # Type definitions
└── wrangler.jsonc        # Cloudflare Workers configuration
```

## Storage Architecture

This API uses a unified KV namespace for all data storage needs, with a hierarchical key structure to organize different types of data.

### KV Namespace Structure

All data is stored in a single KV namespace called `DATA` with a hierarchical key structure that follows the pattern: `topic:subtopic:resource`.

- **Redirects**: Prefix `redirect:`

  - `redirect:{slug}`: URL for the given redirect slug

- **RouterOS**: Prefix `routeros:`

  - `routeros:putio:ipv4`: Cached IPv4 ranges for put.io
  - `routeros:putio:ipv6`: Cached IPv6 ranges for put.io
  - `routeros:putio:script`: Generated RouterOS script for put.io
  - `routeros:putio:metadata:last-updated`: Last update timestamp for put.io cache
  - `routeros:putio:metadata:last-error`: Last error message for put.io cache
  - `routeros:putio:metadata:last-attempt`: Last attempt timestamp for put.io cache
  - `routeros:putio:metadata:update-in-progress`: Flag indicating if update is in progress

- **Dashboard**: Prefix `dashboard:`

  - `dashboard:demo:items`: Items for the demo dashboard

- **Metrics**: Prefix `metrics:`
  - `metrics:status:{code}`: Status code occurrence counter
  - `metrics:group:{group}`: Status code group counter (4xx, 5xx)
  - `metrics:routeros:cache-resets`: Count of cache resets
  - `metrics:routeros:cache-hits`: Count of cache hits
  - `metrics:routeros:cache-misses`: Count of cache misses
  - `metrics:routeros:last-accessed`: Timestamp of last access
  - `metrics:routeros:last-refresh`: Timestamp of last refresh
  - `metrics:routeros:refresh-count`: Count of refreshes
  - `metrics:routeros:last-reset`: Timestamp of last reset
  - `metrics:routeros:reset-count`: Count of resets
  - `metrics:redirect:{slug}:count`: Count of redirects for a slug
  - `metrics:redirect:{slug}:last-accessed`: Timestamp of last access for a slug

### KV Initialization

The API automatically initializes all KV stores at startup with empty or zero values for any keys that don't exist. This ensures that all code paths can safely handle empty states without errors.

- Empty arrays are initialized for lists (e.g., IP ranges)
- Default metadata values are created with empty strings for timestamps
- Metrics counters are initialized to zero
- Empty strings are used for cached data

Implementation details:

```typescript
// KV initialization (runs at application startup)
app.use("*", async (c, next) => {
  try {
    // Initialize KV with default values
    await initializeKV(c.env);
  } catch (error) {
    console.error("Error initializing KV store:", error);
  }

  // Continue with request handling
  await next();
});
```

Benefits of this unified KV approach:

- **Organization**: Logical grouping of related data
- **Simplified Management**: Single KV binding to manage across all endpoints
- **Flexible Expansion**: Easy to add new data types and providers
- **Resource Efficiency**: Reduces the number of KV namespaces needed
- **Analytics Integration**: Built-in tracking for metrics and usage patterns
- **Robustness**: Safe handling of empty or non-existent KV values
- **Granularity**: Individual keys for metrics and metadata improve readability and make direct manipulation easier

Implementation details:

```typescript
// Reading from KV (individual keys)
const count = await env.DATA.get(`metrics:redirect:${slug}:count`);

// Writing to KV with hierarchical keys
await env.DATA.put(`routeros:putio:script`, script, { expirationTtl: 7200 });

// Tracking usage metrics with individual keys
await Promise.all([
  env.DATA.put(`metrics:redirect:${slug}:count`, count.toString()),
  env.DATA.put(
    `metrics:redirect:${slug}:last-accessed`,
    new Date().toISOString(),
  ),
]);
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.14 or compatible)
- [Node.js](https://nodejs.org/) (LTS version)
- [mise](https://mise.jdx.dev/) for environment management (optional)

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/daveio/dave.io.git
cd dave.io
```

2. Install dependencies:

```bash
bun install
```

3. Start the development server:

```bash
bun run dev
```

### Cloudflare Workers Types

The project uses TypeScript types from the auto-generated `worker-configuration.d.ts` file created by Wrangler. Any changes to the Cloudflare bindings (KV namespaces, etc.) require running the type generation script:

```bash
bun run types
```

This script:

1. Generates fresh type definitions based on `wrangler.jsonc` configuration
2. Adds a `@ts-nocheck` directive to the top of the file to prevent TypeScript errors
3. Updates references in the codebase automatically

The custom `src/schemas/cloudflare.types.ts` file extends these types with project-specific additions.

### Scripts

- `bun run dev`: Start development server
- `bun run deploy`: Deploy to Cloudflare Workers
- `bun run types`: Generate type definitions for Cloudflare Workers
- `bun run typecheck`: Run TypeScript type checking
- `bun run lint`: Run linting with Trunk and Biome
- `bun run format`: Format code with Trunk
- `bun run jwt`: Generate JWT tokens for authentication
- `bun kv`: Run KV backup/restore utility

### KV Admin Utility

The project includes a command-line utility for managing KV storage via the Cloudflare SDK:

```bash
# Backup KV data matching configured patterns to _backup/kv-{timestamp}.json (default)
bun run bin/kv backup

# Backup all KV data to _backup/kv-{timestamp}.json
bun run bin/kv backup --all

# Restore KV data from a backup file
bun run bin/kv restore <filename>

# Wipe all KV data (DANGEROUS!)
bun run bin/kv wipe
```

**Environment Requirements:**

```bash
# Required environment variables
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
export CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

This utility uses the Cloudflare SDK directly (no longer relies on Wrangler CLI) and helps ensure data safety by allowing you to create regular backups of KV storage data, as well as restore from backups and completely wipe the KV namespace if needed. The wipe function includes multiple confirmation prompts to prevent accidental data loss.

#### Backup Configuration

By default, the backup command only includes keys matching specific patterns:

- Keys that exactly match `dashboard:demo:items`
- Keys that start with `redirect:`

You can modify these patterns by editing the `BACKUP_KEY_PATTERNS` array in `bin/kv.ts`:

```typescript
// Configure the key patterns to include in the backup (using regular expressions)
const BACKUP_KEY_PATTERNS = [
  /^dashboard:demo:items$/, // Exact match for "dashboard:demo:items"
  /^redirect:.*$/, // All keys starting with "redirect:"
];
```

Use the `--all` or `-a` flag to back up all keys regardless of pattern.

#### Value Handling

The KV Admin utility intelligently handles different value types:

- **String values** are stored and restored as plain strings without additional quotes
- **JSON values** (objects, arrays, numbers, booleans, null) are properly serialized and deserialized
- **Backup files** contain a mix of raw strings and JSON objects as appropriate
- **Restore operations** maintain the correct type of each value

This smart type handling ensures that string values like URLs and timestamps don't get double-quoted, while complex data structures like dashboard items are properly preserved.

## DashKit Integration

The project includes a simple DashKit widget in the `dashkit/` directory that demonstrates how to connect to the API and display data from the demo dashboard.

## Deployment

The API is deployed to Cloudflare Workers using Wrangler. Deployment is automated via GitHub Actions when changes are pushed to the main branch. It's accessible at:

- `https://dave.io/api`

### CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- **CI**: Runs linting and type checking on pull requests and pushes to main

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Dave Williams ([@daveio](https://github.com/daveio)) - [dave@dave.io](mailto:dave@dave.io)

## Schemas

The project uses Zod for schema validation and OpenAPI documentation. All schemas are defined in the `/src/schemas` directory, with each schema file having a corresponding `.schema.ts` suffix.

The project uses comprehensive Zod schemas for all endpoints, providing:

- **Request Validation**: All incoming requests are validated against schemas
- **Response Documentation**: Detailed response schemas for OpenAPI documentation
- **Type Safety**: Full TypeScript integration with automatic type inference
- **Error Handling**: Consistent error response formats across all endpoints

Each endpoint extends `OpenAPIRoute` from Chanfana and includes a `schema` property that defines:
- Request parameters and body validation
- Response formats and status codes
- Endpoint tags, summaries, and descriptions
- Security requirements (JWT authentication)

## Notes

Testing `/ai/alt` via POST - set `$jwt` and `$img` up front:

```fish
begin
set -l jwt JWTDATA && \
set -l img IMAGEPATH && \
curl -X POST "https://dave.io/api/ai/alt" \
    -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -d "{\"image\": \"data:image/jpeg;base64,$(base64 < $img | tr -d '\n')\"}" | jq .
end
```
