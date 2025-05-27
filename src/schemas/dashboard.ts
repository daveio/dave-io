import { z } from "zod"
import { ErrorResponseSchema } from "./common"

export const DashboardParamSchema = z.object({
  name: z.enum(["demo", "hn"]).describe("Dashboard name - 'demo' for demo dashboard or 'hn' for Hacker News feed")
})

export const DashboardItemSchema = z.object({
  title: z.string().describe("Item title"),
  link: z.string().url().optional().describe("Optional link URL"),
  description: z.string().optional().describe("Optional description"),
  timestamp: z.string().optional().describe("Optional timestamp")
})

export const DashboardResponseSchema = z.object({
  name: z.string().describe("Dashboard name"),
  items: z.array(DashboardItemSchema).describe("Dashboard items"),
  lastUpdated: z.string().describe("ISO timestamp of last update"),
  count: z.number().int().min(0).describe("Number of items")
})

export const DashboardRouteSchema = {
  tags: ["Dashboard"],
  summary: "Get dashboard data",
  description:
    "Retrieves dashboard data feed. Supports 'demo' dashboard with static items and 'hn' for Hacker News feed.",
  request: {
    params: DashboardParamSchema
  },
  responses: {
    200: {
      description: "Dashboard data retrieved successfully",
      content: {
        "application/json": {
          schema: DashboardResponseSchema
        }
      }
    },
    404: {
      description: "Dashboard not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    }
  }
}
