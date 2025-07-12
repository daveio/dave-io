import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { authorizeEndpoint } from "~/server/utils/auth"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiError, isApiError } from "~/server/utils/response"
import { createTypedApiResponse } from "~/server/utils/response-types"
import { TokenUsageSchema } from "~/server/utils/schemas"

interface TokenUsageData {
  token_id: string
  usage_count: number
  max_requests: number
  created_at: string
  last_used: string
}

// Define schemas for different endpoints
const TokenRevokeDataSchema = z.object({
  revoked: z.boolean(),
  token_id: z.string(),
  revoked_at: z.string()
})

const TokenMetricsDataSchema = z.object({
  total_requests: z.number(),
  successful_requests: z.number(),
  failed_requests: z.number(),
  redirect_clicks: z.number()
})

export default defineEventHandler(async (event) => {
  const _startTime = Date.now()
  let _authToken: string | null = null
  let uuid: string | undefined
  let path: string | undefined

  try {
    // Check authorization for token management
    const authFunc = await authorizeEndpoint("api", "token")
    const auth = await authFunc(event)
    if (!auth.success) {
      throw createApiError(401, auth.error || "Unauthorized")
    }

    _authToken = auth.payload?.sub || null

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)
    if (!env?.KV) {
      throw createApiError(503, "Token service not available")
    }

    uuid = getRouterParam(event, "uuid")
    path = getRouterParam(event, "path")

    if (!uuid) {
      throw createApiError(400, "Token UUID is required")
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      throw createApiError(400, "Invalid UUID format")
    }

    // Handle different paths
    if (!path) {
      // GET /api/token/{uuid} - Get token usage using simple KV keys
      const [usageCountStr, maxRequestsStr, createdAtStr, lastUsedStr] = await Promise.all([
        env.KV.get(`token:${uuid}:usage-count`),
        env.KV.get(`token:${uuid}:max-requests`),
        env.KV.get(`token:${uuid}:created-at`),
        env.KV.get(`token:${uuid}:last-used`)
      ])

      // Check if token exists
      if (!createdAtStr && !maxRequestsStr) {
        throw createApiError(404, `Token not found: ${uuid}`)
      }

      const usage: TokenUsageData = {
        token_id: uuid,
        usage_count: usageCountStr ? Number.parseInt(usageCountStr, 10) : 0,
        max_requests: maxRequestsStr ? Number.parseInt(maxRequestsStr, 10) : 0,
        created_at: createdAtStr || new Date().toISOString(),
        last_used: lastUsedStr || ""
      }

      const validatedUsage = TokenUsageSchema.parse(usage)

      // Record successful metrics
      recordAPIMetrics(event, 200)

      return createTypedApiResponse({
        result: validatedUsage,
        message: "Token usage retrieved successfully",
        error: null,
        resultSchema: TokenUsageSchema
      })
    }
    if (path === "revoke") {
      // GET /api/token/{uuid}/revoke - Revoke token (legacy endpoint)
      const createdAtStr = await env.KV.get(`token:${uuid}:created-at`)

      if (!createdAtStr) {
        throw createApiError(404, `Token not found: ${uuid}`)
      }

      // Add the token to revocation using simple KV key
      await env.KV.put(`token:${uuid}:revoked`, "true", { expirationTtl: 86400 * 30 })

      console.log(`Token revoked: ${uuid}`)

      const revokeData = {
        uuid: uuid,
        revoked: true,
        revokedAt: new Date().toISOString(),
        message: "Token revoked successfully"
      }

      // Record successful metrics
      recordAPIMetrics(event, 200)

      return createTypedApiResponse({
        result: revokeData,
        message: "Token revoked successfully",
        error: null,
        resultSchema: TokenRevokeDataSchema
      })
    }
    if (path === "metrics") {
      // GET /api/token/{uuid}/metrics - Get token metrics using simple KV keys
      const createdAtStr = await env.KV.get(`token:${uuid}:created-at`)

      if (!createdAtStr) {
        throw createApiError(404, `Token not found: ${uuid}`)
      }

      // Get real metrics data from KV counters for this specific token
      const [totalRequests, successfulRequests, failedRequests] = await Promise.all([
        env.KV.get(`metrics:token:${uuid}:requests:total`).then((v) => Number.parseInt(v || "0")),
        env.KV.get(`metrics:token:${uuid}:requests:successful`).then((v) => Number.parseInt(v || "0")),
        env.KV.get(`metrics:token:${uuid}:requests:failed`).then((v) => Number.parseInt(v || "0"))
      ])

      const metricsData = {
        uuid,
        totalRequests,
        successfulRequests,
        failedRequests,
        createdAt: createdAtStr
      }

      // Record successful metrics
      recordAPIMetrics(event, 200)

      return createTypedApiResponse({
        result: metricsData,
        message: "Token metrics retrieved successfully",
        error: null,
        resultSchema: TokenMetricsDataSchema
      })
    }
    throw createApiError(404, `Unknown token endpoint: ${path}`)
  } catch (error: unknown) {
    console.error("Token management error:", error)

    // Record error metrics
    recordAPIErrorMetrics(event, error)

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Token management failed")
  }
})
