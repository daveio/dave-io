# api.dave.io

A multipurpose personal API powered by Cloudflare Workers.

![License](https://img.shields.io/github/license/daveio/api.dave.io)

## Overview

This project implements a multipurpose personal API that runs on Cloudflare Workers, providing several endpoints for various services:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations

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

### RouterOS put.io

- `GET /routeros/putio` or `GET /api/routeros/putio`: Generate RouterOS script for put.io IP ranges
- Returns: RouterOS script for creating address lists for put.io IPv4 and IPv6 ranges
- `GET /routeros/cache` or `GET /api/routeros/cache`: Get cache status for put.io IP data
- Returns: Cache status information including age and any errors
- `GET /routeros/reset` or `GET /api/routeros/reset`: Reset the cache for put.io IP data
- Returns: Confirmation of cache reset

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

## DashKit Integration

The project includes a simple DashKit widget in the `dashkit/` directory that demonstrates how to connect to the API and display data from the demo dashboard.

## Deployment

The API is deployed to Cloudflare Workers using Wrangler. It's accessible at:

- [api.dave.io](https://api.dave.io)
- [dave.io/api/\*](https://dave.io/api/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Dave Williams ([@daveio](https://github.com/daveio)) - [dave@dave.io](mailto:dave@dave.io)
