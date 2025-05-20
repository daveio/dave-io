import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { getRedirect, trackRedirectClick } from "../kv/redirect"
import { RedirectSchema } from "../schemas"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

// Define param schema separately to avoid deep type instantiation
const redirectParamsSchema = z.object({
  slug: z.string().openapi({ description: "Redirect slug" })
})

export class Redirect extends OpenAPIRoute {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Redirects"],
    summary: "Get the URL for a redirect by slug",
    request: {
      params: redirectParamsSchema
    },
    responses: {
      "200": {
        description: "Returns the URL for a redirect",
        content: {
          "application/json": {
            schema: z.object({
              redirect: z.object({
                redirect: RedirectSchema
              })
            })
          }
        }
      },
      "404": {
        description: "Redirect not found"
      }
    }
  } as OpenAPIRouteSchema

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    if (!data.params) {
      return new Response(null, { status: 404 })
    }

    const { slug } = data.params

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
