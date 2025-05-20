/// <reference path="../../worker-configuration.d.ts" />

/**
 * Type definitions for Cloudflare Workers
 *
 * This file provides project-specific extensions for Cloudflare Workers types.
 * The base types are from worker-configuration.d.ts which is auto-generated.
 */

// Export an empty object to make this a module
export {}

// Extend the existing Env interface
declare global {
  // Define additional environment variables specific to this project
  interface Env {
    GDIO_REDIRECTS: KVNamespace
  }
}
