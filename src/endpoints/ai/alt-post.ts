import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { type AuthorizedContext, authorizeEndpoint } from "../../lib/auth"
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
    // Extract image data from request body directly
    let body: { image?: string } = {}
    try {
      body = await c.req.json()
    } catch (error) {
      console.error("Failed to parse JSON body:", error)
      return c.json({ error: "Invalid JSON in request body", code: "INVALID_JSON" }, 400)
    }

    const image = body.image

    // Now run through authorization and processing
    return authorizeEndpoint("ai", "alt")(c, async () => {
      if (!image) {
        return this.createErrorResponse(c, "No image data provided.", "NO_IMAGE_PROVIDED")
      }

      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Check rate limit before processing
      const rateLimitResult = await this.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(c, rateLimitResult)
      }

      // Process the base64 image
      const imageData = this.processBase64Image(c, image)

      // If the result is a Response (error), return it
      if (imageData instanceof Response) {
        return imageData
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await this.generateAltText(c, imageData)

        // Track success in analytics
        this.trackAnalytics(c, null)

        // Return successful response
        return this.createSuccessResponse(c, altText, "base64", rateLimitResult)
      } catch (error) {
        console.error("Error generating alt text:", error)
        return this.createErrorResponse(c, "Failed to generate alt text", "AI_PROCESSING_ERROR", 500, rateLimitResult)
      }
    })
  }
}
