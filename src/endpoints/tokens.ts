import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { getTokenUsage, revokeToken, unrevokeToken } from "../kv/auth"
import { authorizeEndpoint } from "../lib/auth"
import {
  TokenErrorSchema,
  TokenParamsSchema,
  TokenRevocationRequestSchema,
  TokenRevocationResponseSchema,
  TokenUsageSchema
} from "../schemas/tokens.schema"

export class TokenUsageEndpoint extends OpenAPIRoute {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Authentication"],
    summary: "Get token usage information",
    description: "Get detailed usage information for a specific token by UUID",
    request: {
      params: TokenParamsSchema
    },
    responses: {
      200: {
        description: "Token usage information",
        content: {
          "application/json": {
            schema: TokenUsageSchema
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: TokenErrorSchema
          }
        }
      },
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: TokenErrorSchema
          }
        }
      },
      404: {
        description: "Token not found",
        content: {
          "application/json": {
            schema: TokenErrorSchema
          }
        }
      }
    }
  } as OpenAPIRouteSchema

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
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Authentication"],
    summary: "Revoke a token",
    description: "Revoke a token by UUID, preventing further use",
    request: {
      params: TokenParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: TokenRevocationRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: "Token revocation status updated",
        content: {
          "application/json": {
            schema: TokenRevocationResponseSchema
          }
        }
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: TokenErrorSchema
          }
        }
      },
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: TokenErrorSchema
          }
        }
      }
    }
  } as OpenAPIRouteSchema

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
