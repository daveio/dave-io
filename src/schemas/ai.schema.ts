import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for AI alt-text query parameters
 */
export const AiAltTextQuerySchema = z.object({
  image: z.string().url().optional().openapi({
    description: "URL of the image to generate alt text for",
    example: "https://example.com/image.jpg"
  })
})

export type AiAltTextQuery = z.infer<typeof AiAltTextQuerySchema>

/**
 * Schema for AI alt-text response
 */
export const AiAltTextResponseSchema = z.object({
  altText: z.string().openapi({
    description: "Generated alt text for the image",
    example: "A beautiful sunset over the ocean with orange and pink clouds"
  }),
  image: z.string().optional().openapi({
    description: "The URL of the image that was processed",
    example: "https://example.com/image.jpg"
  }),
  timestamp: z.string().openapi({
    description: "ISO timestamp when the alt text was generated",
    example: "2024-01-01T12:00:00.000Z"
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
  })
})

export type AiError = z.infer<typeof AiErrorSchema>
