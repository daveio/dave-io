import { z } from "zod"

export const JWTPayloadSchema = z.object({
  sub: z.string().describe("Subject (user ID)"),
  scopes: z.array(z.string()).describe("Array of authorized scopes"),
  iat: z.number().describe("Issued at timestamp"),
  exp: z.number().describe("Expiration timestamp")
})

export const CreateJWTRequestSchema = z.object({
  sub: z.string().min(1).describe("Subject (user ID)"),
  scopes: z.array(z.string()).default([]).describe("Array of scopes to grant"),
  expiresIn: z.string().default("1h").describe("Token expiration (e.g., '1h', '7d', '30m')")
})

export const AuthErrorSchema = z.object({
  error: z.string(),
  required: z.array(z.string()).optional().describe("Required scopes"),
  granted: z.array(z.string()).optional().describe("Granted scopes")
})

export const AuthorizedUserSchema = z.object({
  id: z.string().describe("User ID"),
  scopes: z.array(z.string()).describe("User's authorized scopes")
})

export type JWTPayload = z.infer<typeof JWTPayloadSchema>
export type CreateJWTRequest = z.infer<typeof CreateJWTRequestSchema>
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
