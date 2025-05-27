import { OpenAPIRoute } from "chanfana"
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
 * Legacy AI Alt Text endpoint
 * Maintained for backward compatibility - will be deprecated in the future
 */
export class AiAltText extends OpenAPIRoute {
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for images using AI (Legacy)",
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

/**
 * AI Alt Text Generation Endpoint
 * Generates descriptive alt text for images using Cloudflare AI
 */
export class AiAlt extends OpenAPIRoute {
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
  }

  /**
   * Handles GET requests with image URL parameter
   */
  async handle(c: Context) {
    // Using the authorizeEndpoint helper with 'ai' endpoint and 'alt' subresource
    // JWT subject must be either 'ai' or 'ai:alt' to access this endpoint
    return authorizeEndpoint("ai", "alt")(c, async () => {
      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Check rate limit before processing
      const rateLimitResult = await this.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
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

      // Get validated query parameters
      const data = await this.getValidatedData<typeof this.schema>()
      const { image } = data.query

      let imageData: Uint8Array | null = null
      const imageSource = "url"

      // Validate image URL if provided
      if (image) {
        try {
          // Basic URL validation
          const url = new URL(image)
          const pathname = url.pathname.toLowerCase()
          const hasValidExtension = VALID_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))

          if (!hasValidExtension) {
            return c.json(
              {
                error: "Invalid image URL - URL must point to a valid image file",
                code: "INVALID_IMAGE_URL"
              },
              400
            )
          }

          // Fetch the image
          const response = await fetch(image)

          if (!response.ok) {
            return c.json(
              {
                error: `Failed to fetch image: ${response.status} ${response.statusText}`,
                code: "FETCH_ERROR"
              },
              400
            )
          }

          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.startsWith("image/")) {
            return c.json(
              {
                error: "URL does not point to a valid image",
                code: "INVALID_CONTENT_TYPE"
              },
              400
            )
          }

          // Get image data
          imageData = new Uint8Array(await response.arrayBuffer())

          // Check file size
          if (imageData.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            return c.json(
              {
                error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`,
                code: "IMAGE_TOO_LARGE"
              },
              400
            )
          }
        } catch (error) {
          return c.json(
            {
              error: "Invalid image URL format",
              code: "INVALID_URL_FORMAT"
            },
            400
          )
        }
      } else {
        // No image provided
        return c.json(
          {
            error: "No image provided. Please provide an image URL or upload an image directly.",
            code: "NO_IMAGE_PROVIDED"
          },
          400
        )
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await this.generateAltText(c, imageData)

        // Track success in analytics
        const analyticsData = {
          timestamp: Date.now(),
          path: c.req.path,
          method: c.req.method,
          status: 200,
          responseTime: 0,
          userAgent: c.req.header("user-agent"),
          queryParams: `image=${image ? "provided" : "none"}`,
          customData: {
            userId,
            aiOperation: "alt-text",
            imageSource
          }
        }

        trackRequestAnalytics(c.env, analyticsData as any)

        // Return successful response with rate limit info
        return c.json({
          altText,
          image,
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: rateLimitResult.remaining - 1, // Decrement by one for this request
            reset: rateLimitResult.resetTime.toISOString(),
            limit: MAX_REQUESTS_PER_HOUR
          }
        })
      } catch (error) {
        console.error("Error generating alt text:", error)

        return c.json(
          {
            error: "Failed to generate alt text",
            code: "AI_PROCESSING_ERROR",
            rateLimit: {
              remaining: rateLimitResult.remaining,
              reset: rateLimitResult.resetTime.toISOString(),
              limit: MAX_REQUESTS_PER_HOUR
            }
          },
          500
        )
      }
    })
  }

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
}

/**
 * AI Alt Text Generation Endpoint (POST)
 * Handles POST requests with base64-encoded image data
 */
export class AiAltPost extends OpenAPIRoute {
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
  }

  /**
   * Handles POST requests with base64 image data
   */
  async handle(c: Context) {
    // Using the authorizeEndpoint helper with 'ai' endpoint and 'alt' subresource
    // JWT subject must be either 'ai' or 'ai:alt' to access this endpoint
    return authorizeEndpoint("ai", "alt")(c, async () => {
      const authContext = c as AuthorizedContext
      const userId = authContext.user.id

      // Instance of the base class to share rate limiting code
      // Create a dummy instance with required constructor parameters
      const aiAlt = new AiAlt({
        router: {},
        raiseUnknownParameters: true,
        route: c.req.path,
        urlParams: []
      })

      // Check rate limit before processing
      const rateLimitResult = await aiAlt.checkRateLimit(c.env, userId)

      if (!rateLimitResult.allowed) {
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

      // Get validated body parameters
      const data = await this.getValidatedData<typeof this.schema>()
      const { image } = data.body

      let imageData: Uint8Array | null = null
      const imageSource = "upload"

      // Validate and extract base64 image data
      if (image) {
        // Check if it's a valid data URL
        if (!image.startsWith("data:image/")) {
          return c.json(
            {
              error: "Invalid image data. Must be a base64 data URL starting with 'data:image/'",
              code: "INVALID_IMAGE_DATA"
            },
            400
          )
        }

        // Extract the base64 content
        const [header, base64Data] = image.split(",")
        if (!header || !base64Data) {
          return c.json(
            {
              error: "Invalid image data format",
              code: "INVALID_IMAGE_FORMAT"
            },
            400
          )
        }

        // Decode base64 data
        try {
          imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
        } catch (error) {
          return c.json(
            {
              error: "Invalid base64 encoding",
              code: "INVALID_BASE64"
            },
            400
          )
        }

        // Check file size
        if (imageData.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          return c.json(
            {
              error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`,
              code: "IMAGE_TOO_LARGE"
            },
            400
          )
        }
      } else {
        // No image provided
        return c.json(
          {
            error: "No image data provided.",
            code: "NO_IMAGE_PROVIDED"
          },
          400
        )
      }

      try {
        // Process the image using Cloudflare AI
        const altText = await aiAlt.generateAltText(c, imageData)

        // Track success in analytics
        const analyticsData = {
          timestamp: Date.now(),
          path: c.req.path,
          method: c.req.method,
          status: 200,
          responseTime: 0,
          userAgent: c.req.header("user-agent"),
          queryParams: "",
          customData: {
            userId,
            aiOperation: "alt-text",
            imageSource
          }
        }

        trackRequestAnalytics(c.env, analyticsData as any)

        // Return successful response with rate limit info
        return c.json({
          altText,
          image: "base64", // Indicate that this was a base64 upload
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: rateLimitResult.remaining - 1,
            reset: rateLimitResult.resetTime.toISOString(),
            limit: MAX_REQUESTS_PER_HOUR
          }
        })
      } catch (error) {
        console.error("Error generating alt text:", error)

        return c.json(
          {
            error: "Failed to generate alt text",
            code: "AI_PROCESSING_ERROR",
            rateLimit: {
              remaining: rateLimitResult.remaining,
              reset: rateLimitResult.resetTime.toISOString(),
              limit: MAX_REQUESTS_PER_HOUR
            }
          },
          500
        )
      }
    })
  }
}
