import type { RouteConfig } from "@asteasolutions/zod-to-openapi"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

// Global registry for endpoint metadata
const endpointRegistry = new Map<string, RouteConfig>()

/**
 * Register an endpoint with its OpenAPI metadata
 * @param path The API path (e.g., "/api/images/optimise")
 * @param method The HTTP method
 * @param config The OpenAPI route configuration
 */
export function registerEndpoint(path: string, method: string, config: RouteConfig): void {
  const key = `${method.toUpperCase()} ${path}`
  endpointRegistry.set(key, config)
}

/**
 * Get all registered endpoints
 */
export function getRegisteredEndpoints(): Map<string, RouteConfig> {
  return new Map(endpointRegistry)
}

/**
 * Decorator to register endpoint metadata
 * This can be used to automatically register endpoints with their schemas
 */
export function defineApiEndpoint(path: string, method: string, config: RouteConfig) {
  return <T>(target: T): T => {
    registerEndpoint(path, method, config)
    return target
  }
}

/**
 * Helper to create route config from Zod schemas
 */
export function createRouteConfig(options: {
  tags: string[]
  summary: string
  description: string
  security?: Array<Record<string, string[]>>
  parameters?: Array<{
    name: string
    in: "query" | "path" | "header"
    required?: boolean
    description?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any
  }>
  requestBody?: {
    required?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: Record<string, { schema: any }>
  }
  responses: Record<
    string,
    {
      description: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content?: Record<string, { schema: any }>
    }
  >
}): RouteConfig {
  return {
    method: "get", // Will be overridden by registerEndpoint
    path: "", // Will be overridden by registerEndpoint
    ...options
  } as RouteConfig
}
