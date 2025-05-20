import { ipv4, ipv6 } from "../lib/ip-address-utils"
import type {
  BGPViewData,
  RouterOSCacheData as CacheData,
  RouterOSCacheMetadata as CacheMetadata,
  RipeData
} from "../schemas"

// KV Keys - following the pattern routeros:[provider]:[resource]
export const KV_CACHE_IPV4 = "routeros:putio:ipv4"
export const KV_CACHE_IPV6 = "routeros:putio:ipv6"
export const KV_CACHE_SCRIPT = "routeros:putio:script"
export const KV_PUTIO_METADATA = "routeros:putio:metadata" // Provider-specific metadata
export const KV_SHARED_METRICS = "metrics:routeros" // Shared metrics across all RouterOS endpoints

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600

/**
 * Get cache data from KV
 */
export async function getCacheData(env: { DATA: KVNamespace }): Promise<CacheData> {
  // Default empty cache
  const defaultCache: CacheData = {
    ipv4Ranges: [],
    ipv6Ranges: [],
    lastUpdated: null,
    lastError: null
  }

  try {
    // Try to get provider-specific metadata first
    const metadata = await env.DATA.get<CacheMetadata>(KV_PUTIO_METADATA, { type: "json" })

    // If no metadata, return default
    if (!metadata) {
      return defaultCache
    }

    // Get cached ranges
    const [ipv4Ranges, ipv6Ranges] = await Promise.all([
      env.DATA.get<string[]>(KV_CACHE_IPV4, { type: "json" }),
      env.DATA.get<string[]>(KV_CACHE_IPV6, { type: "json" })
    ])

    return {
      ipv4Ranges: ipv4Ranges || [],
      ipv6Ranges: ipv6Ranges || [],
      lastUpdated: metadata.lastUpdated,
      lastError: metadata.lastError,
      updateInProgress: metadata.updateInProgress
    }
  } catch (_error) {
    // In case of error, return default cache
    return defaultCache
  }
}

/**
 * Check if cache needs to be refreshed
 */
export function shouldRefreshCache(cacheData: CacheData): boolean {
  // If there's no cached data, we definitely need to refresh
  if (!cacheData.lastUpdated) {
    return true
  }

  // Check if the cache is more than TTL seconds old
  const lastUpdated = new Date(cacheData.lastUpdated)
  const now = new Date()
  const ageInSeconds = (now.getTime() - lastUpdated.getTime()) / 1000

  return ageInSeconds > CACHE_TTL
}

/**
 * Check if cache is stale (> TTL)
 */
export function isCacheStale(cacheData: CacheData): boolean {
  if (!cacheData.lastUpdated) {
    return true
  }

  const lastUpdated = new Date(cacheData.lastUpdated)
  const now = new Date()
  const ageInSeconds = (now.getTime() - lastUpdated.getTime()) / 1000

  return ageInSeconds > CACHE_TTL
}

/**
 * Get provider-specific cache status information
 */
export async function getCacheStatus(env: { DATA: KVNamespace }): Promise<CacheMetadata> {
  const defaultMetadata: CacheMetadata = {
    lastUpdated: null,
    lastError: null,
    lastAttempt: null,
    updateInProgress: false
  }

  try {
    const metadata = await env.DATA.get<CacheMetadata>(KV_PUTIO_METADATA, { type: "json" })
    return metadata || defaultMetadata
  } catch (_error) {
    return defaultMetadata
  }
}

/**
 * Get shared metrics across all RouterOS endpoints
 */
export async function getSharedMetadata(env: { DATA: KVNamespace }): Promise<Record<string, unknown>> {
  try {
    const metrics = await env.DATA.get<Record<string, unknown>>(KV_SHARED_METRICS, { type: "json" })
    return metrics || {}
  } catch (_error) {
    return {}
  }
}

/**
 * Update shared metrics
 */
export async function updateSharedMetadata(
  env: { DATA: KVNamespace },
  metrics: Record<string, unknown>,
  expirationTtl?: number
): Promise<void> {
  const ttl = expirationTtl || CACHE_TTL * 2
  await env.DATA.put(KV_SHARED_METRICS, JSON.stringify(metrics), { expirationTtl: ttl })
}

/**
 * Fetch data from RIPE
 */
