import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for AI alt-text query parameters (GET method)
 */
export const AiAltTextQuerySchema = z.object({
  image: z.string().url().optional().openapi({
    description: "URL of the image to generate alt text for",
    example: "https://example.com/image.jpg"
  })
})

export type AiAltTextQuery = z.infer<typeof AiAltTextQuerySchema>

/**
 * Schema for AI alt-text POST request body
 */
export const AiAltPostBodySchema = z.object({
  image: z.string().openapi({
    description: "Base64 encoded image data (must start with data:image/...)",
    example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
  })
})

export type AiAltPostBody = z.infer<typeof AiAltPostBodySchema>

/**
 * Schema for AI alt-text response
 */
export const AiAltTextResponseSchema = z.object({
  altText: z.string().openapi({
    description: "Generated alt text for the image",
    example: "A beautiful sunset over the ocean with orange and pink clouds"
  }),
  image: z.string().optional().openapi({
    description: "The URL of the image that was processed or 'base64' if uploaded directly",
    example: "https://example.com/image.jpg"
  }),
  timestamp: z.string().openapi({
    description: "ISO timestamp when the alt text was generated",
    example: "2024-01-01T12:00:00.000Z"
  }),
  rateLimit: z
    .object({
      remaining: z.number().openapi({
        description: "Remaining requests allowed in the current window",
        example: 99
      }),
      reset: z.string().openapi({
        description: "ISO timestamp when the rate limit will reset",
        example: "2024-01-01T13:00:00.000Z"
      }),
      limit: z.number().openapi({
        description: "Maximum number of requests allowed in the window",
        example: 100
      })
    })
    .optional()
    .openapi({
      description: "Rate limit information"
    })
})

export type AiAltTextResponse = z.infer<typeof AiAltTextResponseSchema>

/**
 * Schema for AI error responses
 */
export const AiErrorSchema = z.object({
  error: z.string().openapi({
    description: "Error message describing what went wrong",
    example: "Invalid image URL provided"
  }),
  code: z.string().optional().openapi({
    description: "Error code for programmatic handling",
    example: "INVALID_URL"
  }),
  rateLimit: z
    .object({
      remaining: z.number(),
      reset: z.string(),
      limit: z.number()
    })
    .optional()
    .openapi({
      description: "Rate limit information, if applicable"
    })
})

export type AiError = z.infer<typeof AiErrorSchema>
