import type { Context } from "hono"
import jwt from "jsonwebtoken"

export interface JWTPayload {
  sub: string
  scopes: string[]
  iat: number
  exp: number
}

export interface AuthorizedContext extends Context {
  user: {
    id: string
    scopes: string[]
  }
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["ES256"] }) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

export function extractTokenFromRequest(c: Context): string | null {
  const authHeader = c.req.header("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  const bodyToken = c.req.query("token")
  if (bodyToken) {
    return bodyToken
  }

  return null
}

export function createJWTMiddleware(requiredScopes: string[] = []) {
  return async (c: Context, next: () => Promise<void>) => {
    const jwtSecret = c.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable not set")
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

    if (requiredScopes.length > 0) {
      const hasRequiredScope = requiredScopes.some((scope) => payload.scopes.includes(scope))
      if (!hasRequiredScope) {
        return c.json(
          {
            error: "Insufficient permissions",
            required: requiredScopes,
            granted: payload.scopes
          },
          403
        )
      }
    }
    ;(c as AuthorizedContext).user = {
      id: payload.sub,
      scopes: payload.scopes
    }

    await next()
  }
}

export function requireAuth(scopes: string[] = []) {
  return createJWTMiddleware(scopes)
}
