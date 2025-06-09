import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAPIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { formatMetricsAsPrometheus, formatMetricsAsYAML, handleResponseFormat } from "~/server/utils/formatters"
import { getKVAggregatedTimings } from "~/server/utils/kv-metrics"
import { createApiError, isApiError, logRequest } from "~/server/utils/response"
import { TokenMetricsSchema } from "~/server/utils/schemas"

async function getMetricsFromKV(kv?: KVNamespace): Promise<{
  total_requests: number
  successful_requests: number
  failed_requests: number
  redirect_clicks: number
  kv_timings_ms: Record<string, number>
}> {
  if (!kv) {
    throw new Error("KV storage is required for metrics")
  }

  try {
    // Get basic metrics using simple KV keys
    const [okStr, errorStr] = await Promise.all([kv.get("metrics:ok"), kv.get("metrics:error")])

    const successfulRequests = okStr ? Number.parseInt(okStr, 10) : 0
    const failedRequests = errorStr ? Number.parseInt(errorStr, 10) : 0
    const totalRequests = successfulRequests + failedRequests

    // Calculate redirect clicks from redirect-specific metrics
    // We need to get all redirect metrics, but for now we'll use the go resource metrics as a proxy
    const goOkStr = await kv.get("metrics:resources:go:ok")
    const redirectClicks = goOkStr ? Number.parseInt(goOkStr, 10) : 0

    const timingData = await getKVAggregatedTimings(kv)

    const metricsData = {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      redirect_clicks: redirectClicks,
      kv_timings_ms: timingData
    }

    return metricsData
  } catch (error) {
    console.error("Failed to get metrics:", error)
    throw error
  }
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  let authToken: string | null = null
  let authSuccess = false

  try {
    // Check authorization for metrics endpoint using helper
    const authResult = await requireAPIAuth(event, "metrics")
    authToken = authResult?.sub || null
    authSuccess = true

    // Get environment bindings using helper
    const env = getCloudflareEnv(event)
    if (!env.DATA) {
      const error = createApiError(503, "KV storage not available")
      recordAPIErrorMetrics(event, error)

      // Log error request
      logRequest(event, "metrics", "GET", 503, {
        error: "KV storage not available",
        user: authToken || "unknown",
        kvAvailable: !!env?.DATA
      })

      throw error
    }

    // Get metrics data from KV
    const metricsData = await getMetricsFromKV(env.DATA)

    // Validate and format metrics data
    const metrics = TokenMetricsSchema.parse({
      success: true,
      data: metricsData,
      timestamp: new Date().toISOString()
    })

    // Get requested format for metrics response
    const requestedFormat = (getQuery(event).format as string) || "json"

    // Record successful metrics request
    recordAPIMetrics(event, 200)

    // Log successful request
    const responseTime = Date.now() - startTime
    logRequest(event, "metrics", "GET", 200, {
      user: authToken || "unknown",
      format: requestedFormat,
      totalRequests: metricsData.total_requests,
      responseTime: `${responseTime}ms`
    })

    // Handle different output formats using centralized formatter
    return handleResponseFormat(event, metrics, {
      json: () => metrics,
      yaml: () => formatMetricsAsYAML(metrics),
      prometheus: () => formatMetricsAsPrometheus(metrics)
    })
  } catch (error: unknown) {
    console.error("Metrics error:", error)

    // Record failed metrics request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: isApiError type guard ensures statusCode property exists
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "metrics", "GET", statusCode, {
      user: authToken || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
      authSuccess
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Failed to retrieve metrics")
  }
})
