import { OpenAPIRoute, fromHono } from "chanfana"
import { Hono } from "hono"
import { AiAltText } from "./endpoints/ai"
import { AuthTest } from "./endpoints/auth-test"
import { Dashboard } from "./endpoints/dashboard"
import { Metrics } from "./endpoints/metrics"
import { Ping } from "./endpoints/ping"
import { Redirect } from "./endpoints/redirect"
import { RouterOSCache, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros"
import { initializeKV } from "./kv/init"
import { incrementStatusCodeCount } from "./kv/metrics"
import { trackRequestAnalytics } from "./lib/analytics"
import { registerGetRoute } from "./lib/route-helper"

type Bindings = {
  DATA: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  API_JWT_SECRET: string
}

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>()

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/api/docs",
  redoc_url: "/api/redocs",
  openapi_url: "/api/openapi.json"
})

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

// Register routes using the helper utility
registerGetRoute(app, openapi, "/ping", Ping)
registerGetRoute(app, openapi, "/redirect/:slug", Redirect, ["slug"])
registerGetRoute(app, openapi, "/dashboard/:name", Dashboard, ["name"])
registerGetRoute(app, openapi, "/routeros/putio", RouterOSPutIO)
registerGetRoute(app, openapi, "/routeros/cache", RouterOSCache)
registerGetRoute(app, openapi, "/routeros/reset", RouterOSReset)
registerGetRoute(app, openapi, "/metrics", Metrics)
registerGetRoute(app, openapi, "/metrics/json", Metrics)
registerGetRoute(app, openapi, "/metrics/yaml", Metrics)
registerGetRoute(app, openapi, "/metrics/prometheus", Metrics)
registerGetRoute(app, openapi, "/auth/test", AuthTest)
registerGetRoute(app, openapi, "/ai/alt-text", AiAltText)

// Export the Hono app
export default app
