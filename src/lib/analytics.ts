/**
 * Module for handling analytics tracking with Analytics Engine
 */

export interface RequestAnalytics {
  timestamp: number
  path: string
  method: string
  status: number
  responseTime: number
  ip?: string
  userAgent?: string
  referer?: string
  queryParams?: string
  errorMessage?: string
}

/**
 * Track detailed request analytics
 */
export function trackRequestAnalytics(env: { ANALYTICS: AnalyticsEngineDataset }, analytics: RequestAnalytics): void {
  try {
    const { path, method, status, responseTime, userAgent, referer, queryParams, errorMessage } = analytics

    // Create data point with all available info
    env.ANALYTICS.writeDataPoint({
      blobs: [method, path, userAgent || "unknown", referer || "none", queryParams || "none", errorMessage || "none"],
      doubles: [responseTime, status],
      indexes: ["request_analytics"]
    })
  } catch (error) {
    console.error("Error tracking request analytics", error)
  }
}
