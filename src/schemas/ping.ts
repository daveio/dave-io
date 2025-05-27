import { z } from "zod"
import { ErrorResponseSchema } from "./common"

export const PingResponseSchema = z.object({
  service: z.string().describe("Service name"),
  response: z.string().describe("Ping response")
})

export const PingRouteSchema = {
  tags: ["Health Check"],
  summary: "Ping endpoint for health checking",
  description: "Simple endpoint to check if the API service is running",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: PingResponseSchema
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
