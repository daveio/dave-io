import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { type AuthorizedContext, authorizeEndpoint } from "../../lib/auth"
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
    // Extract image query parameter directly from context
    const image = c.req.query("image")

    // Now run through authorization and processing
    return authorizeEndpoint("ai", "alt")(c, async () => {
      if (!image) {
        return this.createErrorResponse(
          c,
          "No image provided. Please provide an image URL or upload an image directly.",
          "NO_IMAGE_PROVIDED"
        )
      }

      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Check rate limit before processing
      const rateLimitResult = await this.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(c, rateLimitResult)
      }

      // Process the image URL
      const imageData = await this.processImageFromUrl(c, image)

      // If the result is a Response (error), return it
      if (imageData instanceof Response) {
        return imageData
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await this.generateAltText(c, imageData)

        // Track success in analytics
        this.trackAnalytics(c, image)

        // Return successful response
        return this.createSuccessResponse(c, altText, image, rateLimitResult)
      } catch (error) {
        console.error("Error generating alt text:", error)
        return this.createErrorResponse(c, "Failed to generate alt text", "AI_PROCESSING_ERROR", 500, rateLimitResult)
      }
    })
  }
}
