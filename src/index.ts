import { OpenAPIRoute, fromHono } from "chanfana"
import { Hono } from "hono"
import { Dashboard } from "./endpoints/dashboard"
import { Metrics } from "./endpoints/metrics"
import { Ping } from "./endpoints/ping"
import { Protected, ProtectedAdmin } from "./endpoints/protected"
import { Redirect } from "./endpoints/redirect"
import { RouterOSCache, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros"
import { initializeKV } from "./kv/init"
import { incrementStatusCodeCount } from "./kv/metrics"
import { trackRequestAnalytics } from "./lib/analytics"

type Bindings = {
  DATA: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  JWT_SECRET: string
}

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>()

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/api/docs",
  redoc_url: "/api/redocs",
  openapi_url: "/api/openapi.json",
  schema: {
    info: {
      title: "Dave.io API",
      version: "1.0.0",
      description: "General-purpose serverless personal API"
    }
  }
})

// Register security scheme
openapi.registry.registerComponent(
  'securitySchemes',
  'BearerAuth',
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT token for API authentication"
  }
)

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

// Register direct handlers to avoid type issues
app.get("/ping", (c) =>
  new Ping({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/ping", (c) =>
  new Ping({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/redirect/:slug", (c) =>
  new Redirect({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: ["slug"] }).execute(c)
)
app.get("/api/redirect/:slug", (c) =>
  new Redirect({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: ["slug"] }).execute(c)
)

app.get("/dashboard/:name", (c) =>
  new Dashboard({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: ["name"] }).execute(c)
)
app.get("/api/dashboard/:name", (c) =>
  new Dashboard({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: ["name"] }).execute(c)
)

app.get("/routeros/putio", (c) =>
  new RouterOSPutIO({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/routeros/putio", (c) =>
  new RouterOSPutIO({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/routeros/cache", (c) =>
  new RouterOSCache({
    router: openapi,
    raiseUnknownParameters: true,
    route: c.req.path,
    urlParams: []
  }).execute(c)
)
app.get("/api/routeros/cache", (c) =>
  new RouterOSCache({
    router: openapi,
    raiseUnknownParameters: true,
    route: c.req.path,
    urlParams: []
  }).execute(c)
)

app.get("/routeros/reset", (c) =>
  new RouterOSReset({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/routeros/reset", (c) =>
  new RouterOSReset({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

// Add protected endpoints
app.get("/protected", (c) =>
  new Protected({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/protected", (c) =>
  new Protected({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/protected/admin", (c) =>
  new ProtectedAdmin({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/protected/admin", (c) =>
  new ProtectedAdmin({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

// Add metrics endpoints
app.get("/metrics", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/metrics", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/metrics/json", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/metrics/json", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/metrics/yaml", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/metrics/yaml", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

app.get("/metrics/prometheus", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/metrics/prometheus", (c) =>
  new Metrics({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

// Export the Hono app
export default app
