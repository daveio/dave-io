import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Ping } from "endpoints/ping";
// import { UrlList } from "./endpoints/urlList";
// import { UrlFetch } from "./endpoints/urlFetch";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/ping", Ping);
// openapi.post("/url", UrlList);
// openapi.get("/url/:slug", UrlFetch);

// Export the Hono app
export default app;
