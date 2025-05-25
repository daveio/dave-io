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
    const payload = jwt.verify(token, secret) as JWTPayload
    return payload
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
