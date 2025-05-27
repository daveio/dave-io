import type { Context } from "hono"
import { getCacheData, getCacheStatus, getScript, getSharedMetadata, refreshCache, resetCache } from "../kv/routeros"

export class RouterOSPutIO {
  async handle(c: Context) {
    try {
      // Get the script from KV
      const script = await getScript(c.env)

      return c.text(script)
    } catch (error) {
      console.error("Error in RouterOSPutIO.handle:", error)
      return c.json(
        {
          error: "InternalError",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        500
      )
    }
  }
}

export class RouterOSCache {
  async handle(c: Context) {
    try {
      // Track analytics
      c.env.ANALYTICS.writeDataPoint({
        blobs: ["routeros", "cache", "status"],
        doubles: [1],
        indexes: ["routeros_status"]
      })

      // Get provider-specific cache status from KV
      const [putioStatus, cacheData, sharedMetadata] = await Promise.all([
        getCacheStatus(c.env),
        getCacheData(c.env),
        getSharedMetadata(c.env)
      ])

      // Build the response with both provider-specific and shared data
      const status = {
        putio: {
          ...putioStatus,
          ipv4Count: cacheData.ipv4Ranges.length,
          ipv6Count: cacheData.ipv6Ranges.length
        },
        shared: sharedMetadata,
        providers: ["putio"] // Will expand as more providers are added
      }

      return c.json(status)
    } catch (error) {
      console.error("Error in RouterOSCache.handle:", error)
      return c.json(
        {
          error: "InternalError",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        500
      )
    }
  }
}

export class RouterOSReset {
  async handle(c: Context) {
    try {
      // Reset the cache
      await resetCache(c.env)

      return c.json({
        success: true,
        message: "Cache reset successfully"
      })
    } catch (error) {
      console.error("Error in RouterOSReset.handle:", error)
      return c.json(
        {
          error: "InternalError",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        500
      )
    }
  }
}
