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
      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Call the Durable Object to get the RouterOS script
      const response = await stub.fetch("https://putio-cache.internal/script")

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
    summary: "Get cache status for put.io IP ranges",
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
      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Call the Durable Object to get cache status
      const response = await stub.fetch("https://putio-cache.internal/status")

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
    summary: "Reset the cache for put.io IP ranges",
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
      // Get the Durable Object stub
      const id = c.env.ROUTEROS_CACHE.idFromName("putio-ip-ranges")
      const stub = c.env.ROUTEROS_CACHE.get(id)

      // Call the Durable Object to reset the cache
      const response = await stub.fetch("https://putio-cache.internal/reset", {
        method: "POST"
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
