import { fromHono } from "chanfana"
import { RouterOSCache } from "durable-objects/routeros-cache"
import { Dashboard } from "endpoints/dashboard"
import { Ping } from "endpoints/ping"
import { Redirect } from "endpoints/redirect"
import { RouterOSCache as RouterOSCacheEndpoint, RouterOSPutIO, RouterOSReset } from "endpoints/routeros"
import { Hono } from "hono"

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

// Register OpenAPI endpoints
openapi.get("/ping", Ping)
openapi.get("/api/ping", Ping)
openapi.get("/redirect/:slug", Redirect)
openapi.get("/api/redirect/:slug", Redirect)
openapi.get("/dashboard/:name", Dashboard)
openapi.get("/api/dashboard/:name", Dashboard)

// Register RouterOS endpoints
openapi.get("/routeros/putio", RouterOSPutIO)
openapi.get("/api/routeros/putio", RouterOSPutIO)
openapi.get("/routeros/cache", RouterOSCacheEndpoint)
openapi.get("/api/routeros/cache", RouterOSCacheEndpoint)
openapi.get("/routeros/reset", RouterOSReset)
openapi.get("/api/routeros/reset", RouterOSReset)

// Export the Hono app
export default app

// Export Durable Objects
export { RouterOSCache }
