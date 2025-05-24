import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { auth } from "../lib/auth"
import { JwtPayload } from "../schemas"
import { z } from "zod"

/**
 * Example of a protected endpoint that requires authentication
 */
export class Protected extends OpenAPIRoute {
  schema = {
    tags: ["Protected"],
    summary: "Protected endpoint requiring authentication",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Protected resource",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              user: z.string(),
              scopes: z.array(z.string())
            })
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      "403": {
        description: "Forbidden",
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

  // Use the auth middleware with required scopes
  middleware = [
    auth({ scopes: ["read:protected"] })
  ]

  async handle(c: Context) {
    // Get the JWT payload from the context
    const payload = c.get("jwtPayload") as JwtPayload
    
    return c.json({
      message: "This is a protected resource",
      user: payload.sub,
      scopes: payload.scopes
    })
  }
}

/**
 * Example of a protected admin endpoint that requires specific scopes
 */
export class ProtectedAdmin extends OpenAPIRoute {
  schema = {
    tags: ["Protected"],
    summary: "Protected admin endpoint requiring specific scopes",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": {
        description: "Protected admin resource",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              user: z.string(),
              scopes: z.array(z.string())
            })
          }
        }
      },
      "401": {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string()
            })
          }
        }
      },
      "403": {
        description: "Forbidden",
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

  // Use the auth middleware with required admin scopes
  middleware = [
    auth({ scopes: ["admin:access"] })
  ]

  async handle(c: Context) {
    // Get the JWT payload from the context
    const payload = c.get("jwtPayload") as JwtPayload
    
    return c.json({
      message: "This is a protected admin resource",
      user: payload.sub,
      scopes: payload.scopes
    })
  }
}
