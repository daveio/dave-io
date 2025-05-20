import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { getCacheData, getCacheStatus, getScript, getSharedMetadata, refreshCache, resetCache } from "../kv/routeros"
import { RouterOSCacheStatusSchema, RouterOSErrorSchema, RouterOSResetResponseSchema } from "../schemas"

export class RouterOSPutIO extends OpenAPIRoute {
  schema = {
    tags: ["RouterOS"],
    summary: "Generate RouterOS script for put.io IP ranges",
    responses: {
      "200": {
        description: "RouterOS script for put.io IP ranges",
        content: {
          "text/plain": {
            schema: RouterOSErrorSchema.shape.message
          }
        }
      },
      "500": {
        description: "Error fetching or processing IP data",
        content: {
          "application/json": {
            schema: RouterOSErrorSchema
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
            schema: RouterOSCacheStatusSchema
          }
        }
      },
      "500": {
        description: "Error retrieving cache status",
        content: {
          "application/json": {
            schema: RouterOSErrorSchema
          }
        }
      }
    }
  }

  // Add Durable Object compatibility methods
  state: DurableObjectState | null = null;
  env: Record<string, unknown> = null as unknown as Record<string, unknown>;

  // Durable Object constructor
  constructor(
    options?: { router: unknown; raiseUnknownParameters: boolean; route: string; urlParams: string[] } | DurableObjectState,
    env?: Record<string, unknown>
  ) {
    if (options && "router" in options) {
      // OpenAPIRoute constructor
      super(options);
    } else {
      // Durable Object constructor
      super({ router: {}, raiseUnknownParameters: false, route: "", urlParams: [] });
      if (options && env) {
        this.state = options as DurableObjectState;
        this.env = env;
      }
    }
  }

  // Required fetch method for Durable Objects
  async fetch(_request: Request): Promise<Response> {
    // This is a placeholder method to satisfy the Durable Object interface
    // It won't actually be used since we're migrating away from this class being a DO
    return new Response("OK", { status: 200 });
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
            schema: RouterOSResetResponseSchema
          }
        }
      },
      "500": {
        description: "Error resetting cache",
        content: {
          "application/json": {
            schema: RouterOSErrorSchema
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
