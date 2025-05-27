import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"

export class Ping extends OpenAPIRoute {
  schema = {
    tags: ["Health Check"],
    summary: "Ping endpoint for health checking",
    description: "Simple endpoint to check if the API service is running",
    responses: {
      200: {
        description: "Service is healthy",
        content: {
          "application/json": {
            schema: z.object({
              service: z.string().describe("Service name"),
              response: z.string().describe("Ping response")
            })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    c.env.ANALYTICS.writeDataPoint({
      blobs: ["ping_request"],
      indexes: ["ping"]
    })
    return c.json({ service: "api", response: "pong" })
  }
}
