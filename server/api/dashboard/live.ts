import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiError, isApiError, logRequest } from "~/server/utils/response"

export default defineEventHandler(async (event) => {
  const start = Date.now()
  try {
    const env = getCloudflareEnv(event)
    // Require DO binding
    if (!("DASHBOARD_WS" in env)) {
      throw createApiError(503, "WebSocket service unavailable")
    }
    // biome-ignore lint/suspicious/noExplicitAny: dynamic env access
    const wsNamespace = (env as any).DASHBOARD_WS as DurableObjectNamespace
    const id = wsNamespace.idFromName("metrics")
    const stub = wsNamespace.get(id)

    // Forward request to Durable Object for WebSocket upgrade
    const response = await stub.fetch(event.node.req as unknown as Request)

    recordAPIMetrics(event, 101)
    logRequest(event, "dashboard/live", "GET", 101, { duration: Date.now() - start })

    return response
  } catch (error: unknown) {
    console.error("Live dashboard error:", error)
    recordAPIErrorMetrics(event, error)
    // biome-ignore lint/suspicious/noExplicitAny: isApiError ensures property
    const status = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "dashboard/live", "GET", status, { error: String(error) })
    if (isApiError(error)) {
      throw error
    }
    throw createApiError(500, "Failed to connect to dashboard")
  }
})
