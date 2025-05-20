import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { PingResponseSchema } from "../schemas"

export class Ping extends OpenAPIRoute {
  schema = {
    tags: ["Ping"],
    summary: "Ping the API",
    responses: {
      "200": {
        description: "Ping reply",
        content: {
          "application/json": {
            schema: PingResponseSchema
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
