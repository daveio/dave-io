# Schemas Directory

This directory contains all Zod schemas and TypeScript type definitions used throughout the application.

## Organization

- `index.ts` - Central export file for all schemas
- `redirect.schema.ts` - Schemas related to the URL redirection functionality
- `ping.schema.ts` - Schemas for the ping endpoint
- `dashboard.schema.ts` - Schemas for dashboard functionality
- `routeros.schema.ts` - Schemas for RouterOS related functionality
- `cloudflare.types.ts` - Type definitions for Cloudflare Workers (extends global interfaces from worker-configuration.d.ts)

## Schema Structure

Each schema file typically contains:

1. **Zod Schemas**
   - Define the structure and validation rules for request/response data
   - Used with Chanfana for OpenAPI documentation generation
   - Used for runtime validation of data

2. **TypeScript Types**
   - Generated from Zod schemas using `z.infer<typeof SchemaName>`
   - Used for type checking during development

3. **OpenAPI Integration**
   - Schemas are referenced in endpoint classes in `src/endpoints/`
   - Used to generate OpenAPI documentation available at `/api/docs` and `/api/redocs`

## OpenAPI Integration Example

```typescript
export class Redirect extends OpenAPIRoute {
  schema = {
    tags: ["Redirects"],
    summary: "Get the URL for a redirect by slug",
    request: {
      params: RedirectParamsSchema
    },
    responses: {
      "200": {
        description: "Returns the URL for a redirect",
        content: {
          "application/json": {
            schema: RedirectSchema
          }
        }
      },
      "404": {
        description: "Redirect not found"
      }
    }
  } as OpenAPIRouteSchema
}
```

## Best Practices

1. **File Naming**
   - Use the `.schema.ts` suffix for files containing Zod schemas
   - Use the `.types.ts` suffix for files containing TypeScript type definitions

2. **Schema Organization**
   - Group related schemas in the same file
   - Export a type using `z.infer<typeof SchemaName>` for TypeScript compatibility
   - Use meaningful names for schemas and types

3. **Schema Versioning**
   - Consider adding versioning for schemas that might change over time
   - Document breaking changes in schema definitions

4. **Validation**
   - Always use schema validation for input data
   - Handle validation errors gracefully
   - Include helpful error messages

## Usage Example

```typescript
// Importing schemas
import { RedirectSchema, type Redirect } from '../schemas';

// Using the schema for validation
const result = RedirectSchema.safeParse(data);
if (result.success) {
  const validatedData: Redirect = result.data;
  // Use validatedData...
} else {
  // Handle validation error
  console.error(result.error);
}
```

## Common Schema Patterns

1. **Request Schemas**
   - Define parameters, body, query parameters
   - Used for validating incoming requests

2. **Response Schemas**
   - Define response structure
   - Used for consistent API responses

3. **Error Schemas**
   - Define common error response formats
   - Used for consistent error handling
