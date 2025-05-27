import type { Context } from "hono"
import { type AuthorizedContext, extractTokenFromRequest, verifyJWT } from "../lib/auth"

export class Auth {
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
