import type { ClickData, Redirect } from "../schemas"

// KV Keys - following the pattern "redirects:slug"
export const KV_PREFIX = "redirects:"
export const METRICS_PREFIX = "metrics:redirects:"

/**
 * Get a redirect by slug
 */
export async function getRedirect(env: { DATA: KVNamespace }, slug: string): Promise<Redirect | null> {
  try {
    const url = await env.DATA.get(`${KV_PREFIX}${slug}`)
    if (!url) {
      return null
    }

    return {
      slug,
      url
    }
  } catch (error) {
    console.error("Error getting redirect for slug", { slug, error })
    return null
  }
}

/**
 * Store a redirect
 */
export async function setRedirect(env: { DATA: KVNamespace }, redirect: Redirect): Promise<boolean> {
  try {
    await env.DATA.put(`${KV_PREFIX}${redirect.slug}`, redirect.url)
    return true
  } catch (error) {
    console.error("Error setting redirect for slug", { slug: redirect.slug, error })
    return false
  }
}

/**
 * Delete a redirect
 */
export async function deleteRedirect(env: { DATA: KVNamespace }, slug: string): Promise<boolean> {
  try {
    await env.DATA.delete(`${KV_PREFIX}${slug}`)
    return true
  } catch (error) {
    console.error("Error deleting redirect for slug", { slug, error })
    return false
  }
}

/**
 * List all redirects
 */
export async function listRedirects(env: { DATA: KVNamespace }): Promise<Redirect[]> {
  try {
    const { keys } = await env.DATA.list({ prefix: KV_PREFIX })

    const redirects: Redirect[] = []
    for (const key of keys) {
      const slug = key.name.substring(KV_PREFIX.length)
      const url = await env.DATA.get(key.name)

      if (url) {
        redirects.push({
          slug,
          url
        })
      }
    }

    return redirects
  } catch (error) {
    console.error("Error listing redirects:", error)
    return []
  }
}

/**
 * Track redirect click
 */
export async function trackRedirectClick(
  env: { DATA: KVNamespace; ANALYTICS?: AnalyticsEngineDataset },
  slug: string
): Promise<void> {
  try {
    // Update analytics if available
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ["redirect", "click", slug],
        doubles: [1],
        indexes: ["redirect_click"]
      })
    }

    // Get current click data
    const metricsKey = `${METRICS_PREFIX}${slug}`
    let clickData: ClickData = {
      count: 0,
      lastAccessed: null
    }

    const existingData = await env.DATA.get<ClickData>(metricsKey, { type: "json" })
    if (existingData) {
      clickData = existingData
    }

    // Update click data
    clickData.count++
    clickData.lastAccessed = new Date().toISOString()

    // Store updated data
    await env.DATA.put(metricsKey, JSON.stringify(clickData))
  } catch (error) {
    console.error("Error tracking click for slug", { slug, error })
  }
}

/**
 * Get click data for a redirect
 */
export async function getRedirectStats(env: { DATA: KVNamespace }, slug: string): Promise<ClickData | null> {
  try {
    const metricsKey = `${METRICS_PREFIX}${slug}`
    const clickData = await env.DATA.get<ClickData>(metricsKey, { type: "json" })
    return clickData
  } catch (error) {
    console.error("Error getting click data for slug", { slug, error })
    return null
  }
}

/**
 * Get all redirect stats
 */
export async function getAllRedirectStats(env: { DATA: KVNamespace }): Promise<Record<string, ClickData>> {
  try {
    const { keys } = await env.DATA.list({ prefix: METRICS_PREFIX })

    const stats: Record<string, ClickData> = {}
    for (const key of keys) {
      const slug = key.name.substring(METRICS_PREFIX.length)
      const data = await env.DATA.get<ClickData>(key.name, { type: "json" })

      if (data) {
        stats[slug] = data
      }
    }

    return stats
  } catch (error) {
    console.error("Error getting all redirect stats:", error)
    return {}
  }
}
