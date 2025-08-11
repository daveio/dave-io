import { getHeaders } from "h3"
import { z } from "zod"
import { extractToken, verifyJWT } from "../utils/auth"
import type { AuthResult } from "../utils/auth"
import { getCloudflareRequestInfo, getCloudflareEnv } from "../utils/cloudflare"
import { createTypedApiResponse } from "../utils/response-types"
import { PingResponseSchema } from "../utils/schemas"
import { extractEndpointContext, createLogger } from "../utils/logging"

/// <reference types="../../worker-configuration" />

// Type for accessing secrets from Cloudflare environment
interface SecretsEnv {
  API_JWT_SECRET?: SecretsStoreSecret
}

// Define the result schema for the ping endpoint
const PingResultSchema = z.object({
  pingData: PingResponseSchema,
  auth: z.object({
    supplied: z.boolean(),
    token: z
      .object({
        value: z.string(),
        valid: z.boolean(),
        payload: z
          .object({
            subject: z.string(),
            tokenId: z.string().nullable(),
            issuedAt: z.string(),
            expiresAt: z.string().nullable()
          })
          .optional()
      })
      .optional()
  }),
  headers: z.object({
    count: z.number(),
    cloudflare: z.record(z.string(), z.string()),
    forwarding: z.record(z.string(), z.string()),
    other: z.record(z.string(), z.string())
  })
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  // Initialize logger with basic context (no auth yet)
  const initialContext = extractEndpointContext(event)
  const logger = createLogger(initialContext)

  // Log incoming request
  logger.info("Ping endpoint received request", {
    userAgent: initialContext.request.userAgent,
    ip: initialContext.cloudflare.ip,
    country: initialContext.cloudflare.country
  })

  // Get Cloudflare request information
  const cfInfo = getCloudflareRequestInfo(event)
  logger.trace("Extracted Cloudflare request info", { cfInfo })

  // Get Cloudflare environment
  const env = getCloudflareEnv(event)
  logger.trace("Retrieved Cloudflare environment bindings", {
    hasKV: !!env.KV,
    hasAI: !!env.AI,
    hasD1: !!env.D1
  })

  // Try to extract and validate JWT token (optional)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authInfo: any = { supplied: false }
  let authResult: AuthResult | undefined
  const token = extractToken(event)

  if (token) {
    logger.info("JWT token detected in request", {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 8) + "..."
    })
    // Get secret from Cloudflare Secrets Store
    const secretsEnv = env as SecretsEnv
    let secret: string | null = null

    if (secretsEnv?.API_JWT_SECRET) {
      try {
        logger.trace("Retrieving JWT secret from Secrets Store")
        secret = await secretsEnv.API_JWT_SECRET.get()
        logger.trace("Successfully retrieved JWT secret")
      } catch (error) {
        logger.error(
          "Failed to retrieve API_JWT_SECRET from Secrets Store",
          {
            operation: "secret_retrieval",
            hasSecretsBinding: !!secretsEnv.API_JWT_SECRET
          },
          error
        )
        // Continue with null secret to mark token as invalid
      }
    } else {
      logger.warn("API_JWT_SECRET binding not available", {
        operation: "secret_retrieval"
      })
    }

    if (secret) {
      try {
        logger.trace("Verifying JWT token")
        const verification = await verifyJWT(token, secret)
        authResult = verification

        if (verification.success && verification.payload) {
          const { payload } = verification

          logger.info("JWT token validated successfully", {
            subject: payload.sub,
            tokenId: payload.jti || "none",
            issuedAt: new Date(payload.iat * 1000).toISOString(),
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : "never"
          })

          authInfo = {
            supplied: true,
            token: {
              value: token,
              valid: true,
              payload: {
                subject: payload.sub,
                tokenId: payload.jti || null,
                issuedAt: new Date(payload.iat * 1000).toISOString(),
                expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
              }
            }
          }
        } else {
          logger.warn("JWT token validation failed", {
            reason: verification.error || "unknown",
            tokenPrefix: token.substring(0, 8) + "..."
          })

          authInfo = {
            supplied: true,
            token: {
              value: token,
              valid: false
            }
          }
        }
      } catch (error) {
        logger.error(
          "Exception during JWT verification",
          {
            operation: "jwt_verification",
            tokenPrefix: token.substring(0, 8) + "..."
          },
          error
        )

        authInfo = {
          supplied: true,
          token: {
            value: token,
            valid: false
          }
        }
      }
    } else {
      logger.warn("Cannot verify JWT - no secret available", {
        operation: "jwt_verification"
      })

      authInfo = {
        supplied: true,
        token: {
          value: token,
          valid: false
        }
      }
    }
  } else {
    logger.trace("No JWT token provided in request")
  }

  // Update logger context with auth information if we have it
  if (authResult) {
    const _authContext = extractEndpointContext(event, authResult)
    logger.info("Request authentication context updated", {
      authenticated: authResult.success,
      subject: authResult.payload?.sub
    })
  }

  // Get all request headers
  logger.trace("Processing request headers")
  const headers = getHeaders(event)

  // Extract Cloudflare-specific headers
  const cloudflareHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().startsWith("cf-"))
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value || ""
        return acc
      },
      {} as Record<string, string>
    )

  // Extract forwarding headers
  const forwardingHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().includes("forward") || key.toLowerCase().includes("real-ip"))
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value || ""
        return acc
      },
      {} as Record<string, string>
    )

  // Extract other headers (excluding cf- and forwarding headers)
  const otherHeaders = Object.entries(headers)
    .filter(
      ([key]) =>
        !key.toLowerCase().startsWith("cf-") &&
        !key.toLowerCase().includes("forward") &&
        !key.toLowerCase().includes("real-ip")
    )
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value || ""
        return acc
      },
      {} as Record<string, string>
    )

  const headersInfo = {
    count: Object.keys(headers).length,
    cloudflare: cloudflareHeaders,
    forwarding: forwardingHeaders,
    other: otherHeaders
  }

  logger.trace("Headers categorized", {
    totalHeaders: headersInfo.count,
    cloudflareHeaders: Object.keys(cloudflareHeaders).length,
    forwardingHeaders: Object.keys(forwardingHeaders).length,
    otherHeaders: Object.keys(otherHeaders).length
  })

  // Parse cf-visitor header to extract scheme
  let cfVisitorScheme = "https"
  try {
    const cfVisitor = headers["cf-visitor"]
    if (cfVisitor) {
      const parsed = JSON.parse(cfVisitor)
      cfVisitorScheme = parsed.scheme || "https"
      logger.trace("Parsed cf-visitor header", { scheme: cfVisitorScheme })
    }
  } catch {
    logger.trace("Could not parse cf-visitor header, defaulting to https")
  }

  // Create the new restructured response data
  logger.info("Building ping response data")
  const pingData = PingResponseSchema.parse({
    cloudflare: {
      connectingIP: cfInfo.ip,
      country: {
        ip: cfInfo.country,
        primary: cfInfo.country
      },
      datacentre: cfInfo.datacenter,
      ray: cfInfo.ray,
      request: {
        agent: cfInfo.userAgent,
        host: headers.host || "unknown",
        method: event.node.req.method || "GET",
        path: event.node.req.url || "/api/ping",
        proto: {
          forward: forwardingHeaders["x-forwarded-proto"] || "https",
          request: cfVisitorScheme
        },
        version: event.node.req.httpVersion || "1.1"
      }
    },
    worker: {
      edge_functions: true,
      environment: process.env.NODE_ENV || "development",
      limits: {
        cpu_time: "50ms (startup) + 50ms (request)",
        memory: "128MB",
        request_timeout: "30s"
      },
      preset: "cloudflare_module",
      runtime: "cloudflare-workers",
      server_side_rendering: true,
      version: "1.0.0"
    }
  })

  const responseTime = Date.now() - startTime

  logger.info("Ping request completed successfully", {
    responseTime: `${responseTime}ms`,
    authenticated: authInfo.token?.valid || false,
    headersCount: headersInfo.count
  })

  return createTypedApiResponse({
    result: {
      pingData,
      auth: authInfo,
      headers: headersInfo
    },
    message: "Ping successful",
    error: null,
    resultSchema: PingResultSchema
  })
})
