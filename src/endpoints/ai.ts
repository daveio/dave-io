import { OpenAPIRoute } from "chanfana"
import type { OpenAPIRouteSchema } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { trackRequestAnalytics } from "../lib/analytics"
import { type AuthorizedContext, authorizeEndpoint } from "../lib/auth"
import { AiAltPostBodySchema, AiAltTextQuerySchema, AiAltTextResponseSchema, AiErrorSchema } from "../schemas/ai.schema"

// Constants for rate limits and validations
const MAX_REQUESTS_PER_HOUR = 100
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_IMAGE_SIZE_MB = 4
const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
const IMAGE_AI_MODEL = "@cf/llava-hf/llava-1.5-7b-hf"

/**
 * Base class for AI Alt Text endpoints with shared functionality
 */
class AiAltBase extends OpenAPIRoute {
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
    status = 400,
    rateLimitResult?: { remaining: number; resetTime: Date }
  ) {
    const responseObj: any = {
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

    return c.json(responseObj, status as any)
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
   * Process image URL and return image data or error response
   */
  async processImageFromUrl(c: Context, imageUrl: string): Promise<Uint8Array | Response> {
    try {
      // Basic URL validation
      const url = new URL(imageUrl)
      const pathname = url.pathname.toLowerCase()
      const hasValidExtension = VALID_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))

      if (!hasValidExtension) {
        return this.createErrorResponse(
          c,
          "Invalid image URL - URL must point to a valid image file",
          "INVALID_IMAGE_URL"
        )
      }

      // Fetch the image
      const response = await fetch(imageUrl)

      if (!response.ok) {
        return this.createErrorResponse(
          c,
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          "FETCH_ERROR"
        )
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.startsWith("image/")) {
        return this.createErrorResponse(c, "URL does not point to a valid image", "INVALID_CONTENT_TYPE")
      }

      // Get image data
      const imageData = new Uint8Array(await response.arrayBuffer())

      // Check file size
      const sizeError = this.validateImageSize(c, imageData)
      if (sizeError) return sizeError

      return imageData
    } catch (_error) {
      return this.createErrorResponse(c, "Invalid image URL format", "INVALID_URL_FORMAT")
    }
  }

  /**
   * Process base64 image data and return image data or error response
   */
  processBase64Image(c: Context, imageDataUrl: string): Uint8Array | Response {
    // Check if it's a valid data URL
    if (!imageDataUrl.startsWith("data:image/")) {
      return this.createErrorResponse(
        c,
        "Invalid image data. Must be a base64 data URL starting with 'data:image/'",
        "INVALID_IMAGE_DATA"
      )
    }

    // Extract the base64 content
    const [header, base64Data] = imageDataUrl.split(",")
    if (!header || !base64Data) {
      return this.createErrorResponse(c, "Invalid image data format", "INVALID_IMAGE_FORMAT")
    }

    // Decode base64 data
    try {
      const imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

      // Check file size
      const sizeError = this.validateImageSize(c, imageData)
      if (sizeError) return sizeError

      return imageData
    } catch (_error) {
      return this.createErrorResponse(c, "Invalid base64 encoding", "INVALID_BASE64")
    }
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

/**
 * AI Alt Text Generation Endpoint
 * Generates descriptive alt text for images using Cloudflare AI
 */
export class AiAlt extends AiAltBase {
  // @ts-ignore - Schema type compatibility issues with chanfana/zod
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for images using AI",
    description:
      "A protected endpoint that requires authentication to generate alt text for images. Provide an image URL via the 'image' query parameter or upload an image directly.",
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
      const { image } = (data.query as any) || {}

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

/**
 * AI Alt Text Generation Endpoint (POST)
 * Handles POST requests with base64-encoded image data
 */
export class AiAltPost extends AiAltBase {
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
      const { image } = (data.body as any) || {}

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
