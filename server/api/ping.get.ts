import { getHeaders } from "h3"
import { z } from "zod"
import { extractToken, verifyJWT } from "../utils/auth"
import { getCloudflareRequestInfo, getCloudflareEnv, getKVNamespace, getCachedRedirectList } from "../utils/cloudflare"
import { createTypedApiResponse } from "../utils/response-types"
import { PingResponseSchema } from "../utils/schemas"

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

  // Get Cloudflare request information
  const cfInfo = getCloudflareRequestInfo(event)

  // Get KV namespace for redirect lookup
  const env = getCloudflareEnv(event)
  const kv = getKVNamespace(env)

  // Try to extract and validate JWT token (optional)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authInfo: any = { supplied: false }
  const token = extractToken(event)

  if (token) {
    // Get secret from Cloudflare Secrets Store
    const secretsEnv = env as SecretsEnv
    let secret: string | null = null

    if (secretsEnv?.API_JWT_SECRET) {
      try {
        secret = await secretsEnv.API_JWT_SECRET.get()
      } catch (error) {
        console.error("Failed to retrieve API_JWT_SECRET from Secrets Store:", error)
        // Continue with null secret to mark token as invalid
      }
    }

    if (secret) {
      try {
        const verification = await verifyJWT(token, secret)
        if (verification.success && verification.payload) {
          const { payload } = verification

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
          authInfo = {
            supplied: true,
            token: {
              value: token,
              valid: false
            }
          }
        }
      } catch {
        authInfo = {
          supplied: true,
          token: {
            value: token,
            valid: false
          }
        }
      }
    } else {
      authInfo = {
        supplied: true,
        token: {
          value: token,
          valid: false
        }
      }
    }
  }

  // Get all request headers
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

  // Parse cf-visitor header to extract scheme
  let cfVisitorScheme = "https"
  try {
    const cfVisitor = headers["cf-visitor"]
    if (cfVisitor) {
      const parsed = JSON.parse(cfVisitor)
      cfVisitorScheme = parsed.scheme || "https"
    }
  } catch {
    // Default to https if parsing fails
  }

  // Fetch available redirect slugs from cached KV
  let redirectSlugs: string[] = []
  try {
    const allRedirects = await getCachedRedirectList(kv)

    // Handle case where more than 100 redirects exist
    if (allRedirects.length > 100) {
      console.error(`Warning: ${allRedirects.length} redirects found, truncating to 100 for API response`)
      redirectSlugs = allRedirects.slice(0, 100)
    } else {
      redirectSlugs = allRedirects
    }
  } catch (error) {
    console.error("Failed to fetch cached redirect slugs:", error)
    // Continue with empty array if KV lookup fails
  }

  // Create the new restructured response data
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
    },
    redirects: redirectSlugs
  })

  const _responseTime = Date.now() - startTime

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
