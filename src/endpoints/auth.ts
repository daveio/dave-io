import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, extractTokenFromRequest, verifyJWT } from "../lib/auth"

export class Auth extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "JWT authentication info endpoint",
    description: "Returns detailed information about the provided JWT token, accepts any valid JWT subject",
    responses: {
      200: {
        description: "Successful authentication with JWT details",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              jwt: z.object({
                subject: z.string(),
                subjectParts: z.array(z.string()),
                issuedAt: z.number(),
                expiresAt: z.number().nullable(),
                timeToExpiry: z.number().nullable(),
                isExpired: z.boolean()
              }),
              user: z.object({
                id: z.string()
              }),
              timestamp: z.string()
            })
          }
        }
      },
      401: {
        description: "Authentication required or invalid token",
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
    const jwtSecret = c.env.API_JWT_SECRET
    if (!jwtSecret) {
      console.error("API_JWT_SECRET environment variable not set")
      return c.json({ error: "Authentication not configured" }, 500)
    }

    const token = extractTokenFromRequest(c)
    if (!token) {
      return c.json({ error: "Authentication required" }, 401)
    }

    const payload = await verifyJWT(token, jwtSecret)
    if (!payload) {
      return c.json({ error: "Invalid token" }, 401)
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const timeToExpiry = payload.exp ? payload.exp - currentTime : null
    const isExpired = timeToExpiry !== null && timeToExpiry <= 0

    if (isExpired) {
      return c.json({ error: "Token expired" }, 401)
    }

    // Split subject by colons to show the hierarchical structure
    const subjectParts = payload.sub.split(":")

    return c.json({
      message: "Authentication successful! JWT details retrieved.",
      jwt: {
        subject: payload.sub,
        subjectParts: subjectParts,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        timeToExpiry: timeToExpiry,
        isExpired: isExpired
      },
      user: {
        id: payload.sub
      },
      timestamp: new Date().toISOString()
    })
  }
}