async function fetchRipeData(): Promise<RipeData> {
  const response = await fetch("https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS9009", {
    headers: {
      Accept: "application/json",
      "User-Agent": "api.dave.io (https://api.dave.io)"
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch RIPE data: ${response.status}`)
  }

  return (await response.json()) as RipeData
}

/**
 * Fetch data from BGPView
 */
async function fetchBGPViewData(): Promise<BGPViewData> {
  const response = await fetch("https://api.bgpview.io/asn/9009/prefixes", {
    headers: {
      Accept: "application/json",
      "User-Agent": "api.dave.io (https://api.dave.io)"
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch BGPView data: ${response.status}`)
  }

  return (await response.json()) as BGPViewData
}

/**
 * Process IP ranges from RIPE and BGPView data
 */
function processIPRanges(ripeData: RipeData, bgpViewData: BGPViewData, version: 4 | 6): string[] {
  const ranges = new Set<string>()

  // Process RIPE data
  if (ripeData?.data?.prefixes) {
    for (const prefix of ripeData.data.prefixes) {
      // Filter by IP version
      if (version === 4 && prefix.prefix.includes(":")) {
        continue
      }
      if (version === 6 && !prefix.prefix.includes(":")) {
        continue
      }

      ranges.add(prefix.prefix)
    }
  }

  // Process BGPView data
  if (bgpViewData?.data) {
    const prefixes = version === 4 ? bgpViewData.data.ipv4_prefixes || [] : bgpViewData.data.ipv6_prefixes || []

    for (const prefix of prefixes) {
      if (prefix.prefix) {
        ranges.add(prefix.prefix)
      }
    }
  }

  // Merge and simplify ranges
  return mergeIPRanges(Array.from(ranges), version)
}

/**
 * Merge IP ranges
 */
function mergeIPRanges(ranges: string[], version: 4 | 6): string[] {
  if (ranges.length === 0) {
    return []
  }

  try {
    // Use the ip-address-utils library to merge ranges
    if (version === 4) {
      return ipv4.cidrMerge(ranges)
    }
    return ipv6.cidrMerge(ranges)
  } catch (error) {
    // Use separate arguments to avoid string formatting vulnerabilities
    console.error("Error merging IP ranges", { version, error })
    return ranges
  }
}

/**
 * Generate RouterOS script from cached data
 */
export function generateScript(cacheData: CacheData): string {
  const { ipv4Ranges, ipv6Ranges } = cacheData

  // Script header
  const header = `# put.io IP address list for RouterOS
# Generated at ${new Date().toISOString()}
# Contains ${ipv4Ranges.length} IPv4 ranges and ${ipv6Ranges.length} IPv6 ranges

# Use this script to create IP address lists for
# put.io servers in Mikrotik RouterOS devices

# This script assumes you are executing it from CLI with 'import'
# It will remove existing put.io list entries and add new ones

# Remove existing entries
/ip firewall address-list remove [/ip firewall address-list find list=putio]
/ipv6 firewall address-list remove [/ipv6 firewall address-list find list=putio]

# Add new entries
`

  // IPv4 entries
  const ipv4Script = ipv4Ranges
    .map((range) => `/ip firewall address-list add list=putio address=${range} comment="put.io"`)
    .join("\n")

  // IPv6 entries
  const ipv6Script = ipv6Ranges
    .map((range) => `/ipv6 firewall address-list add list=putio address=${range} comment="put.io"`)
    .join("\n")

  // Combine all sections
  return `${header}${ipv4Script ? `\n\n# IPv4 Ranges\n${ipv4Script}` : ""}${
    ipv6Script ? `\n\n# IPv6 Ranges\n${ipv6Script}` : ""
  }`
}

/**
 * Refresh the IP range cache
 */
export async function refreshCache(env: { DATA: KVNamespace; ANALYTICS?: AnalyticsEngineDataset }): Promise<void> {
  // Log to analytics if available
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: ["routeros", "cache", "refresh", "start"],
      doubles: [1],
      indexes: ["routeros_cache"]
    })
  }

  // Check if cache refresh is already in progress
  const metadata = await getCacheStatus(env)
  if (metadata.updateInProgress) {
    console.log("Cache refresh already in progress")
    return
  }

  // Set update in progress flag
  await env.DATA.put(
    KV_PUTIO_METADATA,
    JSON.stringify({
      ...metadata,
      updateInProgress: true,
      lastAttempt: new Date().toISOString()
    })
  )

  try {
    // Fetch data from sources
    console.log("Fetching data from RIPE and BGPView")
    const [ripeData, bgpViewData] = await Promise.all([fetchRipeData(), fetchBGPViewData()])

    // Process data
    console.log("Processing IP ranges")
    const ipv4Ranges = processIPRanges(ripeData, bgpViewData, 4)
    const ipv6Ranges = processIPRanges(ripeData, bgpViewData, 6)

    // Generate script
    console.log("Generating RouterOS script")
    const script = generateScript({
      ipv4Ranges,
      ipv6Ranges,
      lastUpdated: new Date().toISOString(),
      lastError: null
    })

    // Store in KV
    console.log("Storing data in KV")
    const cacheTtl = CACHE_TTL * 2 // Double the TTL for the cache data

    await Promise.all([
      env.DATA.put(KV_CACHE_IPV4, JSON.stringify(ipv4Ranges), { expirationTtl: cacheTtl }),
      env.DATA.put(KV_CACHE_IPV6, JSON.stringify(ipv6Ranges), { expirationTtl: cacheTtl }),
      env.DATA.put(KV_CACHE_SCRIPT, script, { expirationTtl: cacheTtl }),
      env.DATA.put(
        KV_PUTIO_METADATA,
        JSON.stringify({
          lastUpdated: new Date().toISOString(),
          lastError: null,
          lastAttempt: new Date().toISOString(),
          updateInProgress: false
        }),
        { expirationTtl: cacheTtl }
      )
    ])

    // Update shared metrics
    const sharedMetadata = await getSharedMetadata(env)
    await updateSharedMetadata(
      env,
      {
        ...sharedMetadata,
        lastRefresh: new Date().toISOString(),
        refreshCount: ((sharedMetadata.refreshCount as number) || 0) + 1
      },
      cacheTtl
    )

    // Log successful refresh to analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ["routeros", "cache", "refresh", "success"],
        doubles: [1],
        indexes: ["routeros_cache"]
      })
    }

    console.log("Cache refresh completed successfully")
  } catch (error) {
    // Store error in metadata
    console.error("Error refreshing cache:", error)
    await env.DATA.put(
      KV_PUTIO_METADATA,
      JSON.stringify({
        ...metadata,
        lastError: error instanceof Error ? error.message : "Unknown error",
        lastAttempt: new Date().toISOString(),
        updateInProgress: false
      })
    )

    // Log error to analytics
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: ["routeros", "cache", "refresh", "error", error instanceof Error ? error.message : "Unknown error"],
        doubles: [1],
        indexes: ["routeros_cache_error"]
      })
    }
  }
}

/**
 * Get the RouterOS script, refreshing the cache if necessary
 */
export async function getScript(env: { DATA: KVNamespace; ANALYTICS: AnalyticsEngineDataset }): Promise<string> {
  try {
    // Track the request
    env.ANALYTICS.writeDataPoint({
      blobs: ["routeros", "script", "request"],
      doubles: [1],
      indexes: ["routeros_script"]
    })

    // Get cache data
    const cacheData = await getCacheData(env)

    // If cache is stale, refresh in the background
    let refreshPromise: Promise<void> | null = null
    if (isCacheStale(cacheData) && !(await getCacheStatus(env)).updateInProgress) {
      console.log("Cache is stale, refreshing in background")
      refreshPromise = refreshCache(env).catch((error) => {
        console.error("Background cache refresh failed:", error)
      })
    }

    // Try to get cached script first
    const cachedScript = await env.DATA.get(KV_CACHE_SCRIPT)
    if (cachedScript) {
      console.log("Using cached script")
      return cachedScript
    }

    // If we don't have a cached script but have IP ranges, generate it
    if (cacheData.ipv4Ranges.length > 0 || cacheData.ipv6Ranges.length > 0) {
      console.log("Generating script from cached IP ranges")
      return generateScript(cacheData)
    }

    // If we have no cache at all, refresh and return
    console.log("No cached data available, refreshing")
    if (!refreshPromise) {
      await refreshCache(env)
    } else {
      await refreshPromise
    }

    // Try to get the script after refresh
    const script = await env.DATA.get(KV_CACHE_SCRIPT)
    if (script) {
      return script
    }

    // Get updated cache data in case script is still missing
    const updatedCacheData = await getCacheData(env)
    return generateScript(updatedCacheData)
  } catch (error) {
    console.error("Error getting RouterOS script:", error)
    throw new Error(`Failed to get RouterOS script: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Reset the cache (clear all data)
 */
export async function resetCache(env: { DATA: KVNamespace; ANALYTICS: AnalyticsEngineDataset }): Promise<void> {
  try {
    // Track the reset
    env.ANALYTICS.writeDataPoint({
      blobs: ["routeros", "cache", "reset"],
      doubles: [1],
      indexes: ["routeros_cache"]
    })

    // Delete all cache keys
    await Promise.all([
      env.DATA.delete(KV_CACHE_IPV4),
      env.DATA.delete(KV_CACHE_IPV6),
      env.DATA.delete(KV_CACHE_SCRIPT),
      env.DATA.delete(KV_PUTIO_METADATA)
    ])

    // Update shared metadata to track the reset
    const sharedMetadata = await getSharedMetadata(env)
    await updateSharedMetadata(env, {
      ...sharedMetadata,
      lastReset: new Date().toISOString(),
      resetCount: ((sharedMetadata.resetCount as number) || 0) + 1
    })

    console.log("Cache reset successfully")
  } catch (error) {
    console.error("Error resetting cache:", error)
    throw new Error(`Failed to reset cache: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
