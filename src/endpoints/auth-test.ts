import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, requireAuth } from "../lib/auth"

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
      }
    }
  }

  async handle(c: Context) {
    const authMiddleware = requireAuth()

    // The middleware will return a Response if authentication fails
    // We need to capture and check the result
    let authResult: Response | undefined

    try {
      authResult = await authMiddleware(c, async () => {
        // This empty function will only be called if auth succeeds
      })
    } catch (error) {
      console.error("Auth middleware error:", error)
      return c.json({ error: "Authentication failed" }, 500)
    }

    // If the middleware returned a Response, it means auth failed
    if (authResult instanceof Response) {
      return authResult
    }

    // If we get here, authentication succeeded
    const authContext = c as AuthorizedContext

    return c.json({
      message: "Authentication successful! You have access to this protected endpoint.",
      user: authContext.user,
      timestamp: new Date().toISOString()
    })
  }
}
