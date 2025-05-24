import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, requireAuth } from "../lib/auth"
import { COMMON_SCOPES } from "../schemas"

export class AuthTest extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Test endpoint for JWT authentication",
    description: "A protected endpoint that requires authentication with 'read' scope",
    responses: {
      200: {
        description: "Successful authentication",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              user: z.object({
                id: z.string(),
                scopes: z.array(z.string())
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
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
              required: z.array(z.string()),
              granted: z.array(z.string())
            })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    const authMiddleware = requireAuth([COMMON_SCOPES.READ])

    try {
      await authMiddleware(c, async () => {})
    } catch (_error) {
      return c.json({ error: "Authentication failed" }, 500)
    }

    const authContext = c as AuthorizedContext

    return c.json({
      message: "Authentication successful! You have access to this protected endpoint.",
      user: authContext.user,
      timestamp: new Date().toISOString()
    })
  }
}
