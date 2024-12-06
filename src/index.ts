import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Ping } from "endpoints/ping";
import { UrlList } from "./endpoints/urlList";
import { UrlFetch } from "./endpoints/urlFetch";

type Bindings = {
  GDIO_REDIRECTS: KVNamespace;
};

// Start a Hono app
const app = new Hono<{ Bindings: Bindings }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/ping", Ping);
openapi.post("/urls", UrlList);
openapi.get("/url/:slug", UrlFetch);

// Export the Hono app
export default app;
