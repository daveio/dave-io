import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, authorizeEndpoint } from "../lib/auth"
import { AiAltTextQuerySchema, AiAltTextResponseSchema, AiErrorSchema } from "../schemas/ai.schema"

export class AiAltText extends OpenAPIRoute {
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for images using AI",
    description:
      "A protected endpoint that requires authentication to generate alt text for images. Optionally provide an image URL via the 'image' query parameter.",
    request: {
      query: AiAltTextQuerySchema
    },
    responses: {
      200: {
        description: "Alt text generated successfully",
        content: {
          "application/json": {
            schema: AiAltTextResponseSchema
          }
        }
      },
      400: {
        description: "Bad request - invalid image URL",
        content: {
          "application/json": {
            schema: AiErrorSchema
          }
        }
      },
      401: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: AiErrorSchema
          }
        }
      },
      403: {
        description: "Authorization failed",
        content: {
          "application/json": {
            schema: AiErrorSchema
          }
        }
      }
    }
  }

  async handle(c: Context) {
    // Using the authorizeEndpoint helper with 'ai' endpoint and 'alt-text' subresource
    // JWT subject must be either 'ai' or 'ai:alt-text' to access this endpoint
    return authorizeEndpoint("ai", "alt-text")(c, async () => {
      const _authContext = c as AuthorizedContext

      // Get validated query parameters
      const data = await this.getValidatedData<typeof this.schema>()
      const { image } = data.query

      // Validate image if provided
      if (image) {
        try {
          // Basic URL validation - ensure it's a valid URL
          new URL(image)

          // Optional: Add additional validation for image file types
          const url = new URL(image)
          const pathname = url.pathname.toLowerCase()
          const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
          const hasValidExtension = validExtensions.some((ext) => pathname.endsWith(ext))

          if (!hasValidExtension) {
            return c.json(
              {
                error: "Invalid image URL - URL must point to a valid image file",
                code: "INVALID_IMAGE_URL"
              },
              400
            )
          }
        } catch (_error) {
          return c.json(
            {
              error: "Invalid image URL format",
              code: "INVALID_URL_FORMAT"
            },
            400
          )
        }
      }

      // In a real implementation, you would:
      // 1. Fetch the image from the image (if provided)
      // 2. Process the image using AI (e.g., Cloudflare AI Workers)
      // 3. Generate appropriate alt text
      // This is a placeholder implementation

      const altText = image
        ? `AI-generated alt text for image: ${image}`
        : "A placeholder alt text for demonstration purposes"

      return c.json({
        altText,
        image,
        timestamp: new Date().toISOString()
      })
    })
  }
}
