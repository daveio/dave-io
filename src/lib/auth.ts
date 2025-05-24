import { Context, MiddlewareHandler, Next } from "hono"
import * as jwt from "jsonwebtoken"
import { AuthBodySchema, AuthHeaderSchema, JwtPayload, JwtPayloadSchema } from "../schemas"
import { ZodError } from "zod"

/**
 * Interface for authentication options
 */
export interface AuthOptions {
  /**
   * Required scopes for this endpoint
   */
  scopes?: string[]
  
  /**
   * Whether to allow token in request body
   * Default: true
   */
  allowBodyToken?: boolean
}

/**
 * Default authentication options
 */
const defaultAuthOptions: AuthOptions = {
  scopes: [],
  allowBodyToken: true
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  status: 401 | 403 | 500
  
  constructor(message: string, status: 401 | 403 | 500 = 401) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

/**
 * Extract JWT token from request
 */
export const extractToken = async (c: Context, allowBodyToken = true): Promise<string | null> => {
  // Try to get token from Authorization header
  const authHeader = c.req.header("Authorization")
  if (authHeader) {
    try {
      const match = AuthHeaderSchema.parse(authHeader)
      return match.split(" ")[1]
    } catch (error) {
      // Invalid Authorization header format
      return null
    }
  }

  // Try to get token from request body if allowed
  if (allowBodyToken && c.req.method === "POST") {
    try {
      // Parse the request body as JSON
      const body = await c.req.json().catch(() => null)
      if (body && typeof body === "object") {
        const { token } = AuthBodySchema.parse(body)
        return token
      }
    } catch (error) {
      // Invalid body format or no token in body
      return null
    }
  }

  return null
}

/**
 * Verify JWT token and return payload
 */
export const verifyToken = async (token: string, secret: string): Promise<JwtPayload> => {
  try {
    // Verify the token
    const payload = jwt.verify(token, secret) as Record<string, unknown>
    
    // Validate the payload against our schema
    return JwtPayloadSchema.parse(payload)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError(`Invalid token: ${error.message}`)
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Token expired")
    } else if (error instanceof jwt.NotBeforeError) {
      throw new AuthError("Token not yet valid")
    } else if (error instanceof ZodError) {
      throw new AuthError("Invalid token payload")
    } else {
      throw new AuthError("Token verification failed")
    }
  }
}

/**
 * Check if the token has the required scopes
 */
export const hasRequiredScopes = (payload: JwtPayload, requiredScopes: string[]): boolean => {
  if (!requiredScopes.length) {
    return true
  }
  
  const tokenScopes = payload.scopes || []
  
  // Check if token has all required scopes
  return requiredScopes.every(scope => tokenScopes.includes(scope))
}

/**
 * Generate a JWT token
 */
export const generateToken = (
  payload: Omit<JwtPayload, "iat" | "exp" | "jti">,
  secret: string,
  expiresIn: string | number = "1d"
): { token: string; expiresAt: Date } => {
  // Generate a unique JWT ID
  const jti = crypto.randomUUID()
  
  // Calculate expiration time
  const iat = Math.floor(Date.now() / 1000)
  let exp: number
  
  if (typeof expiresIn === "number") {
    exp = iat + expiresIn
  } else {
    // Parse string format like "1d", "2h", etc.
    const match = expiresIn.match(/^(\d+)([smhdw])$/)
    if (!match) {
      throw new Error("Invalid expiresIn format. Use format like '1d', '2h', etc.")
    }
    
    const value = parseInt(match[1], 10)
    const unit = match[2]
    
    switch (unit) {
      case "s": // seconds
        exp = iat + value
        break
      case "m": // minutes
        exp = iat + value * 60
        break
      case "h": // hours
        exp = iat + value * 60 * 60
        break
      case "d": // days
        exp = iat + value * 60 * 60 * 24
        break
      case "w": // weeks
        exp = iat + value * 60 * 60 * 24 * 7
        break
      default:
        throw new Error("Invalid time unit. Use s, m, h, d, or w.")
    }
  }
  
  // Create the complete payload
  const tokenPayload: JwtPayload = {
    ...payload,
    iat,
    exp,
    jti
  }
  
  // Sign the token
  const token = jwt.sign(tokenPayload, secret)
  
  // Calculate expiration date
  const expiresAt = new Date(exp * 1000)
  
  return { token, expiresAt }
}

/**
 * Authentication middleware
 */
export const auth = (options: AuthOptions = {}): MiddlewareHandler => {
  // Merge options with defaults
  const opts = { ...defaultAuthOptions, ...options }
  
  return async (c: Context, next: Next) => {
    try {
      // Get JWT secret from environment
      const jwtSecret = c.env.JWT_SECRET
      
      if (!jwtSecret) {
        throw new AuthError("JWT_SECRET is not configured", 500)
      }
      
      // Extract token from request
      const token = await extractToken(c, opts.allowBodyToken)
      
      if (!token) {
        throw new AuthError("Authentication required")
      }
      
      // Verify token
      const payload = await verifyToken(token, jwtSecret)
      
      // Check scopes
      if (opts.scopes && opts.scopes.length > 0) {
        if (!hasRequiredScopes(payload, opts.scopes)) {
          throw new AuthError("Insufficient permissions", 403)
        }
      }
      
      // Store the payload in the context for later use
      c.set("jwtPayload", payload)
      
      // Continue to the next middleware or handler
      await next()
    } catch (error) {
      if (error instanceof AuthError) {
        c.status(error.status)
        return c.json({ error: error.message })
      }
      
      // For any other errors, return a generic 500 error
      c.status(500)
      return c.json({ error: "Internal server error" })
    }
  }
}
