import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { getRedirect, trackRedirectClick } from "../kv/redirect"
import { RedirectRouteSchema } from "../schemas/redirect"

export class Redirect extends OpenAPIRoute {
  schema = RedirectRouteSchema
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

    return c.json({
      success: true,
      redirect: {
        slug: slug,
        url: redirect.url
      }
    })
  }
}
