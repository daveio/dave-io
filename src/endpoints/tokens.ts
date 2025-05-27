import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { getTokenUsage, revokeToken, unrevokeToken } from "../kv/auth"
import { authorizeEndpoint } from "../lib/auth"
import { TokenRevokeRouteSchema, TokenUsageRouteSchema } from "../schemas/tokens"

export class TokenUsageEndpoint extends OpenAPIRoute {
  schema = TokenUsageRouteSchema
  async handle(c: Context) {
    return authorizeEndpoint("tokens", "read")(c, async () => {
      const { uuid } = c.req.param()

      try {
        const usage = await getTokenUsage(c.env, uuid)

        return c.json({
          uuid,
          ...usage
        })
      } catch (error) {
        console.error("Error getting token usage:", error)
        return c.json({ error: "Failed to get token usage" }, 500)
      }
    })
  }
}

export class TokenRevokeEndpoint extends OpenAPIRoute {
  schema = TokenRevokeRouteSchema
  async handle(c: Context) {
    return authorizeEndpoint("tokens", "write")(c, async () => {
      const { uuid } = c.req.param()
      const { revoked } = await c.req.json()

      try {
        if (revoked) {
          await revokeToken(c.env, uuid)
        } else {
          await unrevokeToken(c.env, uuid)
        }

        return c.json({
          uuid,
          revoked,
          message: revoked ? "Token revoked successfully" : "Token unrevoked successfully"
        })
      } catch (error) {
        console.error("Error updating token revocation:", error)
        return c.json({ error: "Failed to update token revocation" }, 500)
      }
    })
  }
}
