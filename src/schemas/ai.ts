import { z } from "zod"
import { CommonHeaders, ErrorResponseSchema, RateLimitSchema } from "./common"

// Query schema for GET request
export const AiAltGetQuerySchema = z.object({
  image: z.string().url().describe("URL of the image to generate alt text for"),
  token: z.string().optional().describe("JWT token as query parameter (alternative to Authorization header)")
})

// Request body schema for POST request
export const AiAltPostRequestSchema = z.object({
  image: z.string().describe("Base64-encoded image data with data URL format (e.g., 'data:image/jpeg;base64,...')")
})

// Success response schema
export const AiAltSuccessResponseSchema = z.object({
  altText: z.string().describe("Generated descriptive alt text for the image"),
  image: z.string().describe("Original image URL or identifier"),
  timestamp: z.string().describe("ISO timestamp when alt text was generated"),
  rateLimit: RateLimitSchema.describe("Rate limit information")
})

// Error response with rate limit info
export const AiAltErrorResponseSchema = z.object({
  error: z.string().describe("Error message"),
  code: z.string().optional().describe("Error code for programmatic handling"),
  rateLimit: RateLimitSchema.optional().describe("Rate limit information (if available)")
})

export const AiAltGetRouteSchema = {
  tags: ["AI Services"],
  summary: "Generate alt text from image URL",
  description:
    "Generates descriptive alt text for an image using Cloudflare AI. Requires JWT authentication with 'ai' or 'ai:alt' permissions. Rate limited to 100 requests per hour.",
  security: [{ bearerAuth: [] }],
  request: {
    query: AiAltGetQuerySchema
  },
  responses: {
    200: {
      description: "Alt text generated successfully",
      content: {
        "application/json": {
          schema: AiAltSuccessResponseSchema
        }
      }
    },
    400: {
      description: "Bad request - invalid image URL or format",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions - requires 'ai' or 'ai:alt'",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    },
    429: {
      description: "Rate limit exceeded - maximum 100 requests per hour",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    },
    500: {
      description: "Internal server error or AI processing failed",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    }
  }
}

export const AiAltPostRouteSchema = {
  tags: ["AI Services"],
  summary: "Generate alt text from uploaded image",
  description:
    "Generates descriptive alt text for a base64-encoded image using Cloudflare AI. Requires JWT authentication with 'ai' or 'ai:alt' permissions. Rate limited to 100 requests per hour. Maximum image size: 4MB.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AiAltPostRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: "Alt text generated successfully",
      content: {
        "application/json": {
          schema: AiAltSuccessResponseSchema
        }
      }
    },
    400: {
      description: "Bad request - invalid image data or format",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions - requires 'ai' or 'ai:alt'",
      content: {
        "application/json": {
          schema: ErrorResponseSchema
        }
      }
    },
    413: {
      description: "Image too large - maximum size is 4MB",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    },
    429: {
      description: "Rate limit exceeded - maximum 100 requests per hour",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    },
    500: {
      description: "Internal server error or AI processing failed",
      content: {
        "application/json": {
          schema: AiAltErrorResponseSchema
        }
      }
    }
  }
}
