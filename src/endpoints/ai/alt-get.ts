import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { AiAltTextQuerySchema, AiAltTextResponseSchema, AiErrorSchema } from "../../schemas/ai.schema"
import { ImageProcessor } from "./image-processing"

/**
 * AI Alt Text Generation Endpoint (GET)
 * Generates descriptive alt text for images using Cloudflare AI
 */
export class AiAlt extends ImageProcessor {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for images using AI",
    description:
      "A protected endpoint that requires authentication to generate alt text for images. Provide an image URL via the 'image' query parameter.",
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
        description: "Bad request - invalid image URL or data",
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
      },
      429: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: AiErrorSchema
          }
        }
      }
    }
  } as OpenAPIRouteSchema

  /**
   * Handles GET requests with image URL parameter
   */
  async handle(c: Context) {
    return this.processImage(c, async () => {
      // Get validated query parameters using chanfana's built-in validation
      const data = await this.getValidatedData<typeof this.schema>()
      const query = data.query as { image?: string } | undefined
      const image = query?.image

      if (!image) {
        return {
          imageData: this.createErrorResponse(
            c,
            "No image provided. Please provide an image URL or upload an image directly.",
            "NO_IMAGE_PROVIDED"
          ),
          imageSource: "none"
        }
      }

      // Process the image URL
      const imageData = await this.processImageFromUrl(c, image)

      return { imageData, imageSource: image }
    })
  }
}
