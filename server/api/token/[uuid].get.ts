import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { authorizeEndpoint } from "~/server/utils/auth"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiError, createApiResponse, isApiError } from "~/server/utils/response"
import { TokenUsageSchema } from "~/server/utils/schemas"

interface TokenUsageData {
  token_id: string
  usage_count: number
  max_requests: number
  created_at: string
  last_used: string
}

export default defineEventHandler(async (event) => {
  const _startTime = Date.now()
  let _authToken: string | null = null
  let uuid: string | undefined

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

    if (!uuid) {
      throw createApiError(400, "Token UUID is required")
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      throw createApiError(400, "Invalid UUID format")
    }

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

    return createApiResponse({
      result: validatedUsage,
      message: "Token usage retrieved successfully",
      error: null
    })
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
