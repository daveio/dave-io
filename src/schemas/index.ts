/**
 * Central export file for all Zod schemas
 *
 * This file exports all schemas from the schema directory,
 * making it easier to import them elsewhere in the codebase.
 */

// Export all schemas
export * from "./redirect.schema"

// Export Cloudflare types
export * from "./cloudflare.types"

// Note: Cloudflare types extend global interfaces, so they don't need
// to be explicitly imported in most cases, they're available globally

// We can remove the following line once all schemas are migrated
// export * from '../types';  // Temporary until schemas are migrated
