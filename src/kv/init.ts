/// <reference path="../../worker-configuration.d.ts" />

// Local type definitions - removed schema validation
interface DashboardItem {
  title: string
  subtitle: string
  linkURL?: string
  imageURL?: string
}
import { KV_PREFIX as DASHBOARD_KV_PREFIX } from "./dashboard"
import { KV_PREFIX as REDIRECT_KV_PREFIX, METRICS_PREFIX as REDIRECT_METRICS_PREFIX } from "./redirect"
import {
  KV_CACHE_IPV4,
  KV_CACHE_IPV6,
  KV_CACHE_SCRIPT,
  KV_METRICS_CACHE_HITS,
  KV_METRICS_CACHE_MISSES,
  KV_METRICS_CACHE_RESETS,
  KV_METRICS_LAST_ACCESSED,
  KV_PUTIO_METADATA_LAST_ATTEMPT,
  KV_PUTIO_METADATA_LAST_ERROR,
  KV_PUTIO_METADATA_LAST_UPDATED,
  KV_PUTIO_METADATA_UPDATE_IN_PROGRESS
} from "./routeros"

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
  // Check if metadata exists, if not, create it
  const lastUpdated = await env.DATA.get(KV_PUTIO_METADATA_LAST_UPDATED)

  if (!lastUpdated) {
    await Promise.all([
      env.DATA.put(KV_PUTIO_METADATA_LAST_UPDATED, ""),
      env.DATA.put(KV_PUTIO_METADATA_LAST_ERROR, ""),
      env.DATA.put(KV_PUTIO_METADATA_LAST_ATTEMPT, ""),
      env.DATA.put(KV_PUTIO_METADATA_UPDATE_IN_PROGRESS, "false")
    ])
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
  const hasMetrics = await env.DATA.get(KV_METRICS_CACHE_RESETS)
  if (!hasMetrics) {
    await Promise.all([
      env.DATA.put(KV_METRICS_CACHE_RESETS, "0"),
      env.DATA.put(KV_METRICS_CACHE_HITS, "0"),
      env.DATA.put(KV_METRICS_CACHE_MISSES, "0"),
      env.DATA.put(KV_METRICS_LAST_ACCESSED, "")
    ])
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
    const countKey = `${REDIRECT_METRICS_PREFIX}${slug}:count`
    const lastAccessedKey = `${REDIRECT_METRICS_PREFIX}${slug}:last-accessed`

    // Check if metrics exist for this redirect
    const [count, lastAccessed] = await Promise.all([env.DATA.get(countKey), env.DATA.get(lastAccessedKey)])

    // Initialize missing metrics if needed
    const operations = []
    if (count === null) {
      operations.push(env.DATA.put(countKey, "0"))
    }

    if (lastAccessed === null) {
      operations.push(env.DATA.put(lastAccessedKey, ""))
    }

    if (operations.length > 0) {
      await Promise.all(operations)
    }
  }
}
