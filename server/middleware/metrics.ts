import type { H3Event } from "h3"
import { getHeader, getMethod, getRequestURL } from "h3"
import { getCloudflareEnv, getCloudflareRequestInfo } from "../utils/cloudflare"
import { updateAPIRequestMetricsAsync } from "../utils/kv-metrics"

/**
 * Helper to automatically record standard API metrics for an endpoint
 * This should be called in the success path of every /api endpoint
 *
 * Non-blocking: This function triggers metrics updates asynchronously
 * without waiting for completion
 */
export function recordAPIMetrics(event: H3Event, statusCode = 200): void {
  try {
    const env = getCloudflareEnv(event)
    if (!env?.KV) {
      return // Skip metrics if KV is not available
    }

    const url = getRequestURL(event)
    const method = getMethod(event)
    const cfInfo = getCloudflareRequestInfo(event)
    const userAgent = getHeader(event, "user-agent") || ""

    // Fire and forget using the async version
    updateAPIRequestMetricsAsync(env.KV, url.pathname, method, statusCode, cfInfo, userAgent)
  } catch (error) {
    console.error("Failed to record API metrics:", error)
    // Never let metrics errors break the request
  }
}

/**
 * Helper to record API metrics in error scenarios
 * This should be called in error handlers for /api endpoints
 *
 * Non-blocking: This function triggers metrics updates asynchronously
 * without waiting for completion
 */
export function recordAPIErrorMetrics(event: H3Event, error: unknown): void {
  let statusCode = 500

  // Extract status code from error if it's an API error
  if (error && typeof error === "object" && "statusCode" in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statusCode = (error as any).statusCode || 500
  }

  recordAPIMetrics(event, statusCode)
}

// Default export for Nuxt middleware (no-op since we use the functions directly)
export default defineEventHandler(async () => {
  // This middleware is not automatically applied - functions are called directly
})
