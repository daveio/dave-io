# Schemas Directory

This directory contains all Zod schemas and TypeScript type definitions used throughout the application.

## Organization

- `index.ts` - Central export file for all schemas
- `redirect.schema.ts` - Schemas related to the URL redirection functionality
- `cloudflare.types.ts` - Type definitions for Cloudflare Workers (extends global interfaces from worker-configuration.d.ts)

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
