import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { AiAltPostBodySchema, AiAltTextResponseSchema, AiErrorSchema } from "../../schemas/ai.schema"
import { ImageProcessor } from "./image-processing"

/**
 * AI Alt Text Generation Endpoint (POST)
 * Handles POST requests with base64-encoded image data
 */
export class AiAltPost extends ImageProcessor {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for uploaded images using AI",
    description:
      "A protected endpoint that requires authentication to generate alt text for directly uploaded images. Provide base64-encoded image data in the request body.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: AiAltPostBodySchema
          }
        }
      }
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
        description: "Bad request - invalid image data",
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
   * Handles POST requests with base64 image data
   */
  async handle(c: Context) {
    return this.processImage(c, async () => {
      // Get validated body parameters using chanfana's built-in validation
      const data = await this.getValidatedData<typeof this.schema>()
      const body = data.body as { image: string } | undefined
      const image = body?.image

      if (!image) {
        return {
          imageData: this.createErrorResponse(c, "No image data provided.", "NO_IMAGE_PROVIDED"),
          imageSource: "none"
        }
      }

      // Process the base64 image
      const imageData = this.processBase64Image(c, image)

      return { imageData, imageSource: "base64" }
    })
  }
}
