import type { H3Event } from "h3"
import { authorizeEndpoint } from "./auth"
import type { AuthResult } from "./auth"
import { createApiError } from "./response"

/**
 * Simplified authorization wrapper that handles the common pattern:
 * 1. Call authorizeEndpoint
 * 2. Check success
 * 3. Throw error if failed
 */
export async function requireAuth(event: H3Event, endpoint: string, subResource?: string): Promise<AuthResult> {
  const authFunc = await authorizeEndpoint(endpoint, subResource)
  const auth = await authFunc(event)

  if (!auth.success) {
    throw createApiError(401, auth.error || "Unauthorized")
  }

  return auth
}

/**
 * Convenience functions for common authorization patterns
 */
export const requireAPIAuth = (event: H3Event, resource?: string) => requireAuth(event, "api", resource)

export const requireAIAuth = (event: H3Event, resource?: string) => requireAuth(event, "ai", resource)

export const requireDashboardAuth = (event: H3Event, resource?: string) => requireAuth(event, "dashboard", resource)

export const requireAdminAuth = (event: H3Event) => requireAuth(event, "admin")
