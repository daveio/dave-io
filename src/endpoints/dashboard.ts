import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import Parser from "rss-parser"
import { DashboardErrorSchema, DashboardItemSchema, DashboardParamsSchema, DashboardResponseSchema } from "../schemas"

export class Dashboard extends OpenAPIRoute {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Dashboard"],
    summary: "Get dashboard data by name",
    request: {
      // @ts-ignore - Type instantiation issue
      params: DashboardParamsSchema
    },
    responses: {
      "200": {
        description: "Dashboard data",
        content: {
          "application/json": {
            schema: DashboardResponseSchema
          }
        }
      },
      "404": {
        description: "Dashboard not found",
        content: {
          "application/json": {
            schema: DashboardErrorSchema
          }
        }
      }
    }
  } as OpenAPIRouteSchema

  async handle(c: Context) {
    // Extract name directly from context params
    const name = c.req.param("name")
    if (!name) {
      return c.json({ error: "No dashboard name provided" }, 404)
    }

    c.env.ANALYTICS.writeDataPoint({
      blobs: ["dashboard_request", name],
      indexes: ["dashboard"]
    })

    // Execute different code paths based on dashboard name
    switch (name) {
      case "demo":
        return c.json({
          dashboard: name,
          error: null,
          items: [
            {
              title: "Item 1",
              subtitle: "Subtitle 1",
              linkURL: "https://example.com",
              imageURL: "https://example.com/image.png"
            },
            {
              title: "Item 2",
              subtitle: "Subtitle 2",
              linkURL: "https://example.com",
              imageURL: "https://example.com/image.png"
            }
          ],
          timestamp: Date.now()
        })
      case "hacker-news":
        try {
          const response = await fetch("https://news.ycombinator.com/rss")
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const feedText = await response.text()

          const parser = new Parser()
          const feed = await parser.parseString(feedText)

          return c.json({
            dashboard: name,
            error: null,
            items: feed.items.map((item) => ({
              title: item.title || "No Title",
              subtitle: item.creator || "Hacker News",
              linkURL: item.link || "https://news.ycombinator.com"
            })),
            timestamp: Date.now()
          })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          return c.json(
            {
              error: `Failed to fetch Hacker News feed: ${errorMessage}`
            },
            500
          )
        }
      default:
        return c.json({ error: `Dashboard '${name}' not found` }, 404)
    }
  }
}
