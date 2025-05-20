# api.dave.io

A multipurpose personal API powered by Cloudflare Workers.

![License](https://img.shields.io/github/license/daveio/api.dave.io)

## URGENT PLANS

- Fix sexmap redirect
- Fix toddo redirect

## Overview

This project implements a multipurpose personal API that runs on Cloudflare Workers, providing several endpoints for various services:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations (currently implements put.io IP ranges)

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

## Project Structure

```bash
api.dave.io/
├── dashkit/              # Dashboard widget example
│   └── feed.js           # Simple list panel implementation
├── src/                  # Main source code
│   ├── endpoints/        # API endpoint implementations
│   │   ├── dashboard.ts  # Dashboard data endpoints
│   │   ├── ping.ts       # Simple health check endpoint
│   │   ├── redirect.ts   # URL redirection service
│   │   └── routeros.ts   # RouterOS script generators
│   ├── kv/               # KV storage operations
│   │   ├── redirect.ts   # Redirect KV operations
│   │   └── routeros.ts   # RouterOS KV operations
│   ├── lib/              # Utility libraries
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
  - `routeros:putio:metadata`: Provider-specific metadata for put.io

- **Dashboard**: Prefix `dashboard:`
  - `dashboard:demo:items`: Items for the demo dashboard

- **Metrics**: Prefix `metrics:`
  - `metrics:status:{code}`: Status code occurrence counter
  - `metrics:group:{group}`: Status code group counter (4xx, 5xx)
  - `metrics:routeros`: Shared metrics for all RouterOS endpoints
  - `metrics:redirect:{slug}`: Click tracking data for redirect slugs

### KV Initialization

The API automatically initializes all KV stores at startup with empty or zero values for any keys that don't exist. This ensures that all code paths can safely handle empty states without errors.

- Empty arrays are initialized for lists (e.g., IP ranges)
- Default metadata objects are created with `null` values for timestamps
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

Implementation details:

```typescript
// Reading from KV
const redirect = await env.DATA.get(`redirect:${slug}`)

// Writing to KV with hierarchical keys
await env.DATA.put(`routeros:putio:script`, script, { expirationTtl: 7200 })

// Tracking usage metrics
await env.DATA.put(`metrics:redirect:${slug}`, JSON.stringify({
  count: 42,
  lastAccessed: new Date().toISOString()
}))
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.13 or compatible)
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
- `bun run lint`: Run linting with Trunk
- `bun run format`: Format code with Trunk
- `bun kv`: Run KV backup/restore utility

### KV Admin Utility

The project includes a command-line utility for backing up and restoring KV data:

```bash
# Backup all KV data to _backup/kv-{timestamp}.json
bun kv backup

# Restore KV data from a backup file
bun kv restore <filename>
```

This utility helps ensure data safety by allowing you to create regular backups of all KV storage data.

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
