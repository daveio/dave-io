import type { ClickData, DashboardItem, Redirect, RouterOSCacheData, RouterOSCacheMetadata } from "../schemas"
import { KV_PREFIX as DASHBOARD_KV_PREFIX } from "./dashboard"
import { KV_PREFIX as REDIRECT_KV_PREFIX, METRICS_PREFIX as REDIRECT_METRICS_PREFIX } from "./redirect"
import { KV_CACHE_IPV4, KV_CACHE_IPV6, KV_CACHE_SCRIPT, KV_PUTIO_METADATA, KV_SHARED_METRICS } from "./routeros"

/**
 * Initialize KV stores with default values if they don't exist
 */
export async function initializeKV(env: { DATA: KVNamespace; ANALYTICS?: AnalyticsEngineDataset }): Promise<void> {
  await Promise.all([initializeRouterOSKV(env), initializeRedirectsKV(env), initializeDashboardKV(env)])
}

/**
 * Initialize Dashboard KV with default values
 */
async function initializeDashboardKV(env: { DATA: KVNamespace }): Promise<void> {
  // Check if demo dashboard items exist, if not, create them
  const demoItemsKey = `${DASHBOARD_KV_PREFIX}demo:items`
  const demoItems = await env.DATA.get<DashboardItem[]>(demoItemsKey, { type: "json" })

  if (!demoItems) {
    const defaultItems: DashboardItem[] = [
      {
        title: "Item 1",
        subtitle: "Subtitle 1",
        linkURL: "https://example.com",
        imageURL: "https://example.com/image.png"
      },
      {
        title: "Item 2",
        subtitle: "Subtitle 2",
        linkURL: "https://example.com",
        imageURL: "https://example.com/image.png"
      }
    ]
    await env.DATA.put(demoItemsKey, JSON.stringify(defaultItems))
  }
}

/**
 * Initialize RouterOS KV with default values
 */
async function initializeRouterOSKV(env: { DATA: KVNamespace }): Promise<void> {
  // Check if KV_PUTIO_METADATA exists, if not, create it
  const metadata = await env.DATA.get<RouterOSCacheMetadata>(KV_PUTIO_METADATA, { type: "json" })

  if (!metadata) {
    const defaultMetadata: RouterOSCacheMetadata = {
      lastUpdated: null,
      lastError: null,
      lastAttempt: null,
      updateInProgress: false
    }
    await env.DATA.put(KV_PUTIO_METADATA, JSON.stringify(defaultMetadata))
  }

  // Initialize IPV4 ranges if not exist
  const ipv4Ranges = await env.DATA.get<string[]>(KV_CACHE_IPV4, { type: "json" })
  if (!ipv4Ranges) {
    await env.DATA.put(KV_CACHE_IPV4, JSON.stringify([]))
  }

  // Initialize IPV6 ranges if not exist
  const ipv6Ranges = await env.DATA.get<string[]>(KV_CACHE_IPV6, { type: "json" })
  if (!ipv6Ranges) {
    await env.DATA.put(KV_CACHE_IPV6, JSON.stringify([]))
  }

  // Initialize cached script if not exist
  const script = await env.DATA.get(KV_CACHE_SCRIPT)
  if (!script) {
    await env.DATA.put(KV_CACHE_SCRIPT, "")
  }

  // Initialize shared metrics if not exist
  const sharedMetrics = await env.DATA.get<Record<string, unknown>>(KV_SHARED_METRICS, { type: "json" })
  if (!sharedMetrics) {
    await env.DATA.put(
      KV_SHARED_METRICS,
      JSON.stringify({
        cacheResets: 0,
        cacheHits: 0,
        cacheMisses: 0,
        lastAccessed: null
      })
    )
  }
}

/**
 * Initialize Redirects KV with default values if needed
 */
async function initializeRedirectsKV(env: { DATA: KVNamespace }): Promise<void> {
  // Not initializing actual redirects with default values as they are user-defined
  // However, we can ensure the metrics structure exists for any existing redirects

  // First get all existing redirects
  const { keys } = await env.DATA.list({ prefix: REDIRECT_KV_PREFIX })

  // For each redirect, ensure metrics exist
  for (const key of keys) {
    const slug = key.name.substring(REDIRECT_KV_PREFIX.length)
    const metricsKey = `${REDIRECT_METRICS_PREFIX}${slug}`

    // Check if metrics exist for this redirect
    const metrics = await env.DATA.get<ClickData>(metricsKey, { type: "json" })

    // If no metrics, initialize with defaults
    if (!metrics) {
      const defaultClickData: ClickData = {
        count: 0,
        lastAccessed: null
      }
      await env.DATA.put(metricsKey, JSON.stringify(defaultClickData))
    }
  }
}
