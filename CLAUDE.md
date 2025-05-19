# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

api.dave.io is a multipurpose personal API powered by Cloudflare Workers. It provides several endpoints:

- **Ping**: Simple health check endpoint
- **Redirect**: URL redirection service using KV storage
- **Dashboard**: Data feeds for dashboards (demo and Hacker News available)
- **RouterOS**: Generates RouterOS scripts for network configurations (put.io IP ranges)

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

# Lint code with Trunk
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
2. **Durable Objects**: Located in `src/durable-objects/`

   - Used for caching data with persistence
   - PutIOCacheDO: Caches IP range data for the RouterOS put.io endpoint
3. **Cloudflare Integration**:

   - KV Namespaces: Used for redirect storage (`GDIO_REDIRECTS`)
   - Analytics Engine: Tracks requests (`ANALYTICS`)
   - Durable Objects: Caches IP data (`ROUTEROS_CACHE`)
4. **Main App Structure**:

   - `src/index.ts`: Entry point that sets up Hono app and registers routes
   - Uses Chanfana to generate OpenAPI documentation

## File Structure

- `src/` - Main source code
  - `endpoints/` - API endpoint implementations
  - `durable-objects/` - Durable Object implementations
  - `lib/` - Utility libraries
  - `schemas/` - Zod schema definitions
  - `index.ts` - Main application setup
  - `types.ts` - Type definitions
- `dashkit/` - Contains dashboard widget example
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
