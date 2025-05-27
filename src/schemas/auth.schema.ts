import { z } from "zod"

export const JWTPayloadSchema = z.object({
  sub: z.string().describe("Subject (user ID)"),
  iat: z.number().describe("Issued at timestamp"),
  exp: z.number().optional().describe("Expiration timestamp (optional)"),
  jti: z.string().uuid().describe("JWT ID (UUID)"),
  maxRequests: z.number().positive().optional().describe("Maximum number of requests allowed (optional)")
})

export const CreateJWTRequestSchema = z.object({
  sub: z.string().min(1).describe("Subject (user ID)"),
  expiresIn: z
    .string()
    .optional()
    .describe("Token expiration (e.g., '1h', '7d', '30m'). If not provided, token doesn't expire"),
  maxRequests: z.number().positive().optional().describe("Maximum number of requests allowed"),
  description: z.string().optional().describe("Description of the token purpose")
})

export const TokenMetadataSchema = z.object({
  uuid: z.string().uuid().describe("Token UUID"),
  sub: z.string().describe("Subject (user ID)"),
  description: z.string().optional().describe("Description of the token purpose"),
  maxRequests: z.number().positive().optional().describe("Maximum number of requests allowed"),
  createdAt: z.string().datetime().describe("Token creation timestamp"),
  expiresAt: z.string().datetime().optional().describe("Token expiration timestamp")
})

export const TokenUsageSchema = z.object({
  uuid: z.string().uuid().describe("Token UUID"),
  requestCount: z.number().nonnegative().describe("Current number of requests made"),
  lastUsed: z.string().datetime().optional().describe("Last usage timestamp"),
  isRevoked: z.boolean().describe("Whether the token is revoked")
})

export const AuthErrorSchema = z.object({
  error: z.string()
})

export const AuthorizedUserSchema = z.object({
  id: z.string().describe("User ID")
})

export type JWTPayload = z.infer<typeof JWTPayloadSchema>
export type CreateJWTRequest = z.infer<typeof CreateJWTRequestSchema>
export type TokenMetadata = z.infer<typeof TokenMetadataSchema>
export type TokenUsage = z.infer<typeof TokenUsageSchema>
export type AuthError = z.infer<typeof AuthErrorSchema>
export type AuthorizedUser = z.infer<typeof AuthorizedUserSchema>

export const COMMON_SCOPES = {
  READ: "read",
  WRITE: "write",
  ADMIN: "admin",
  METRICS: "metrics",
  ROUTEROS: "routeros",
  DASHBOARD: "dashboard",
  REDIRECT: "redirect"
} as const

export type CommonScope = (typeof COMMON_SCOPES)[keyof typeof COMMON_SCOPES]
