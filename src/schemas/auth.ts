import { z } from "zod"
import { CommonHeaders, ErrorResponseSchema, JWTDetailsSchema, UserSchema } from "./common"

export const AuthSuccessResponseSchema = z.object({
  message: z.string().describe("Authentication success message"),
  jwt: JWTDetailsSchema.describe("JWT token details"),
  user: UserSchema.describe("Authenticated user information"),
  timestamp: z.string().describe("ISO timestamp when response was generated")
})

export const AuthQuerySchema = z.object({
  token: z.string().optional().describe("JWT token as query parameter (alternative to Authorization header)")
})

export const AuthRouteSchema = {
  tags: ["Authentication"],
  summary: "Test JWT authentication",
  description:
    "Endpoint to test JWT authentication and retrieve token details. Accepts tokens via Authorization header or query parameter.",
  request: {
    query: AuthQuerySchema
  },
  responses: {
    200: {
      description: "Authentication successful",
      content: {
        "application/json": {
          schema: AuthSuccessResponseSchema
        }
      }
    },
    401: {
      description: "Authentication failed - missing or invalid token",
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
