import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { RedirectSchema } from "../schemas"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

export class Redirect extends OpenAPIRoute {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["Redirects"],
    summary: "Get the URL for a redirect by slug",
    request: {
      params: z.object({
        slug: z.string().openapi({ description: "Redirect slug" })
      })
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
    c.env.ANALYTICS.writeDataPoint({
      blobs: ["redirect_request", slug],
      indexes: ["redirect"]
    })
    const val = await c.env.GDIO_REDIRECTS.get(slug)
    if (val === null) {
      return new Response(null, { status: 404 })
    }
    return {
      success: true,
      redirect: {
        slug: slug,
        url: val
      }
    }
  }
}
