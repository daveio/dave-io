import type { Context } from "hono"
import jwt from "jsonwebtoken"

export interface JWTPayload {
  sub: string
  iat: number
  exp: number
}

export interface AuthorizedContext extends Context {
  user: {
    id: string
  }
}

export function extractTokenFromRequest(c: Context): string | null {
  // Try Authorization header first
  const authHeader = c.req.header("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  // Try query parameter as fallback
  const tokenParam = c.req.query("token")
  if (tokenParam) {
    return tokenParam
  }

  return null
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

export function createJWTMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const jwtSecret = c.env.API_JWT_SECRET
    if (!jwtSecret) {
      console.error("API_JWT_SECRET environment variable not set")
      return c.json({ error: "Authentication not configured" }, 500)
    }

    const token = extractTokenFromRequest(c)
    if (!token) {
      return c.json({ error: "Authentication required" }, 401)
    }

    const payload = await verifyJWT(token, jwtSecret)
    if (!payload) {
      return c.json({ error: "Invalid token" }, 401)
    }

    if (Date.now() / 1000 > payload.exp) {
      return c.json({ error: "Token expired" }, 401)
    }
    ;(c as AuthorizedContext).user = {
      id: payload.sub
    }

    await next()
  }
}

export function requireAuth() {
  return createJWTMiddleware()
}

/**
 * Creates a middleware that authorizes access based on JWT subject matching
 * the specified endpoint and optional subresource.
 *
 * If the JWT subject is exactly "ENDPOINT", it authorizes access to all subresources.
 * If the JWT subject is "ENDPOINT:SUBRESOURCE", it only authorizes that specific subresource.
 *
 * Usage:
 * ```
 * app.get('/api/documents', authorizeEndpoint('documents'), (c) => { ... })
 * app.get('/api/documents/:id', authorizeEndpoint('documents', 'read'), (c) => { ... })
 * ```
 *
 * @param endpoint The main endpoint identifier
 * @param subresource Optional subresource identifier
 * @returns A middleware that checks JWT authorization
 */
export function authorizeEndpoint(endpoint: string, subresource?: string) {
  const authMiddleware = requireAuth()

  return async <T>(c: Context, handler: () => Promise<T>): Promise<Response | T> => {
    // Store the original response status to detect if auth middleware set an error
    const originalStatus = c.res.status
    let result: T | undefined

    // Run the standard JWT auth middleware first
    await authMiddleware(c, async () => {
      // If we get here, JWT is valid and user is authenticated
      // Now check if the subject in the JWT matches our endpoint requirements
      const authorizedC = c as AuthorizedContext
      const subject = authorizedC.user.id

      const fullResourcePattern = subresource ? `${endpoint}:${subresource}` : endpoint

      // Authorize if:
      // 1. Subject matches exactly the endpoint (grants access to all subresources)
      // 2. Subject matches exactly the endpoint:subresource pattern
      if (subject === endpoint || subject === fullResourcePattern) {
        result = await handler()
      } else {
        c.status(403)
        c.json({ error: "Not authorized for this resource" })
      }
    })

    // If authMiddleware set an error status, don't override it
    if (c.res.status !== originalStatus && c.res.status !== 200) {
      return c.res
    }

    return result as T
  }
}
