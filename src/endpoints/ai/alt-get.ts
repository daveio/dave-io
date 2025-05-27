import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { type AuthorizedContext, authorizeEndpoint } from "../../lib/auth"
import { AiAltGetRouteSchema } from "../../schemas/ai"
import { ImageProcessor } from "./image-processing"

/**
 * AI Alt Text Generation Endpoint (GET)
 * Generates descriptive alt text for images using Cloudflare AI
 */
export class AiAlt extends OpenAPIRoute {
  schema = AiAltGetRouteSchema
  private processor = new ImageProcessor()
  /**
   * Handles GET requests with image URL parameter
   */
  async handle(c: Context) {
    // Extract image query parameter directly from context
    const image = c.req.query("image")

    // Now run through authorization and processing
    return authorizeEndpoint("ai", "alt")(c, async () => {
      if (!image) {
        return this.processor.createErrorResponse(
          c,
          "No image provided. Please provide an image URL or upload an image directly.",
          "NO_IMAGE_PROVIDED"
        )
      }

      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Check rate limit before processing
      const rateLimitResult = await this.processor.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
        return this.processor.createRateLimitResponse(c, rateLimitResult)
      }

      // Process the image URL
      const imageData = await this.processor.processImageFromUrl(c, image)

      // If the result is a Response (error), return it
      if (imageData instanceof Response) {
        return imageData
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await this.processor.generateAltText(c, imageData)

        // Track success in analytics
        this.processor.trackAnalytics(c, image)

        // Return successful response
        return this.processor.createSuccessResponse(c, altText, image, rateLimitResult)
      } catch (error) {
        console.error("Error generating alt text:", error)
        return this.processor.createErrorResponse(
          c,
          "Failed to generate alt text",
          "AI_PROCESSING_ERROR",
          500,
          rateLimitResult
        )
      }
    })
  }
}
