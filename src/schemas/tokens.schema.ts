import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { Str } from "chanfana"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for token UUID parameters
 */
export const TokenParamsSchema = z.object({
  uuid: z.string().openapi({ description: "Token UUID" })
})

export type TokenParams = z.infer<typeof TokenParamsSchema>

/**
 * Schema for token usage information
 */
export const TokenUsageSchema = z.object({
  uuid: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  requestCount: z.number().openapi({ example: 42 }),
  lastUsed: z.string().nullable().openapi({ example: "2024-01-01T12:00:00.000Z" }),
  isRevoked: z.boolean().openapi({ example: false })
})

export type TokenUsage = z.infer<typeof TokenUsageSchema>

/**
 * Schema for token revocation request
 */
export const TokenRevocationRequestSchema = z.object({
  revoked: z.boolean().openapi({
    description: "Whether to revoke (true) or unrevoke (false)",
    example: true
  })
})

export type TokenRevocationRequest = z.infer<typeof TokenRevocationRequestSchema>

/**
 * Schema for token revocation response
 */
export const TokenRevocationResponseSchema = z.object({
  uuid: z.string().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  revoked: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Token revoked successfully" })
})

export type TokenRevocationResponse = z.infer<typeof TokenRevocationResponseSchema>

/**
 * Schema for error responses
 */
export const TokenErrorSchema = z.object({
  error: z.string().openapi({ example: "Token not found" })
})

export type TokenError = z.infer<typeof TokenErrorSchema>
