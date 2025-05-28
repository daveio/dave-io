import { fromHono } from "chanfana"
/// <reference path="../worker-configuration.d.ts" />
import { type Context, Hono } from "hono"
import { AiAlt, AiAltPost } from "./endpoints/ai"
import { Auth } from "./endpoints/auth"
import { Dashboard } from "./endpoints/dashboard"
import { Go } from "./endpoints/go"
import { Metrics } from "./endpoints/metrics"
import { Ping } from "./endpoints/ping"
import { RouterOSCache, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros"
import { TokenRevokeEndpoint, TokenUsageEndpoint } from "./endpoints/tokens"
import { initializeKV } from "./kv/init"
import { incrementStatusCodeCount } from "./kv/metrics"
import { trackRequestAnalytics } from "./lib/analytics"

type Bindings = Env

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>()

// Initialize KV store middleware
app.use("*", async (c, next) => {
  try {
    // Initialize KV with default values
    await initializeKV(c.env)
  } catch (error) {
    console.error("Error initializing KV store:", error)
  }

  // Continue with request handling
  await next()
})

// Enhanced analytics tracking middleware
app.use("*", async (c, next) => {
  const requestStartTime = Date.now()
  const { path, method } = c.req
  const userAgent = c.req.header("user-agent")
  const referer = c.req.header("referer")
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown"

  // Extract URL parameters
  const url = new URL(c.req.url)
  const queryParams = url.search || ""

  // Execute the next handler
  await next()

  // Calculate response time
  const responseTime = Date.now() - requestStartTime
  const { status } = c.res

  // Track comprehensive analytics
  trackRequestAnalytics(c.env, {
    timestamp: requestStartTime,
    path,
    method,
    status,
    responseTime,
    ip,
    userAgent,
    referer,
    queryParams,
    errorMessage: status >= 400 ? "Error response" : undefined
  })
})

// Metrics tracking middleware
app.use("*", async (c, next) => {
  // Execute the next handler first to get the response
  await next()

  // Destructure the status code from the response
  const { status } = c.res

  // Skip successful responses (200) and redirects (301, 302)
  if (status !== 200 && status !== 301 && status !== 302) {
    await incrementStatusCodeCount(c.env, status)
  }
})

// Initialize Chanfana OpenAPI with Hono
const openapi = fromHono(app, {
  docs_url: "/api/docs",
  openapi_url: "/api/openapi.json",
  schema: {
    info: {
      title: "dave.io",
      version: "1.0.0",
      description:
        "A multipurpose personal API powered by Cloudflare Workers. Provides endpoints for health checks, URL redirection, dashboard feeds, RouterOS script generation, metrics, JWT authentication, token management, and AI-powered services."
    },
    tags: [
      { name: "Health Check", description: "Service health monitoring" },
      { name: "Go", description: "URL shortening and redirection service" },
      { name: "Dashboard", description: "Data feeds for dashboards" },
      { name: "RouterOS", description: "Network configuration script generation" },
      { name: "Metrics", description: "API usage and performance metrics" },
      { name: "Authentication", description: "JWT authentication testing" },
      { name: "Token Management", description: "JWT token lifecycle management" },
      { name: "AI Services", description: "AI-powered services including image alt text generation" }
    ],
    servers: [{ url: "https://dave.io", description: "Production server" }]
  }
})

// Register endpoints with /api/ prefixed paths only
// Health check endpoints
// @ts-ignore - Route registration working, type compatibility issue with OpenAPIRoute classes
openapi.get("/api/ping", Ping)

// Go redirect endpoints (outside /api/ prefix)
// @ts-ignore
openapi.get("/go/:slug", Go)

// Dashboard endpoints
// @ts-ignore
openapi.get("/api/dashboard/:name", Dashboard)

// RouterOS endpoints
// @ts-ignore
openapi.get("/api/routeros/putio", RouterOSPutIO)
// @ts-ignore
openapi.get("/api/routeros/cache", RouterOSCache)
// @ts-ignore
openapi.get("/api/routeros/reset", RouterOSReset)

// Metrics endpoints (multiple formats)
// @ts-ignore
openapi.get("/api/metrics", Metrics)
// @ts-ignore
openapi.get("/api/metrics/json", Metrics)
// @ts-ignore
openapi.get("/api/metrics/yaml", Metrics)
// @ts-ignore
openapi.get("/api/metrics/prometheus", Metrics)

// Authentication endpoints
// @ts-ignore
openapi.get("/api/auth", Auth)

// Token management endpoints
// @ts-ignore
openapi.get("/api/tokens/:uuid/usage", TokenUsageEndpoint)
// @ts-ignore
openapi.post("/api/tokens/:uuid/revoke", TokenRevokeEndpoint)

// AI endpoints with GET and POST support
// @ts-ignore
openapi.get("/api/ai/alt", AiAlt)
// @ts-ignore
openapi.post("/api/ai/alt", AiAltPost)

// Export the Hono app
export default app
