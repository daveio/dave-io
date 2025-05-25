import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, authorizeEndpoint } from "../lib/auth"

export class AuthTest extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Test endpoint for JWT authentication",
    description: "A protected endpoint that requires authentication",
    responses: {
      200: {
        description: "Successful authentication",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              user: z.object({
                id: z.string()
              }),
              timestamp: z.string()
            })
          }
        }
      },
      401: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      403: {
        description: "Authorization failed",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    // Using the new authorizeEndpoint helper with 'auth' endpoint and 'test' subresource
    // JWT subject must be either 'auth' or 'auth:test' to access this endpoint
    return authorizeEndpoint("auth", "test")(c, async () => {
      const authContext = c as AuthorizedContext

      return c.json({
        message: "Authentication successful! You have access to this protected endpoint.",
        user: authContext.user,
        timestamp: new Date().toISOString()
      })
    })
  }
}
