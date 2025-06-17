// Re-export all types from schemas for compatibility
export type {
  AiAltTextRequest,
  AiAltTextResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthSuccessResponse,
  CreateRedirect,
  HealthCheck,
  JWTDetails,
  TokenMetrics,
  TokenUsage,
  UrlRedirect,
  User,
  WorkerInfo
} from "~/server/utils/schemas"

// JWT Token Payload for client-side use
export interface ClientJWTPayload {
  sub: string
  iat: number
  exp?: number
  jti?: string
  maxRequests?: number
}

// Client-side user info
export interface ClientUser {
  id: string
  issuedAt: string
  expiresAt: string | null
  tokenId?: string
  maxRequests?: number
}
