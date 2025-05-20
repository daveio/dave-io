# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

api.dave.io is a multipurpose personal API powered by Cloudflare Workers. It provides several endpoints:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations (currently implements put.io IP ranges, with more providers planned)

The API is built with [Hono](https://hono.dev) and uses [Chanfana](https://github.com/cloudflare/chanfana) for OpenAPI documentation and schema validation.

## Development Commands

### Setup and Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Generate Cloudflare Workers type definitions
bun run cf-typegen

# Deploy to Cloudflare Workers
bun run deploy

# Run TypeScript type checking
bun run typecheck

# Lint code with Trunk and other linters
bun run lint

# Format code with Trunk
bun run format
```

## Code Architecture

- **Framework**: Uses Hono.js for routing and HTTP server functionality
- **API Documentation**: Uses Chanfana (OpenAPI) for documentation and schema validation
- **Type Safety**: Uses TypeScript and Zod for runtime type validation
- **Schema Organization**: Schemas are defined in `src/schemas/` directory using Zod

### Key Components

1. **Endpoints**: Located in `src/endpoints/`

   - Each endpoint is implemented as a class extending `OpenAPIRoute` from Chanfana
   - Endpoints define their schema (for OpenAPI docs) and handling logic
   - Each endpoint has a consistent structure:
     - `schema`: Defines the OpenAPI documentation and Zod validation schema
     - `handle(c: Context)`: Processes the request and returns a response
2. **Durable Objects**: Located in `src/durable-objects/`

   - Used for caching data with persistence
   - `RouterOSCache`: Caches data for the RouterOS endpoints (currently used for put.io IP ranges)
   - Implements fetch handler and storage operations
3. **Cloudflare Integration**:

   - KV Namespaces: Used for redirect storage (`GDIO_REDIRECTS`)
   - Analytics Engine: Tracks requests (`ANALYTICS`)
     - Each endpoint writes a data point with relevant information
     - Indexes are used for categorizing data points by endpoint type
   - Durable Objects: Caches IP data (`ROUTEROS_CACHE`)
4. **Main App Structure**:

   - `src/index.ts`: Entry point that sets up Hono app and registers routes
   - Uses Chanfana to generate OpenAPI documentation
5. **Utility Libraries**:

   - `src/lib/ip-address-utils.ts`: Custom IP address utilities for parsing and processing IP ranges
   - Preferred over external dependencies for better control and worker compatibility

## File Structure

- `src/` - Main source code
  - `endpoints/` - API endpoint implementations
    - `ping.ts` - Simple health check endpoint
    - `redirect.ts` - URL redirection service
    - `dashboard.ts` - Dashboard data feed endpoints
    - `routeros.ts` - RouterOS script generator endpoints
  - `durable-objects/` - Durable Object implementations
    - `routeros-cache.ts` - Cache implementation for RouterOS data
  - `lib/` - Utility libraries
    - `ip-address-utils.ts` - IP address utilities
  - `schemas/` - Zod schema definitions
    - `redirect.schema.ts` - Schemas for redirect functionality
    - `cloudflare.types.ts` - Type definitions for Cloudflare-specific objects
  - `index.ts` - Main application setup
  - `types.ts` - Type definitions
- `dashkit/` - Contains dashboard widget example
  - `feed.js` - Simple list panel implementation for dashboards
- `wrangler.jsonc` - Cloudflare Workers configuration

## Environment Setup

- The project uses [Bun](https://bun.sh/) (v1.2.13 or compatible) as the package manager and runtime
- [mise](https://mise.jdx.dev/) is used for environment management (optional)
- Environment variables are loaded from `.env` file when mise is active

## Notes for Development

- The API is accessible at `api.dave.io` and `dave.io/api/*` when deployed
- Biome is used for code formatting and linting through Trunk
- CI/CD is implemented via GitHub Actions (`.github/workflows/`)
- For local development, the API runs on localhost with the port shown in the terminal when running `bun run dev`
- Always run `bun run typecheck` and `bun run lint` before submitting changes
- When adding new endpoints:
  1. Create a new file in `src/endpoints/`
  2. Implement a class extending `OpenAPIRoute` with schema and handle method
  3. Register the endpoint in `src/index.ts` using both direct and `/api/` prefixed paths
  4. Include appropriate analytics tracking using `c.env.ANALYTICS.writeDataPoint()`
