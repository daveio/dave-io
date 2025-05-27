import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { trackRequestAnalytics } from "../../lib/analytics"
import { type AuthorizedContext, authorizeEndpoint } from "../../lib/auth"

// Constants for rate limits and validations
export const MAX_REQUESTS_PER_HOUR = 100
export const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
export const MAX_IMAGE_SIZE_MB = 4
export const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
export const IMAGE_AI_MODEL = "@cf/llava-hf/llava-1.5-7b-hf"

/**
 * Base class for AI Alt Text endpoints with shared functionality
 */
export abstract class AiAltBase extends OpenAPIRoute {
  /**
   * Generate alt text from image using Cloudflare AI
   */
  async generateAltText(c: Context, imageData: Uint8Array): Promise<string> {
    try {
      // Prepare input for the AI model
      const input = {
        image: Array.from(imageData),
        prompt:
          "Generate detailed alt text describing this image for accessibility purposes. Be concise but descriptive."
      }

      // Call the Cloudflare AI model
      const result = (await c.env.AI.run(IMAGE_AI_MODEL, input)) as { description: string }

      return result.description
    } catch (error) {
      console.error("AI model inference error:", error)
      throw new Error("Failed to generate alt text from image")
    }
  }

  /**
   * Check rate limit for the user
   */
  async checkRateLimit(
    env: { DATA: KVNamespace },
    userId: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const now = Date.now()
    const rateKey = `ratelimit:ai:alt:${userId}`

    // Get current usage
    const usage = (await env.DATA.get(rateKey, "json")) as { count: number; resetTime: number } | null

    if (!usage || usage.resetTime < now) {
      // First request or window has expired, create new window
      const newResetTime = now + RATE_LIMIT_WINDOW
      await env.DATA.put(
        rateKey,
        JSON.stringify({
          count: 1,
          resetTime: newResetTime
        })
      )

      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_HOUR - 1,
        resetTime: new Date(newResetTime)
      }
    }

    // Check if user has exceeded their limit
    if (usage.count >= MAX_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(usage.resetTime)
      }
    }

    // Increment usage count
    await env.DATA.put(
      rateKey,
      JSON.stringify({
        count: usage.count + 1,
        resetTime: usage.resetTime
      })
    )

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_HOUR - usage.count - 1,
      resetTime: new Date(usage.resetTime)
    }
  }

  /**
   * Create rate limit exceeded response
   */
  createRateLimitResponse(c: Context, rateLimitResult: { remaining: number; resetTime: Date }) {
    return c.json(
      {
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        rateLimit: {
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.resetTime.toISOString(),
          limit: MAX_REQUESTS_PER_HOUR
        }
      },
      429
    )
  }

  /**
   * Create error response
   */
  createErrorResponse(
    c: Context,
    error: string,
    code: string,
    status: 400 | 401 | 403 | 429 | 500 = 400,
    rateLimitResult?: { remaining: number; resetTime: Date }
  ) {
    const responseObj: {
      error: string
      code?: string
      rateLimit?: {
        remaining: number
        reset: string
        limit: number
      }
    } = {
      error,
      code
    }

    if (rateLimitResult) {
      responseObj.rateLimit = {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.resetTime.toISOString(),
        limit: MAX_REQUESTS_PER_HOUR
      }
    }

    return c.json(responseObj, status)
  }

  /**
   * Create success response with alt text
   */
  createSuccessResponse(
    c: Context,
    altText: string,
    imageSource: string,
    rateLimitResult: { remaining: number; resetTime: Date }
  ) {
    return c.json({
      altText,
      image: imageSource,
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: rateLimitResult.remaining - 1,
        reset: rateLimitResult.resetTime.toISOString(),
        limit: MAX_REQUESTS_PER_HOUR
      }
    })
  }

  /**
   * Track request in analytics
   */
  trackAnalytics(c: Context, imageSource: string | null = null) {
    const analyticsData = {
      timestamp: Date.now(),
      path: c.req.path,
      method: c.req.method,
      status: 200,
      responseTime: 0,
      userAgent: c.req.header("user-agent"),
      queryParams: imageSource ? `image=${imageSource}` : ""
    }

    trackRequestAnalytics(c.env, analyticsData)
  }

  /**
   * Validate image size
   */
  validateImageSize(c: Context, imageData: Uint8Array) {
    if (imageData.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return this.createErrorResponse(c, `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`, "IMAGE_TOO_LARGE")
    }
    return null
  }

  /**
   * Shared authorization and processing logic
   */
  async processImage(c: Context, getData: () => Promise<{ imageData: Uint8Array | Response; imageSource: string }>) {
    return authorizeEndpoint("ai", "alt")(c, async () => {
      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Check rate limit before processing
      const rateLimitResult = await this.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
        return this.createRateLimitResponse(c, rateLimitResult)
      }

      // Get image data from the derived class
      const { imageData, imageSource } = await getData()

      // If the result is a Response (error), return it
      if (imageData instanceof Response) {
        return imageData
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await this.generateAltText(c, imageData)

        // Track success in analytics
        this.trackAnalytics(c, imageSource !== "base64" ? imageSource : null)

        // Return successful response
        return this.createSuccessResponse(c, altText, imageSource, rateLimitResult)
      } catch (error) {
        console.error("Error generating alt text:", error)

        return this.createErrorResponse(c, "Failed to generate alt text", "AI_PROCESSING_ERROR", 500, rateLimitResult)
      }
    })
  }
}
