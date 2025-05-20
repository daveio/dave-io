# api.dave.io

A multipurpose personal API powered by Cloudflare Workers.

![License](https://img.shields.io/github/license/daveio/api.dave.io)

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
  - KV Namespaces for redirect storage
  - Analytics Engine for request tracking
  - Durable Objects for caching
  - Automatic deployment via Wrangler

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

No personal information is stored. Analytics are used for monitoring service usage and debugging.

## Project Structure

```bash
api.dave.io/
├── dashkit/              # Dashboard widget example
│   └── feed.js           # Simple list panel implementation
├── src/                  # Main source code
│   ├── durable-objects/  # Durable Object implementations
│   │   └── routeros-cache.ts # Cache for RouterOS data
│   ├── endpoints/        # API endpoint implementations
│   │   ├── dashboard.ts  # Dashboard data endpoints
│   │   ├── ping.ts       # Simple health check endpoint
│   │   ├── redirect.ts   # URL redirection service
│   │   └── routeros.ts   # RouterOS script generators
│   ├── lib/              # Utility libraries
│   │   └── ip-address-utils.ts # IP address utilities
│   ├── schemas/          # Zod schema definitions
│   ├── index.ts          # Main application setup
│   └── types.ts          # Type definitions
└── wrangler.jsonc        # Cloudflare Workers configuration
```

## Durable Objects

### What are Durable Objects?

Durable Objects are a feature of Cloudflare Workers that provide:

- **Global Uniqueness**: Only one instance of a particular Durable Object exists across the entire Cloudflare network
- **Automatic Persistence**: State can be stored and persisted without external databases
- **Transactional Storage**: Provides atomic operations for data consistency
- **Low Latency**: Objects run close to users for optimal performance

Unlike regular Cloudflare Workers which are ephemeral and stateless, Durable Objects maintain state between requests and provide coordination capabilities for distributed systems.

### RouterOSCache Durable Object

The `RouterOSCache` Durable Object in this project demonstrates these capabilities by:

1. **Caching IP Ranges**: Fetches IP address ranges from RIPE and BGPView APIs for put.io services
2. **Processing Data**: Merges and optimizes IP ranges for efficient firewall configurations
3. **Generating Scripts**: Creates RouterOS scripts for easy network configuration
4. **Persisting State**: Stores cached data with automatic persistence
5. **Managing Freshness**: Refreshes data when it becomes stale (older than 1 hour)

#### How It Works

The RouterOSCache Durable Object:

- Uses `state.storage` to persist cache data between requests
- Refreshes data by fetching from external APIs (RIPE and BGPView)
- Processes and merges IP ranges using utility functions
- Generates RouterOS firewall configuration scripts
- Exposes HTTP endpoints for interaction

#### Storage Configuration and Alternatives

Durable Objects can use different storage backends, each with their own characteristics:

##### Current Configuration: Native Durable Object Storage

This project uses Cloudflare's native Durable Object storage, which is the default built-in storage mechanism. This storage provides:

- **Strong Consistency**: Immediate visibility of updates
- **Transactional Operations**: Multiple operations can be performed atomically
- **High Write Performance**: Optimized for frequent writes
- **Local Storage**: Data is stored close to where the Durable Object runs
- **List Operations**: Support for listing keys with prefix matching

In the `RouterOSCache` implementation, we use the Durable Object storage through the `state.storage` API:

```typescript
// Example of storing data in Durable Object storage
await this.state.storage.put("cacheData", this.cacheData);

// Example of retrieving data from Durable Object storage
const storedData = await this.state.storage.get("cacheData");
```

##### Alternative: KV Storage Backend

Cloudflare's Key-Value (KV) storage could be used as an alternative, offering:

- **Globally Distributed**: Data is replicated across Cloudflare's network
- **Eventually Consistent**: Updates propagate across the network over time
- **High Read Performance**: Optimized for frequent reads
- **Simple API**: Similar key-value operations
- **Cost-Effective**: Lower cost for basic storage needs

To use KV storage instead, you would need to:
1. Create a KV namespace in the Cloudflare dashboard
2. Add KV bindings to your Worker
3. Write custom code to use the KV namespace instead of `state.storage`

### Why Use Durable Objects?

#### Advantages Over Direct KV or D1 Usage

While KV, R2, and D1 provide storage capabilities, Durable Objects offer unique advantages that make them ideal for certain use cases:

1. **Compute + Storage Together**: Durable Objects combine storage with compute in a single unit, allowing for complex operations to occur close to the data.

2. **Singleton Coordination**: Each Durable Object instance is guaranteed to be unique globally, making them perfect for coordination tasks like:
   - Rate limiting
   - Distributed locking
   - Leader election
   - State machine management

3. **Atomic Operations**: Multiple storage operations can be performed atomically within a Durable Object, which is difficult to achieve with KV alone.

4. **In-Memory State**: Durable Objects can maintain state in memory between requests for high-performance operations, persisting only what's necessary.

5. **Reduced Latency**: By co-locating compute with storage, operations that would require multiple round-trips with separate storage services can be performed in a single request.

6. **Simpler Concurrency Model**: The "one instance per ID" model simplifies concurrency handling by eliminating many distributed systems problems.

#### Specific Use Cases Where Durable Objects Excel

- **Real-time Counters**: When you need accurate, up-to-date counts (unlike KV's eventual consistency)
- **Stateful APIs**: APIs that need to maintain session state or complex workflows
- **Coordination Services**: When multiple clients need central coordination
- **Cache with Complex Logic**: When your cache needs preprocessing, merging, or conditional updates (as in our RouterOSCache)
- **API Rate Limiting**: For accurate global rate limiting across a distributed system

#### Example: RouterOSCache Benefits

The RouterOSCache implementation benefits from being a Durable Object because:

1. It needs to fetch, process, and merge data from multiple external APIs
2. The data requires transformation before storage (merging IP ranges)
3. Cache invalidation logic needs to be centralized
4. A single global cache instance ensures all users get consistent results
5. The processing logic is co-located with the storage, simplifying the architecture

Using just KV or D1 would require separate Workers to handle the data processing, leading to more complex architecture and potentially higher latency.

#### Durable Object Endpoints

The Durable Object exposes three main endpoints:

- **`/script`**: Returns a generated RouterOS script with the latest IP ranges
- **`/status`**: Returns cache status information (age, staleness, counts)
- **`/reset`**: Forces a cache reset and refresh (POST method required)

#### Interacting with the Durable Object

The RouterOSCache Durable Object is accessed through the API's RouterOS endpoints:

```typescript
// Example of how the main API accesses the Durable Object
app.get("/routeros/putio", async (c) => {
  // Get a stub for the RouterOSCache Durable Object
  const id = c.env.ROUTEROS_CACHE.idFromName("putio");
  const obj = c.env.ROUTEROS_CACHE.get(id);

  // Forward the request to the Durable Object
  return await obj.fetch("/script");
});
```

To use the RouterOSCache:

1. **Get RouterOS Script**: `GET /api/routeros/putio`
2. **Check Cache Status**: `GET /api/routeros/cache`
3. **Reset Cache**: `POST /api/routeros/reset`

#### Benefits of Using Durable Objects

The RouterOSCache implementation showcases several benefits:

- **Reduced API Load**: External APIs are called only when necessary
- **Global Consistency**: All users get the same data worldwide
- **Improved Performance**: Responses are served from cache rather than fetching data every time
- **Automatic Persistence**: No need to set up external databases
- **Built-in Coordination**: No race conditions when multiple requests arrive simultaneously

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

### Scripts

- `bun run dev`: Start development server
- `bun run deploy`: Deploy to Cloudflare Workers
- `bun run cf-typegen`: Generate type definitions for Cloudflare Workers
- `bun run typecheck`: Run TypeScript type checking
- `bun run lint`: Run linting with Trunk
- `bun run format`: Format code with Trunk

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
