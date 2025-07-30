# Project Structure

## Root Directory Organization

```plaintext
.
├── README.md               # Project overview and instructions
├── package.json            # Project dependencies and scripts
├── nuxt.config.ts          # Nuxt configuration file
├── app/                    # Nuxt application code
├── server/                 # Server-side API and utilities
├── bin/                    # CLI tools and scripts
├── test/                   # Test suites
├── types/                  # TypeScript type definitions
├── data/                   # Static data and initialization files
├── public/                 # Static assets served directly
├── .kiro/                  # Kiro AI assistant configuration
└── config files            # Various configuration files
```

## App Directory (`app/`)

Frontend application structure following Nuxt 4 conventions:

- `app/components/` - Vue components organized by feature
  - `api/` - API-related components
  - `gender/` - Gender-specific content components
  - `layout/` - Layout components
  - `pages/` - Page-specific components
  - `ui/` - Reusable UI components
- `app/pages/` - File-based routing pages
- `app/composables/` - Vue composables for shared logic
- `app/plugins/` - Nuxt plugins
- `app/assets/css/` - Stylesheets and CSS files

## Server Directory (`server/`)

Backend API and server utilities:

- `server/api/` - API endpoint handlers
  - `ai/` - AI service endpoints (alt, social, word)
  - `dashboard/` - Dashboard-related endpoints
  - `token/` - JWT token management endpoints
- `server/middleware/` - Request processing middleware
- `server/routes/` - Server-side routes (redirects)
- `server/utils/` - Shared server utilities and schemas

## Key Server Utilities

- `auth.ts` - JWT authentication and authorization
- `schemas.ts` - Zod validation schemas and types
- `response.ts` - Standardized API response handling
- `cloudflare.ts` - Cloudflare service integrations
- `ai-helpers.ts` - AI service utilities

## CLI Tools (`bin/`)

Development and management scripts:

- `jwt.ts` - JWT token management
- `kv.ts` - KV storage operations
- `d1.ts` - D1 database operations
- `api.ts` - API testing utilities
- `openapi.ts` - OpenAPI spec generation

## Testing (`test/`)

Test files organized by feature:

- Unit tests for utilities and helpers
- API integration tests
- Authentication and authorization tests
- Response validation tests

## Configuration Files

- `nuxt.config.ts` - Nuxt framework configuration
- `wrangler.jsonc` - Cloudflare Workers deployment config
- `tailwind.config.ts` - Tailwind CSS configuration
- `vitest.config.ts` - Testing framework configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Naming Conventions

### Files and Directories

- Use kebab-case for file names: `api-helpers.ts`
- Use PascalCase for Vue components: `ApiContent.vue`
- Use camelCase for TypeScript files: `pageSetup.ts`

### API Endpoints

- RESTful naming: `/api/ai/social`, `/api/token/{uuid}`
- Use HTTP verbs appropriately (GET, POST, PUT, DELETE)
- Group related endpoints in subdirectories

### Components

- Feature-based organization in subdirectories
- Descriptive names indicating purpose: `GenderPageHeader.vue`
- Shared UI components in `ui/` directory

## Import Patterns

- Use absolute imports with `~/` prefix for project root
- Import types separately from values when possible
- Group imports: external libraries, internal modules, types

## Environment-Specific Files

- `.env` - Local environment variables
- `.dev.vars` - Cloudflare Workers local development secrets
- `data/kv/_init.yaml` - KV storage initialization data

## Build Artifacts

Generated files (excluded from version control):

- `.nuxt/` - Nuxt build cache and generated files
- `.output/` - Production build output
- `coverage/` - Test coverage reports
- `node_modules/` - Dependencies
