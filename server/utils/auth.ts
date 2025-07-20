import type { H3Event } from "h3"
import { jwtVerify } from "jose"
import type { JWTPayload } from "jose"

// JWT payload structure matching dave-io Worker
export interface JWTTokenPayload extends JWTPayload {
  sub: string // Subject (endpoint or user identifier)
  iat: number // Issued at
  exp?: number // Expiration time
  jti?: string // JWT ID for revocation
  permissions?: string[] // Hierarchical permissions array
}

// Authorization result
export interface AuthResult {
  success: boolean
  payload?: JWTTokenPayload
  error?: string
  requestCount?: number
  sub?: string
  tokenSubject?: string
}

// Extract JWT token from request (Authorization header or query parameter)
export function extractToken(event: H3Event): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = getHeader(event, "authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Fall back to query parameter
  const query = getQuery(event)
  if (query.token && typeof query.token === "string") {
    return query.token
  }

  return null
}

// Verify JWT token
export async function verifyJWT(token: string, secret: string): Promise<AuthResult> {
  try {
    const encoder = new TextEncoder()
    const secretKey = encoder.encode(secret)

    const { payload } = await jwtVerify(token, secretKey)

    // Validate required fields
    if (!payload.sub || typeof payload.sub !== "string") {
      return { success: false, error: "Invalid token: missing subject" }
    }

    if (!payload.iat || typeof payload.iat !== "number") {
      return { success: false, error: "Invalid token: missing issued at" }
    }

    // Check expiration if present
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { success: false, error: "Token expired" }
    }

    return {
      success: true,
      payload: payload as JWTTokenPayload
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token verification failed"
    }
  }
}

// Check if permissions array contains required permission (hierarchical)
export function hasPermission(permissions: string[], required: string): boolean {
  // Check for wildcard or admin access
  if (permissions.includes("*") || permissions.includes("admin")) {
    return true
  }

  // Check for exact match
  if (permissions.includes(required)) {
    return true
  }

  // Check for hierarchical match (parent:child pattern)
  const parts = required.split(":")
  for (let i = parts.length - 1; i > 0; i--) {
    const parent = parts.slice(0, i).join(":")
    if (permissions.includes(parent)) {
      return true
    }
  }

  return false
}

// Check if subject has permission for endpoint (legacy single-subject API)
export function checkEndpointPermission(subject: string, endpoint: string): boolean {
  // Convert single subject to permissions array for compatibility
  return hasPermission([subject], endpoint)
}

// Validate token permissions with expiry check
export function validateTokenPermissions(
  token: { sub: string; permissions?: string[]; iat: number; exp?: number },
  required: string
): boolean {
  // Check if token is expired
  if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
    return false
  }

  // If no permissions array, fall back to subject-based permission
  if (!token.permissions) {
    return hasPermission([token.sub], required)
  }

  return hasPermission(token.permissions, required)
}

// Check if token is revoked (JTI blacklist)
export async function isTokenRevoked(event: H3Event, jti: string): Promise<boolean> {
  if (!jti) {
    return false
  }

  try {
    // Get KV binding from event context
    const env = event.context.cloudflare?.env as { KV?: KVNamespace }
    if (!env?.KV) {
      console.warn("KV binding not available, assuming token not revoked")
      return false
    }

    // Check KV store for revoked tokens using simple key format
    const revoked = await env.KV.get(`token:${jti}:revoked`)
    return revoked === "true"
  } catch (error) {
    console.error("Failed to check token revocation:", error)
    // Fail open - assume not revoked but log the error
    return false
  }
}

// Main authorization function
export async function authorizeEndpoint(
  endpoint: string,
  subResource?: string
): Promise<(event: H3Event) => Promise<AuthResult>> {
  return async (event: H3Event): Promise<AuthResult> => {
    const token = extractToken(event)
    if (!token) {
      return { success: false, error: "No token provided" }
    }

    // Get JWT secret from Cloudflare Secrets Store or runtime config
    let secret: string

    const env = event.context.cloudflare?.env as { API_JWT_SECRET?: SecretsStoreSecret }
    const configSecret = useRuntimeConfig(event).apiJwtSecret

    // Prefer Cloudflare Workers secret when available
    if (env?.API_JWT_SECRET) {
      try {
        secret = await env.API_JWT_SECRET.get()
      } catch (error) {
        console.error("Failed to retrieve API_JWT_SECRET from Secrets Store:", error)
        // Fallback to runtime config for non-Cloudflare environments
        secret = configSecret
      }
    } else {
      // Fallback to runtime config for non-Cloudflare environments
      secret = configSecret
    }

    if (!secret || secret === "dev-secret-change-in-production") {
      console.warn("Using default JWT secret - this is insecure for production!")
    }

    // Verify token
    const verification = await verifyJWT(token, secret)
    if (!verification.success || !verification.payload) {
      return verification
    }

    const { payload } = verification

    // Check if token is revoked
    if (payload.jti && (await isTokenRevoked(event, payload.jti))) {
      return { success: false, error: "Token has been revoked" }
    }

    // Build full endpoint path
    const fullEndpoint = subResource ? `${endpoint}:${subResource}` : endpoint

    // Check permissions using new hierarchical system
    if (!validateTokenPermissions(payload, fullEndpoint)) {
      return {
        success: false,
        error: `Insufficient permissions for ${fullEndpoint}`
      }
    }

    return {
      success: true,
      payload,
      sub: payload.sub,
      tokenSubject: payload.sub
    }
  }
}

// Helper to get user info from JWT payload
export function getUserFromPayload(payload: JWTTokenPayload) {
  return {
    id: payload.sub,
    issuedAt: new Date(payload.iat * 1000),
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
    tokenId: payload.jti
  }
}
