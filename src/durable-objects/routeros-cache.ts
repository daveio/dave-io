import { ipv4, ipv6 } from "../lib/ip-address-utils"

// Interfaces for API responses
interface RipePrefix {
  prefix: string
}

interface RipeData {
  data: {
    prefixes: RipePrefix[]
  }
}

interface BGPViewPrefix {
  prefix: string
  ip: string
  cidr: number
  routed: boolean
}

interface BGPViewData {
  data: {
    ipv4_prefixes: BGPViewPrefix[]
    ipv6_prefixes: BGPViewPrefix[]
  }
}

interface CacheData {
  ipv4Ranges: string[]
  ipv6Ranges: string[]
  lastUpdated: string | null
  lastError: string | null
}

export type Env = {
  ANALYTICS?: AnalyticsEngineDataset
}

export class RouterOSCache {
  state: DurableObjectState
  env: Env
  cacheData: CacheData

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.cacheData = {
      ipv4Ranges: [],
      ipv6Ranges: [],
      lastUpdated: null,
      lastError: null
    }

    // Initialize cache from storage
    this.state.blockConcurrencyWhile(async () => {
      const storedData = (await this.state.storage.get("cacheData")) as CacheData | undefined
      if (storedData) {
        this.cacheData = storedData
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Check if analytics is available via query param
    const hasAnalytics =
      url.searchParams.get("with_analytics") === "true" || request.headers.get("CF-Analytics-Available") === "true"

    if (path === "/script") {
      return await this.handleScriptRequest(hasAnalytics)
    }
    if (path === "/status") {
      return await this.handleStatusRequest(hasAnalytics)
    }
    if (path === "/reset" && request.method === "POST") {
      return await this.handleResetRequest(hasAnalytics)
    }
    return new Response("Not found", { status: 404 })
  }

  async handleScriptRequest(hasAnalytics = false): Promise<Response> {
    try {
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_script_request"],
          indexes: ["routeros_cache"]
        })
      }

      // Check if cache needs to be refreshed
      const needsRefresh = await this.checkCacheNeedsRefresh()

      if (needsRefresh) {
        await this.refreshCache(hasAnalytics)
      }

      // Generate the RouterOS script
      const script = this.generateRouterOSScript()

      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_script_generated"],
          doubles: [this.cacheData.ipv4Ranges.length, this.cacheData.ipv6Ranges.length],
          indexes: ["routeros_cache"]
        })
      }

      return new Response(script, {
        headers: { "Content-Type": "text/plain" }
      })
    } catch (error) {
      console.error("Error handling script request:", error)

      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_script_error", error instanceof Error ? error.message : "Unknown error"],
          indexes: ["routeros_cache"]
        })
      }

      return new Response(
        JSON.stringify({
          error: "ScriptGenerationError",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  async handleStatusRequest(hasAnalytics = false): Promise<Response> {
    try {
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_status_check"],
          indexes: ["routeros_cache"]
        })
      }

      const now = new Date()
      const lastUpdated = this.cacheData.lastUpdated ? new Date(this.cacheData.lastUpdated) : null

      let ageInSeconds = null
      let isStale = true

      if (lastUpdated) {
        ageInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
        isStale = ageInSeconds > 3600 // 1 hour in seconds
      }

      const status = {
        lastUpdated: this.cacheData.lastUpdated,
        ageInSeconds,
        isStale,
        lastError: this.cacheData.lastError,
        status: this.cacheData.lastUpdated ? "ok" : "uninitiated",
        ipv4Count: this.cacheData.ipv4Ranges.length,
        ipv6Count: this.cacheData.ipv6Ranges.length
      }

      return new Response(JSON.stringify(status), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("Error handling status request:", error)

      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_status_error", error instanceof Error ? error.message : "Unknown error"],
          indexes: ["routeros_cache"]
        })
      }

      return new Response(
        JSON.stringify({
          error: "StatusError",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  async handleResetRequest(hasAnalytics = false): Promise<Response> {
    try {
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_reset_initiated"],
          indexes: ["routeros_cache"]
        })
      }

      // Reset the cache data
      this.cacheData = {
        ipv4Ranges: [],
        ipv6Ranges: [],
        lastUpdated: null,
        lastError: null
      }

      // Save to storage
      await this.state.storage.put("cacheData", this.cacheData)

      // Fetch new data
      await this.refreshCache(hasAnalytics)

      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_reset_completed"],
          indexes: ["routeros_cache"]
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Cache reset and refreshed successfully"
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      )
    } catch (error) {
      console.error("Error handling reset request:", error)

      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_reset_error", error instanceof Error ? error.message : "Unknown error"],
          indexes: ["routeros_cache"]
        })
      }

      return new Response(
        JSON.stringify({
          error: "ResetError",
          message: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  async checkCacheNeedsRefresh(): Promise<boolean> {
    // If there's no cached data, we definitely need to refresh
    if (!this.cacheData.lastUpdated) {
      return true
    }

    // Check if the cache is more than an hour old
    const lastUpdated = new Date(this.cacheData.lastUpdated)
    const now = new Date()
    const ageInSeconds = (now.getTime() - lastUpdated.getTime()) / 1000

    return ageInSeconds > 3600 // 1 hour in seconds
  }

  async refreshCache(hasAnalytics = false): Promise<void> {
    try {
      // Track cache refresh attempt
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_refresh_attempt"],
          indexes: ["routeros_cache"]
        })
      }

      // Fetch data from RIPE and BGPView
      const [ripeData, bgpViewData] = await Promise.all([this.fetchRipeData(), this.fetchBGPViewData()])

      // Process IPv4 addresses
      const ipv4Ranges = this.processIPRanges(ripeData, bgpViewData, 4)

      // Process IPv6 addresses
      const ipv6Ranges = this.processIPRanges(ripeData, bgpViewData, 6)

      // Merge and sort the ranges
      const mergedIPv4Ranges = this.mergeIPRanges(ipv4Ranges, 4)
      const mergedIPv6Ranges = this.mergeIPRanges(ipv6Ranges, 6)

      // Update cache data
      this.cacheData = {
        ipv4Ranges: mergedIPv4Ranges,
        ipv6Ranges: mergedIPv6Ranges,
        lastUpdated: new Date().toISOString(),
        lastError: null
      }

      // Save to storage
      await this.state.storage.put("cacheData", this.cacheData)

      // Track successful cache refresh
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_refresh_success"],
          doubles: [mergedIPv4Ranges.length, mergedIPv6Ranges.length],
          indexes: ["routeros_cache"]
        })
      }
    } catch (error) {
      console.error("Error refreshing cache:", error)

      // Update last error in cache data
      this.cacheData.lastError = error instanceof Error ? error.message : "Unknown error"

      // Save to storage
      await this.state.storage.put("cacheData", this.cacheData)

      // Track cache refresh error
      if (hasAnalytics && this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["routeros_cache_refresh_error", this.cacheData.lastError],
          indexes: ["routeros_cache"]
        })
      }

      throw error
    }
  }

  async fetchRipeData(): Promise<RipeData> {
    const response = await fetch("https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS9009")

    if (!response.ok) {
      throw new Error(`Failed to fetch RIPE data: ${response.status}`)
    }

    return (await response.json()) as RipeData
  }

  async fetchBGPViewData(): Promise<BGPViewData> {
    const response = await fetch("https://api.bgpview.io/asn/9009/prefixes")

    if (!response.ok) {
      throw new Error(`Failed to fetch BGPView data: ${response.status}`)
    }

    return (await response.json()) as BGPViewData
  }

  processIPRanges(ripeData: RipeData, bgpViewData: BGPViewData, version: 4 | 6): string[] {
    const ranges = new Set<string>()

    // Process RIPE data
    if (ripeData?.data?.prefixes) {
      for (const prefix of ripeData.data.prefixes) {
        // Filter by IP version
        if (version === 4 && prefix.prefix.includes(":")) continue
        if (version === 6 && !prefix.prefix.includes(":")) continue

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
    const mergedRanges = this.mergeIPRanges(Array.from(ranges), version)

    return mergedRanges
  }

  mergeIPRanges(ranges: string[], version: 4 | 6): string[] {
    if (ranges.length === 0) return []

    try {
      // Use the ip-address-utils library to merge ranges
      if (version === 4) {
        const rangeSet = ipv4.cidrMerge(ranges)
        return Array.from(rangeSet)
      }
      const rangeSet = ipv6.cidrMerge(ranges)
      return Array.from(rangeSet)
    } catch (error) {
      // Use a fixed format string with interpolation to avoid unsafe format string
      if (version === 4) {
        console.error("Error merging IPv4 ranges:", error)
      } else {
        console.error("Error merging IPv6 ranges:", error)
      }
      // If merging fails, return the original ranges
      return ranges
    }
  }

  generateRouterOSScript(): string {
    const lines: string[] = []

    // Add comments
    lines.push("# RouterOS script for put.io IP ranges")
    lines.push(`# Generated at: ${new Date().toISOString()}`)
    lines.push(`# IPv4 Ranges: ${this.cacheData.ipv4Ranges.length}`)
    lines.push(`# IPv6 Ranges: ${this.cacheData.ipv6Ranges.length}`)
    lines.push("")

    // Create or reset IPv4 address list
    lines.push("# IPv4 address list setup")
    lines.push("/ip firewall address-list")
    lines.push("remove [find list=putio-ipv4]")

    // Add IPv4 ranges
    if (this.cacheData.ipv4Ranges.length > 0) {
      for (const range of this.cacheData.ipv4Ranges) {
        lines.push(`add address=${range} list=putio-ipv4 comment="put.io IPv4 range"`)
      }
    } else {
      lines.push("# No IPv4 ranges found")
    }

    lines.push("")

    // Create or reset IPv6 address list
    lines.push("# IPv6 address list setup")
    lines.push("/ipv6 firewall address-list")
    lines.push("remove [find list=putio-ipv6]")

    // Add IPv6 ranges
    if (this.cacheData.ipv6Ranges.length > 0) {
      for (const range of this.cacheData.ipv6Ranges) {
        lines.push(`add address=${range} list=putio-ipv6 comment="put.io IPv6 range"`)
      }
    } else {
      lines.push("# No IPv6 ranges found")
    }

    return lines.join("\n")
  }
}
