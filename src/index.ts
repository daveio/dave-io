import { type Context, Hono } from "hono"
import { AiAlt, AiAltPost } from "./endpoints/ai"
import { Auth } from "./endpoints/auth"
import { Dashboard } from "./endpoints/dashboard"
import { Metrics } from "./endpoints/metrics"
import { Ping } from "./endpoints/ping"
import { Redirect } from "./endpoints/redirect"
import { RouterOSCache, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros"
import { TokenRevokeEndpoint, TokenUsageEndpoint } from "./endpoints/tokens"
import { initializeKV } from "./kv/init"
import { incrementStatusCodeCount } from "./kv/metrics"
import { trackRequestAnalytics } from "./lib/analytics"

type Bindings = {
  DATA: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  API_JWT_SECRET: string
}

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

// Helper function to create endpoint instances and handle requests
// biome-ignore lint/suspicious/noExplicitAny: Endpoint classes have varying types
const createHandler = (EndpointClass: any) => async (c: Context) => {
  const endpoint = new EndpointClass()
  return endpoint.handle(c)
}

// Register routes directly with Hono
app.get("/ping", createHandler(Ping))
app.get("/api/ping", createHandler(Ping))

app.get("/redirect/:slug", createHandler(Redirect))
app.get("/api/redirect/:slug", createHandler(Redirect))

app.get("/dashboard/:name", createHandler(Dashboard))
app.get("/api/dashboard/:name", createHandler(Dashboard))

app.get("/routeros/putio", createHandler(RouterOSPutIO))
app.get("/api/routeros/putio", createHandler(RouterOSPutIO))

app.get("/routeros/cache", createHandler(RouterOSCache))
app.get("/api/routeros/cache", createHandler(RouterOSCache))

app.get("/routeros/reset", createHandler(RouterOSReset))
app.get("/api/routeros/reset", createHandler(RouterOSReset))

app.get("/metrics", createHandler(Metrics))
app.get("/api/metrics", createHandler(Metrics))
app.get("/metrics/json", createHandler(Metrics))
app.get("/api/metrics/json", createHandler(Metrics))
app.get("/metrics/yaml", createHandler(Metrics))
app.get("/api/metrics/yaml", createHandler(Metrics))
app.get("/metrics/prometheus", createHandler(Metrics))
app.get("/api/metrics/prometheus", createHandler(Metrics))

app.get("/auth", createHandler(Auth))
app.get("/api/auth", createHandler(Auth))

// Token management endpoints
app.get("/tokens/:uuid/usage", createHandler(TokenUsageEndpoint))
app.get("/api/tokens/:uuid/usage", createHandler(TokenUsageEndpoint))
app.post("/tokens/:uuid/revoke", createHandler(TokenRevokeEndpoint))
app.post("/api/tokens/:uuid/revoke", createHandler(TokenRevokeEndpoint))

// AI endpoints with GET and POST support
app.get("/ai/alt", createHandler(AiAlt))
app.get("/api/ai/alt", createHandler(AiAlt))
app.post("/ai/alt", createHandler(AiAltPost))
app.post("/api/ai/alt", createHandler(AiAltPost))

// Export the Hono app
export default app
