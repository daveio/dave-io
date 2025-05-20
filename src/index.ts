import { OpenAPIRoute, fromHono } from "chanfana"
import { Hono } from "hono"
import { RouterOSCache } from "./durable-objects/routeros-cache"
import { Dashboard } from "./endpoints/dashboard"
import { Ping } from "./endpoints/ping"
import { Redirect } from "./endpoints/redirect"
import { RouterOSCache as RouterOSCacheEndpoint, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros"

type Bindings = {
  GDIO_REDIRECTS: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  ROUTEROS_CACHE: DurableObjectNamespace
}

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>()

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/api/docs",
  redoc_url: "/api/redocs",
  openapi_url: "/api/openapi.json"
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
  new RouterOSCacheEndpoint({
    router: openapi,
    raiseUnknownParameters: true,
    route: c.req.path,
    urlParams: []
  }).execute(c)
)
app.get("/api/routeros/cache", (c) =>
  new RouterOSCacheEndpoint({
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

// Export the Hono app
export default app

// Export Durable Objects
export { RouterOSCache }
