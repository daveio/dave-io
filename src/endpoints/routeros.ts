import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"

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
      // Track analytics
      c.env.ANALYTICS.writeDataPoint({
        blobs: ["routeros_putio_request"],
        indexes: ["routeros"]
      })

      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Create a URL with environment data
      const url = new URL("https://routeros-cache.internal/script")
      // Pass the analytics binding to the Durable Object
      url.searchParams.set("with_analytics", "true")

      // Call the Durable Object to get the RouterOS script
      const response = await stub.fetch(url, {
        headers: {
          "CF-Analytics-Available": "true"
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return c.json({ error: "InternalError", message: error.message }, 500)
      }

      // Return the RouterOS script as plain text
      const script = await response.text()
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
              lastUpdated: z.string().optional(),
              ageInSeconds: z.number().optional(),
              isStale: z.boolean(),
              lastError: z.string().nullable(),
              status: z.string()
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
        blobs: ["routeros_cache_status_request"],
        indexes: ["routeros"]
      })

      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Create a URL with environment data
      const url = new URL("https://routeros-cache.internal/status")
      // Pass the analytics binding to the Durable Object
      url.searchParams.set("with_analytics", "true")

      // Call the Durable Object to get cache status
      const response = await stub.fetch(url, {
        headers: {
          "CF-Analytics-Available": "true"
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return c.json({ error: "InternalError", message: error.message }, 500)
      }

      const status = await response.json()
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
      // Track analytics
      c.env.ANALYTICS.writeDataPoint({
        blobs: ["routeros_cache_reset_request"],
        indexes: ["routeros"]
      })

      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Create a URL with environment data
      const url = new URL("https://routeros-cache.internal/reset")
      // Pass the analytics binding to the Durable Object
      url.searchParams.set("with_analytics", "true")

      // Call the Durable Object to reset the cache
      const response = await stub.fetch(url, {
        method: "POST",
        headers: {
          "CF-Analytics-Available": "true"
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return c.json({ error: "InternalError", message: error.message }, 500)
      }

      const result = await response.json()
      return c.json(result)
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
