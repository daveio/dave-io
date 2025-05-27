import type { Context } from "hono"

export class Ping {
  async handle(c: Context) {
    c.env.ANALYTICS.writeDataPoint({
      blobs: ["ping_request"],
      indexes: ["ping"]
    })
    return c.json({ service: "api", response: "pong" })
  }
}
