import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "../../../middleware/metrics"
import { requireAPIAuth } from "../../../utils/auth-helpers"
import { getCloudflareEnv } from "../../../utils/cloudflare"
import { createApiError, isApiError, logRequest } from "../../../utils/response"
import { createTypedApiResponse } from "../../../utils/response-types"
import { getValidatedUUID } from "../../../utils/validation"

interface TokenUsage {
  uuid: string
  requestCount: number
  lastUsed: string | null
  isRevoked: boolean
  maxRequests?: number
  createdAt: string
}

// Define the result schema for the token usage endpoint
const TokenUsageResultSchema = z.object({
  uuid: z.string(),
  requestCount: z.number(),
  lastUsed: z.string().nullable(),
  isRevoked: z.boolean(),
  maxRequests: z.number().optional(),
  createdAt: z.string()
})

// Get token usage from KV storage using simple keys
async function getTokenUsageFromKV(uuid: string, kv?: KVNamespace): Promise<TokenUsage> {
  if (!kv) {
    throw createApiError(503, "Token storage service unavailable")
  }

  try {
    // Get all token data using simple KV keys
    const [maxRequestsStr, createdAtStr, usageCountStr, lastUsedStr, revokedStr] = await Promise.all([
      kv.get(`token:${uuid}:max-requests`),
      kv.get(`token:${uuid}:created-at`),
      kv.get(`token:${uuid}:usage-count`),
      kv.get(`token:${uuid}:last-used`),
      kv.get(`token:${uuid}:revoked`)
    ])

    // Check if token exists (if any of the core fields exist)
    if (!createdAtStr && !maxRequestsStr) {
      throw createApiError(404, `Token not found: ${uuid}`)
    }

    const maxRequests = maxRequestsStr ? Number.parseInt(maxRequestsStr, 10) : undefined
    const requestCount = usageCountStr ? Number.parseInt(usageCountStr, 10) : 0
    const isRevoked = revokedStr === "true"
    const lastUsed = lastUsedStr || null
    const createdAt = createdAtStr || new Date().toISOString()

    return {
      uuid,
      requestCount,
      lastUsed,
      isRevoked,
      maxRequests,
      createdAt
    }
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error
    }
    console.error("Failed to get token usage from KV:", error)
    throw createApiError(500, "Failed to retrieve token usage")
  }
}

export default defineEventHandler(async (event) => {
  const _startTime = Date.now()
  let _authToken: string | null = null
  let uuid: string | undefined

  try {
    // Check authorization for token management using helper
    const authResult = await requireAPIAuth(event, "token")
    _authToken = authResult?.sub || null

    // Validate UUID parameter using helper
    uuid = getValidatedUUID(event)

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)
    if (!env.KV) {
      throw createApiError(503, "Token service not available")
    }

    // Get token usage from KV storage
    const usage = await getTokenUsageFromKV(uuid, env.KV)

    // Record successful token usage request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "token/{uuid}/usage", "GET", 200, {
      tokenId: uuid,
      usage: `requests:${usage.requestCount},max:${usage.maxRequests || "unlimited"}`,
      isRevoked: usage.isRevoked
    })

    // Return success with result and success message
    return createTypedApiResponse({
      result: usage,
      message: "Token usage retrieved successfully",
      error: null,
      resultSchema: TokenUsageResultSchema
    })
  } catch (error: unknown) {
    console.error("Token usage error:", error)

    // Log error request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "token/{uuid}/usage", "GET", statusCode, {
      tokenId: uuid || "unknown",
      usage: "error",
      isRevoked: false
    })

    // Record error metrics
    recordAPIErrorMetrics(event, error)

    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Token usage retrieval failed")
  }
})
