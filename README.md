# api.dave.io

A multipurpose personal API powered by Cloudflare Workers.

![License](https://img.shields.io/github/license/daveio/api.dave.io)

## Overview

This project implements a multipurpose personal API that runs on Cloudflare Workers, providing several endpoints for various services:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations (currently implements put.io IP ranges)
- **Metrics**: View API metrics in JSON, YAML, or Prometheus format
- **Authentication**: JWT-based authentication system with scope-based authorization

The API is built with [Hono](https://hono.dev/) and uses [Chanfana](https://github.com/cloudflare/chanfana) for OpenAPI documentation and schema validation.

## Features

- **OpenAPI Documentation**: Auto-generated API docs available at `/api/docs` and `/api/redocs`
- **Type-Safe Development**: Built with TypeScript and Zod for runtime type validation
- **Cloudflare Integration**:
  - KV Namespace for unified data storage
  - Analytics Engine for request tracking and detailed analytics
  - Automatic deployment via Wrangler
- **Metrics Tracking**: Monitors error rates and status codes via KV storage
- **Error Monitoring**: All non-success/non-redirect responses are tracked for debugging
- **KV Backup/Restore**: Command-line tools for data management
- **Multiple Output Formats**: Support for JSON, YAML, and Prometheus metrics formats
- **JWT Authentication**: Secure token-based authentication with configurable scopes
- **CLI Tools**: Built-in utilities for JWT token generation and KV management

## Endpoints

### Ping

- `GET /ping` or `GET /api/ping`: Simple health check endpoint
- Returns: `{ "service": "api", "response": "pong" }`

### Redirect

- `GET /redirect/:slug` or `GET /api/redirect/:slug`: Get URL for a redirect by slug
- Returns: Redirect information or 404 if not found

### Dashboard

- `GET /dashboard/:name` or `GET /api/dashboard/:name`: Get dashboard data by name
- Supported dashboards:
  - `demo`: Sample dashboard data
  - `hacker-news`: Latest stories from Hacker News RSS feed

### RouterOS

- `GET /routeros/putio` or `GET /api/routeros/putio`: Generate RouterOS script for put.io IP ranges
- Returns: RouterOS script for creating address lists for put.io IPv4 and IPv6 ranges
- `GET /routeros/cache` or `GET /api/routeros/cache`: Get cache status for RouterOS data
- Returns: Cache status information including age and any errors
- `GET /routeros/reset` or `GET /api/routeros/reset`: Reset the cache for RouterOS data
- Returns: Confirmation of cache reset

### Metrics

- `GET /metrics` or `GET /api/metrics`: Default metrics endpoint (returns JSON)
- `GET /metrics/json` or `GET /api/metrics/json`: Get metrics data in JSON format
- `GET /metrics/yaml` or `GET /api/metrics/yaml`: Get metrics data in YAML format
- `GET /metrics/prometheus` or `GET /api/metrics/prometheus`: Get metrics data in Prometheus format
- Returns: Metrics tracked in KV storage, including:
  - Status code counts (`metrics:status:xxx`)
  - Status code group counts (`metrics:group:xxx`)
  - RouterOS cache metrics
  - Other application-specific metrics

### Authentication

- `GET /auth/test` or `GET /api/auth/test`: Test endpoint for JWT authentication
- Requires: Valid JWT token with `read` scope
- Returns: Authentication success message with user info
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

The API includes a robust JWT authentication system with scope-based authorization for protecting sensitive endpoints.

### Quick Start

1. **Set JWT Secret**: Configure your JWT secret as a Cloudflare Workers secret:
   ```bash
   # For production
   bun run wrangler secret put JWT_SECRET

   # For local development, add to .env file
   JWT_SECRET=your-super-secret-key-here
   ```

2. **Generate a Token**: Use the built-in CLI tool:
   ```bash
   # Interactive mode (recommended)
   bun run jwt --interactive

   # Command line mode
   bun run jwt --sub "user123" --scopes "read,metrics" --expires "24h"
   ```

3. **Test Authentication**:
   ```bash
   # Using Bearer token
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://api.dave.io/auth/test # trunk-ignore(gitleaks/curl-auth-header)

   # Using query parameter
   curl "https://api.dave.io/auth/test?token=YOUR_JWT_TOKEN"
   ```

### Available Scopes

The authentication system supports fine-grained permissions using scopes:

- `read`: General read access to protected endpoints
- `write`: General write access to protected endpoints
- `admin`: Administrative access with elevated permissions
- `metrics`: Access to metrics endpoints and data
- `routeros`: Access to RouterOS script generation endpoints
- `dashboard`: Access to dashboard data endpoints
- `redirect`: Access to redirect management endpoints

### Token Usage

JWT tokens can be provided in two ways:

1. **Authorization Header** (recommended):
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://api.dave.io/endpoint # trunk-ignore(gitleaks/curl-auth-header)
   ```

2. **Query Parameter**:
   ```bash
   curl "https://api.dave.io/endpoint?token=YOUR_JWT_TOKEN"
   ```

### JWT CLI Tool

The included JWT generation tool (`bun run jwt`) supports both interactive and command-line modes:

**Interactive Mode:**
```bash
bun run jwt --interactive
# Prompts for user ID, scopes, expiration, and secret
```

**Command Line Mode:**
```bash
# Basic usage
bun run jwt --sub "user123" --scopes "read,write" --expires "1h"

# With custom secret
JWT_SECRET=mysecret bun run jwt --sub "admin" --scopes "admin,read,write"

# Available options
bun run jwt --help
```

**CLI Options:**
- `-s, --sub <subject>`: User ID for the token
- `--scopes <scopes>`: Comma-separated list of scopes
- `-e, --expires <time>`: Token expiration (e.g., "1h", "7d", "30m")
- `--secret <secret>`: JWT secret key (or use JWT_SECRET env var)
- `-i, --interactive`: Interactive mode
- `-h, --help`: Show help message

### Authentication Responses

**Success (200):**
```json
{
  "message": "Authentication successful! You have access to this protected endpoint.",
  "user": {
    "id": "user123",
    "scopes": ["read", "metrics"]
  },
  "timestamp": "2023-12-07T10:30:00.000Z"
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

**Insufficient Permissions (403):**
```json
{
  "error": "Insufficient permissions",
  "required": ["admin"],
  "granted": ["read", "write"]
}
```

### Security Features

- **Industry Standard**: Uses the `jsonwebtoken` library following JWT best practices
- **Configurable Expiration**: Support for flexible token expiration times
- **Scope Validation**: Automatic validation of required vs. granted scopes
- **Multiple Token Sources**: Accepts tokens via header or query parameter
- **Proper Error Handling**: Clear error messages for different failure scenarios
- **Type Safety**: Full TypeScript support with proper type definitions

## Project Structure

```bash
api.dave.io/
├── dashkit/              # Dashboard widget example
│   └── feed.js           # Simple list panel implementation
├── src/                  # Main source code
│   ├── endpoints/        # API endpoint implementations
│   │   ├── auth-test.ts  # Authentication test endpoint
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
    await initializeKV(c.env)
  } catch (error) {
    console.error("Error initializing KV store:", error)
  }

  // Continue with request handling
  await next()
})
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
const count = await env.DATA.get(`metrics:redirect:${slug}:count`)

// Writing to KV with hierarchical keys
await env.DATA.put(`routeros:putio:script`, script, { expirationTtl: 7200 })

// Tracking usage metrics with individual keys
await Promise.all([
  env.DATA.put(`metrics:redirect:${slug}:count`, count.toString()),
  env.DATA.put(`metrics:redirect:${slug}:last-accessed`, new Date().toISOString())
])
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.14 or compatible)
- [Node.js](https://nodejs.org/) (LTS version)
- [mise](https://mise.jdx.dev/) for environment management (optional)

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/daveio/api.dave.io.git
   cd api.dave.io
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

The project includes a command-line utility for managing KV storage:

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

This utility helps ensure data safety by allowing you to create regular backups of KV storage data, as well as restore from backups and completely wipe the KV namespace if needed. The wipe function includes multiple confirmation prompts to prevent accidental data loss.

#### Backup Configuration

By default, the backup command only includes keys matching specific patterns:
- Keys that exactly match `dashboard:demo:items`
- Keys that start with `redirect:`

You can modify these patterns by editing the `BACKUP_KEY_PATTERNS` array in `bin/kv.ts`:

```typescript
// Configure the key patterns to include in the backup (using regular expressions)
const BACKUP_KEY_PATTERNS = [
  /^dashboard:demo:items$/, // Exact match for "dashboard:demo:items"
  /^redirect:.*$/           // All keys starting with "redirect:"
]
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

- `https://api.dave.io`
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

To learn more about the available schemas and how to use them, see the [Schemas README](/src/schemas/README.md).
