import { getHeaders } from "h3"
import { recordAPIMetrics } from "~/server/middleware/metrics"
import { extractToken, getUserFromPayload, verifyJWT } from "~/server/utils/auth"
import { getCloudflareRequestInfo } from "~/server/utils/cloudflare"
import { createApiResponse, logRequest } from "~/server/utils/response"
import { EnhancedPingResponseSchema, PingResponseSchema } from "~/server/utils/schemas"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  // Get Cloudflare request information
  const cfInfo = getCloudflareRequestInfo(event)

  // Try to extract and validate JWT token (optional)
  // biome-ignore lint/suspicious/noExplicitAny: Complex auth object structure varies based on token validity
  let authInfo: any = { supplied: false }
  const token = extractToken(event)

  if (token) {
    const secret = process.env.API_JWT_SECRET
    if (secret) {
      try {
        const verification = await verifyJWT(token, secret)
        if (verification.success && verification.payload) {
          const { payload } = verification
          // biome-ignore lint/correctness/noUnusedVariables: User variable needed for JWT validation context
          const user = getUserFromPayload(payload)

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
        // biome-ignore lint/correctness/noUnusedVariables: Error variable needed for exception handling context
      } catch (error) {
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
    request: {
      method: event.node.req.method || "GET",
      host: headers.host || "unknown",
      path: event.node.req.url || "/api/ping",
      version: event.node.req.httpVersion || "1.1"
    },
    cloudflare: cloudflareHeaders,
    forwarding: forwardingHeaders,
    other: otherHeaders
  }

  // Merge all the data from health, ping, and worker endpoints
  const pingData = PingResponseSchema.parse({
    // From health endpoint
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",

    // From worker endpoint
    runtime: "cloudflare-workers",
    preset: "cloudflare_module",
    api_available: true,
    server_side_rendering: true,
    edge_functions: true,
    worker_limits: {
      cpu_time: "50ms (startup) + 50ms (request)",
      memory: "128MB",
      request_timeout: "30s"
    },

    // From ping endpoint + cloudflare info
    cf_ray: cfInfo.ray,
    cf_datacenter: cfInfo.datacenter,
    cf_country: cfInfo.country,
    cf_ipcountry: cfInfo.country,
    cf_connecting_ip: cfInfo.ip,
    user_agent: cfInfo.userAgent
  })

  // Sort the keys for consistent output
  // biome-ignore lint/suspicious/noExplicitAny: Generic object sorting function handles multiple types
  const sortObject = (obj: any): any => {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj

    // biome-ignore lint/suspicious/noExplicitAny: Accumulator object type varies based on input
    const sorted: any = {}
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortObject(obj[key])
    }
    return sorted
  }

  const response = EnhancedPingResponseSchema.parse({
    data: sortObject(pingData),
    auth: sortObject(authInfo),
    headers: sortObject(headersInfo),
    success: true,
    timestamp: new Date().toISOString()
  })

  // Record standard API metrics
  recordAPIMetrics(event, 200)

  // Log successful request
  const responseTime = Date.now() - startTime
  logRequest(event, "ping", "GET", 200, {
    environment: pingData.environment,
    runtime: pingData.runtime,
    datacenter: cfInfo.datacenter,
    responseTime: `${responseTime}ms`,
    cfRay: cfInfo.ray,
    authSupplied: authInfo.supplied ? "true" : "false",
    authValid: authInfo.token?.valid ? "true" : "false",
    headerCount: headersInfo.count
  })

  return response
})
