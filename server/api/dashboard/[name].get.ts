import { z } from "zod"
import { recordAPIErrorMetrics, recordAPIMetrics } from "../../middleware/metrics"
import { getCloudflareEnv, getKVNamespace } from "../../utils/cloudflare"
import { parseRSSFeed } from "../../utils/formatters"
import { createApiError, isApiError, logRequest } from "../../utils/response"
import { createTypedApiResponse } from "../../utils/response-types"

interface DashboardItem {
  title: string
  subtitle: string
  linkURL?: string
  imageURL?: string
}

interface DashboardResponse {
  dashboard: string
  error: string | null
  items: DashboardItem[]
  timestamp: number
  source?: "kv" | "mock" | "live" | "cache"
}

// Define the result schema for the dashboard endpoint
const DashboardResultSchema = z.object({
  dashboard: z.string(),
  error: z.string().nullable(),
  items: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string(),
      linkURL: z.string().optional(),
      imageURL: z.string().optional()
    })
  ),
  timestamp: z.number(),
  source: z.enum(["kv", "mock", "live", "cache"]).optional()
})

async function fetchHackerNews(kv: KVNamespace): Promise<{ items: DashboardItem[]; source: "cache" | "live" }> {
  const lastUpdatedKey = "dashboard:hackernews:last-updated"
  const cacheHours = 1 // 1 hour cache
  const cacheMs = cacheHours * 60 * 60 * 1000

  // Check if we have cached data and if it's still fresh
  try {
    const lastUpdatedStr = await kv.get(lastUpdatedKey)

    if (lastUpdatedStr) {
      const lastUpdated = Number.parseInt(lastUpdatedStr, 10)
      const now = Date.now()

      if (now - lastUpdated < cacheMs) {
        // Get cached items using simple KV keys (up to 10 items)
        const cachedItemPromises: Promise<string | null>[] = []
        for (let i = 0; i < 10; i++) {
          cachedItemPromises.push(kv.get(`dashboard:hackernews:item:${i}:title`))
          cachedItemPromises.push(kv.get(`dashboard:hackernews:item:${i}:link`))
        }

        const cachedValues = await Promise.all(cachedItemPromises)
        const items: DashboardItem[] = []

        for (let i = 0; i < 10; i++) {
          const title = cachedValues[i * 2]
          const link = cachedValues[i * 2 + 1]

          if (title) {
            items.push({
              title,
              subtitle: "Hacker News",
              linkURL: link || undefined
            })
          }
        }

        if (items.length > 0) {
          return { items, source: "cache" }
        }
      }
    }
  } catch (error) {
    console.error("Failed to get cached Hacker News data:", error)
  }

  // Fetch fresh data
  try {
    const response = await fetch("https://news.ycombinator.com/rss")
    if (!response.ok) {
      throw createApiError(503, `RSS fetch failed: ${response.status}`)
    }

    const rssText = await response.text()
    const rssItems = parseRSSFeed(rssText)
    const items: DashboardItem[] = rssItems.slice(0, 10).map((item) => ({
      title: item.title,
      subtitle: "Hacker News",
      linkURL: item.link
    }))

    // Cache the results using simple KV keys
    if (items.length > 0) {
      const now = Date.now()
      try {
        const cacheOperations: Promise<void>[] = [kv.put(lastUpdatedKey, now.toString())]

        // Store each item as separate KV keys
        items.forEach((item, index) => {
          cacheOperations.push(kv.put(`dashboard:hackernews:item:${index}:title`, item.title))
          if (item.linkURL) {
            cacheOperations.push(kv.put(`dashboard:hackernews:item:${index}:link`, item.linkURL))
          }
        })

        await Promise.all(cacheOperations)
      } catch (error) {
        console.error("Failed to cache Hacker News data:", error)
      }
    }

    return { items, source: "live" }
  } catch (error) {
    console.error("Error fetching Hacker News:", error)
    throw createApiError(503, "Hacker News RSS feed temporarily unavailable")
  }
}

export default defineEventHandler(async (event) => {
  const _startTime = Date.now()

  try {
    const name = getRouterParam(event, "name")

    if (!name) {
      throw createApiError(400, "Dashboard name is required")
    }

    // Get environment bindings
    const env = getCloudflareEnv(event)
    const kv = getKVNamespace(env)

    let items: DashboardItem[]
    let source: "live" | "cache"
    const error: string | null = null

    switch (name) {
      case "hacker-news":
      case "hackernews": {
        if (!kv) {
          throw createApiError(503, "Dashboard service not available")
        }
        const result = await fetchHackerNews(kv)
        items = result.items
        source = result.source
        break
      }

      default: {
        throw createApiError(404, `Dashboard '${name}' not found`)
      }
    }

    const response: DashboardResponse = {
      dashboard: name,
      error,
      items,
      timestamp: Date.now(),
      source
    }

    // Add cache status header
    setHeader(event, "X-Data-Source", source)

    // Record standard API metrics
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "dashboard/{name}", "GET", 200, {
      dashboardName: name,
      source,
      itemCount: items.length
    })

    return createTypedApiResponse({
      result: response,
      message: `Dashboard '${name}' retrieved successfully`,
      error: null,
      resultSchema: DashboardResultSchema
    })
  } catch (error: unknown) {
    console.error("Dashboard error:", error)

    // Log error request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    const name = getRouterParam(event, "name") || "unknown"
    logRequest(event, "dashboard/{name}", "GET", statusCode, {
      dashboardName: name,
      source: "error",
      itemCount: 0
    })

    // Record error metrics
    recordAPIErrorMetrics(event, error)

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Dashboard retrieval failed")
  }
})
