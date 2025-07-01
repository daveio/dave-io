import { getHeaders } from "h3"
import { recordAPIMetrics } from "~/server/middleware/metrics"
import { extractToken, getUserFromPayload, verifyJWT } from "~/server/utils/auth"
import { getCloudflareRequestInfo } from "~/server/utils/cloudflare"
import { createApiResponse, logRequest } from "~/server/utils/response"
import { PingResponseSchema } from "~/server/utils/schemas"

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
        !key.toLowerCase().startsWith("cf-")
        && !key.toLowerCase().includes("forward")
        && !key.toLowerCase().includes("real-ip")
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
    }
  })

  // Record standard API metrics
  recordAPIMetrics(event, 200)

  // Log successful request
  const responseTime = Date.now() - startTime
  logRequest(event, "ping", "GET", 200, {
    environment: pingData.worker.environment,
    runtime: pingData.worker.runtime,
    datacenter: pingData.cloudflare.datacentre,
    responseTime: `${responseTime}ms`,
    cfRay: pingData.cloudflare.ray,
    authSupplied: authInfo.supplied ? "true" : "false",
    authValid: authInfo.token?.valid ? "true" : "false",
    headerCount: headersInfo.count
  })

  return createApiResponse({
    result: {
      pingData,
      auth: authInfo,
      headers: headersInfo
    },
    message: "Ping successful",
    error: null
  })
})
