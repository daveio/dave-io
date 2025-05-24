import { z } from "zod"

/**
 * Schema for JWT payload
 */
export const JwtPayloadSchema = z.object({
  /**
   * Subject (user identifier)
   */
  sub: z.string(),

  /**
   * Issued at timestamp
   */
  iat: z.number(),

  /**
   * Expiration timestamp
   */
  exp: z.number(),

  /**
   * JWT ID (unique identifier for this token)
   */
  jti: z.string(),

  /**
   * Issuer
   */
  iss: z.string().default("api.dave.io"),

  /**
   * Audience
   */
  aud: z.string().default("api.dave.io"),

  /**
   * Scopes (permissions) granted to this token
   */
  scopes: z.array(z.string())
})

export type JwtPayload = z.infer<typeof JwtPayloadSchema>

/**
 * Schema for JWT token in Authorization header
 */
export const AuthHeaderSchema = z.string().regex(/^Bearer\s+(.+)$/)

/**
 * Schema for JWT token in request body
 */
export const AuthBodySchema = z.object({
  token: z.string()
})

export type AuthBody = z.infer<typeof AuthBodySchema>

/**
 * Schema for token generation request
 */
export const TokenGenerationSchema = z.object({
  subject: z.string().describe("Subject (user identifier)"),
  scopes: z.array(z.string()).describe("List of permission scopes to grant"),
  expiresIn: z.string().default("1d").describe("Token expiration time (e.g., '1h', '1d', '7d')"),
  issuer: z.string().default("api.dave.io").describe("Token issuer"),
  audience: z.string().default("api.dave.io").describe("Token audience")
})

export type TokenGenerationRequest = z.infer<typeof TokenGenerationSchema>

/**
 * Schema for token generation response
 */
export const TokenResponseSchema = z.object({
  token: z.string().describe("The generated JWT token"),
  expiresAt: z.date().describe("Token expiration date")
})

export type TokenResponse = z.infer<typeof TokenResponseSchema>
