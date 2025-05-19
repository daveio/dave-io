import { fromHono } from "chanfana"
import { Ping } from "endpoints/ping"
import { Hono } from "hono"
import { PutIOCacheDO } from "./durable-objects/putio-cache"
import { Dashboard } from "./endpoints/dashboard"
import { Redirect } from "./endpoints/redirect"
import { RouterOSCache, RouterOSPutIO, RouterOSReset } from "./endpoints/routeros-putio"

type Bindings = {
  GDIO_REDIRECTS: KVNamespace
  ANALYTICS: AnalyticsEngineDataset
  PUTIO_CACHE: DurableObjectNamespace
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
openapi.get("/routeros/cache", RouterOSCache)
openapi.get("/api/routeros/cache", RouterOSCache)
openapi.get("/routeros/reset", RouterOSReset)
openapi.get("/api/routeros/reset", RouterOSReset)

// Export the Hono app
export default app

// Export Durable Objects
export { PutIOCacheDO }
