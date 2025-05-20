import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { getRedirect, trackRedirectClick } from "../kv/redirect"
import { RedirectParamsSchema, RedirectSchema } from "../schemas"

export class Redirect extends OpenAPIRoute {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Redirects"],
    summary: "Get the URL for a redirect by slug",
    request: {
      params: RedirectParamsSchema
    },
    responses: {
      "200": {
        description: "Returns the URL for a redirect",
        content: {
          "application/json": {
            schema: RedirectSchema
          }
        }
      },
      "404": {
        description: "Redirect not found"
      }
    }
  } as OpenAPIRouteSchema

  async handle(c: Context) {
    // Extract slug directly from context params
    const slug = c.req.param("slug")
    if (!slug) {
      return new Response(null, { status: 404 })
    }

    // Track request in analytics
    c.env.ANALYTICS.writeDataPoint({
      blobs: ["redirect_request", slug],
      indexes: ["redirect"]
    })

    // Get the redirect using the utility function
    const redirect = await getRedirect(c.env, slug)

    if (!redirect) {
      return new Response(null, { status: 404 })
    }

    // Track the redirect click
    await trackRedirectClick(c.env, slug)

    return {
      success: true,
      redirect: {
        slug: slug,
        url: redirect.url
      }
    }
  }
}
