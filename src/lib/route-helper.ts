import type { OpenAPIRoute } from "chanfana"
import type { Context, Env, Hono } from "hono"

type HTTPMethod = "get" | "post" | "put" | "patch" | "delete" | "options"

type RouteHandler<T extends OpenAPIRoute> = new (options: {
  // biome-ignore lint/suspicious/noExplicitAny: Required for chanfana compatibility
  router: any // Keep as any for chanfana compatibility
  raiseUnknownParameters: boolean
  route: string
  urlParams: string[]
}) => T

/**
 * Helper function to register both regular and API-prefixed routes
 *
 * @param app - The Hono app instance
 * @param openapi - The OpenAPI router instance
 * @param method - HTTP method (get, post, put, etc.)
 * @param path - The base path (e.g., "/auth/test")
 * @param HandlerClass - The route handler class
 * @param urlParams - Array of URL parameter names (e.g., ["slug"])
 */
export function registerRoute<T extends OpenAPIRoute, E extends Env = Env>(
  app: Hono<E>,
  // biome-ignore lint/suspicious/noExplicitAny: Required for chanfana compatibility
  openapi: any, // Keep as any for chanfana compatibility
  method: HTTPMethod,
  path: string,
  HandlerClass: RouteHandler<T>,
  urlParams: string[] = []
) {
  const handler = (c: Context<E>) =>
    new HandlerClass({
      router: openapi,
      raiseUnknownParameters: true,
      route: c.req.path,
      urlParams
    }).execute(c)

  // Type for the method function
  type MethodHandler = (path: string, handler: (c: Context<E>) => Response | Promise<Response>) => Hono<E>

  // Register the original path
  ;(app[method] as MethodHandler)(path, handler)

  // Register the API-prefixed path
  ;(app[method] as MethodHandler)(`/api${path}`, handler)
}

/**
 * Convenience function specifically for GET routes
 */
export function registerGetRoute<T extends OpenAPIRoute, E extends Env = Env>(
  app: Hono<E>,
  // biome-ignore lint/suspicious/noExplicitAny: Required for chanfana compatibility
  openapi: any, // Keep as any for chanfana compatibility
  path: string,
  HandlerClass: RouteHandler<T>,
  urlParams: string[] = []
) {
  return registerRoute(app, openapi, "get", path, HandlerClass, urlParams)
}

/**
 * Convenience function specifically for POST routes
 */
export function registerPostRoute<T extends OpenAPIRoute, E extends Env = Env>(
  app: Hono<E>,
  // biome-ignore lint/suspicious/noExplicitAny: Required for chanfana compatibility
  openapi: any, // Keep as any for chanfana compatibility
  path: string,
  HandlerClass: RouteHandler<T>,
  urlParams: string[] = []
) {
  return registerRoute(app, openapi, "post", path, HandlerClass, urlParams)
}
