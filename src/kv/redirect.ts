// Local type definitions - removed schema validation
export interface Redirect {
  slug: string
  url: string
}

export interface ClickData {
  count: number
  lastAccessed: string | null
}

// KV Keys - following the pattern "redirect:slug"
export const KV_PREFIX = "redirect:"
export const METRICS_PREFIX = "metrics:redirect:"

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
    // Also delete metrics
    await Promise.all([
      env.DATA.delete(`${METRICS_PREFIX}${slug}:count`),
      env.DATA.delete(`${METRICS_PREFIX}${slug}:last-accessed`)
    ])
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
    console.error("Error listing redirect:", error)
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

    // Get current count
    const countKey = `${METRICS_PREFIX}${slug}:count`
    let count = 0
    const existingCount = await env.DATA.get(countKey)
    if (existingCount) {
      count = Number.parseInt(existingCount, 10)
    }

    // Update click data
    count++
    const currentTime = new Date().toISOString()

    // Store updated data
    await Promise.all([
      env.DATA.put(countKey, count.toString()),
      env.DATA.put(`${METRICS_PREFIX}${slug}:last-accessed`, currentTime)
    ])
  } catch (error) {
    console.error("Error tracking click for slug", { slug, error })
  }
}

/**
 * Get click data for a redirect
 */
export async function getRedirectStats(env: { DATA: KVNamespace }, slug: string): Promise<ClickData | null> {
  try {
    const [count, lastAccessed] = await Promise.all([
      env.DATA.get(`${METRICS_PREFIX}${slug}:count`),
      env.DATA.get(`${METRICS_PREFIX}${slug}:last-accessed`)
    ])

    if (!count && !lastAccessed) {
      return null
    }

    return {
      count: count ? Number.parseInt(count, 10) : 0,
      lastAccessed: lastAccessed || null
    }
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
    // Get all metrics keys that contain count information
    const { keys } = await env.DATA.list({ prefix: `${METRICS_PREFIX}` })

    const stats: Record<string, ClickData> = {}
    for (const key of keys) {
      // Only process count keys
      if (!key.name.endsWith(":count")) {
        continue
      }

      // Extract slug from key (remove prefix and :count suffix)
      const slug = key.name.substring(METRICS_PREFIX.length, key.name.length - ":count".length)

      // Get count and last accessed
      const [count, lastAccessed] = await Promise.all([
        env.DATA.get(`${METRICS_PREFIX}${slug}:count`),
        env.DATA.get(`${METRICS_PREFIX}${slug}:last-accessed`)
      ])

      if (count) {
        stats[slug] = {
          count: Number.parseInt(count, 10),
          lastAccessed: lastAccessed || null
        }
      }
    }

    return stats
  } catch (error) {
    console.error("Error getting all redirect stats:", error)
    return {}
  }
}
