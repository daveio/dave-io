import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import {
  getCacheData,
  getCacheStatus,
  getScript,
  getSharedMetadata,
  refreshCache,
  resetCache
} from "../kv/routeros"

export class RouterOSPutIO extends OpenAPIRoute {
  schema = {
    tags: ["RouterOS"],
    summary: "Generate RouterOS script for put.io IP ranges",
    responses: {
      "200": {
        description: "RouterOS script for put.io IP ranges",
        content: {
          "text/plain": {
            schema: z.string()
          }
        }
      },
      "500": {
        description: "Error fetching or processing IP data",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              message: z.string()
            })
          }
        }
      }
    }
  }

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

export class RouterOSCache extends OpenAPIRoute {
  schema = {
    tags: ["RouterOS"],
    summary: "Get cache status for RouterOS data",
    responses: {
      "200": {
        description: "Cache status information",
        content: {
          "application/json": {
            schema: z.object({
              putio: z.object({
                lastUpdated: z.string().nullable(),
                lastError: z.string().nullable(),
                lastAttempt: z.string().nullable(),
                updateInProgress: z.boolean(),
                ipv4Count: z.number(),
                ipv6Count: z.number()
              }),
              shared: z.record(z.unknown()),
              providers: z.array(z.string())
            })
          }
        }
      },
      "500": {
        description: "Error retrieving cache status",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              message: z.string()
            })
          }
        }
      }
    }
  }

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

export class RouterOSReset extends OpenAPIRoute {
  schema = {
    tags: ["RouterOS"],
    summary: "Reset the cache for RouterOS data",
    responses: {
      "200": {
        description: "Cache reset confirmation",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string()
            })
          }
        }
      },
      "500": {
        description: "Error resetting cache",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              message: z.string()
            })
          }
        }
      }
    }
  }

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
