import { fromHono } from "chanfana";
import { Ping } from "endpoints/ping";
import { Hono } from "hono";
import { Dashboard } from "./endpoints/dashboard";
import { Redirect } from "./endpoints/redirect";

type Bindings = {
	GDIO_REDIRECTS: KVNamespace;
	ANALYTICS: AnalyticsEngineDataset;
};

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/api/docs",
	redoc_url: "/api/redocs",
	openapi_url: "/api/openapi.json",
});

// Register OpenAPI endpoints
openapi.get("/ping", Ping);
openapi.get("/api/ping", Ping);
openapi.get("/redirect/:slug", Redirect);
openapi.get("/api/redirect/:slug", Redirect);
openapi.get("/dashboard/:name", Dashboard);
openapi.get("/api/dashboard/:name", Dashboard);

// Export the Hono app
export default app;
