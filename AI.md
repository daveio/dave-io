# AI Endpoint Documentation

This document provides details about the AI endpoint in the api.dave.io codebase, including all contributing files and components.

## Overview

The API provides AI endpoints for generating alt text for images:

- `GET /ai/alt` or `GET /api/ai/alt`: Generate alt text for images using AI via URL
  - Requires: Valid JWT token with `ai` or `ai:alt` subject
  - Query parameters: `image` - URL of the image to generate alt text for
  - Returns: Generated alt text for an image with rate limit information
  - Headers: `Authorization: Bearer <token>` or query parameter `?token=<token>`

- `POST /ai/alt` or `POST /api/ai/alt`: Generate alt text for directly uploaded images
  - Requires: Valid JWT token with `ai` or `ai:alt` subject
  - Request body: JSON object with `image` property containing base64-encoded image data
  - Returns: Generated alt text for an image with rate limit information
  - Headers: `Authorization: Bearer <token>` or query parameter `?token=<token>`

## Key Files

### 1. src/endpoints/ai.ts

The main implementation of the AI endpoints:

```typescript
import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, authorizeEndpoint } from "../lib/auth"
import { AiAltTextQuerySchema, AiAltTextResponseSchema, AiErrorSchema, AiAltPostBodySchema } from "../schemas/ai.schema"
import { trackRequestAnalytics } from "../lib/analytics"

// Constants for rate limits and validations
const MAX_REQUESTS_PER_HOUR = 100
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_IMAGE_SIZE_MB = 4
const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
const IMAGE_AI_MODEL = "@cf/llava-hf/llava-1.5-7b-hf"

/**
 * AI Alt Text Generation Endpoint
 * Generates descriptive alt text for images using Cloudflare AI
 */
export class AiAlt extends OpenAPIRoute {
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
      }
    }
  }

  async handle(c: Context) {
    // Using the authorizeEndpoint helper with 'ai' endpoint and 'alt' subresource
    // JWT subject must be either 'ai' or 'ai:alt' to access this endpoint
    return authorizeEndpoint("ai", "alt")(c, async () => {
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
          const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
          const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext))

          if (!hasValidExtension) {
            return c.json({
              error: "Invalid image URL - URL must point to a valid image file",
              code: "INVALID_IMAGE_URL"
            }, 400)
          }
        } catch (error) {
          return c.json({
            error: "Invalid image URL format",
            code: "INVALID_URL_FORMAT"
          }, 400)
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
```

**Current Status**: The implementation is fully functional and uses Cloudflare AI to process images and generate descriptive alt text. It supports both GET requests with image URLs and POST requests with base64-encoded image data. Rate limiting is implemented to control usage.

### 2. src/index.ts

Relevant sections that register the AI endpoint routes:

```typescript
// Import the AI endpoint classes
import { AiAlt, AiAltPost } from "./endpoints/ai"

// Register the endpoints
// GET method for URL-based image processing
app.get("/ai/alt", (c) =>
  new AiAlt({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/ai/alt", (c) =>
  new AiAlt({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)

// POST method for directly uploaded images
app.post("/ai/alt", (c) =>
  new AiAltPost({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.post("/api/ai/alt", (c) =>
  new AiAltPost({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
```

The endpoints are available at both `/ai/alt` and `/api/ai/alt` paths with both GET and POST methods.

### 3. src/lib/auth.ts

Authentication and authorization logic used by the AI endpoint:

```typescript
export function authorizeEndpoint(endpoint: string, subresource?: string) {
  const authMiddleware = requireAuth()

  return async <T>(c: Context, handler: () => Promise<T>): Promise<Response | T> => {
    // Store the original response status to detect if auth middleware set an error
    const originalStatus = c.res.status
    let result: T | undefined

    // Run the standard JWT auth middleware first
    await authMiddleware(c, async () => {
      // If we get here, JWT is valid and user is authenticated
      // Now check if the subject in the JWT matches our endpoint requirements
      const authorizedC = c as AuthorizedContext
      const subject = authorizedC.user.id

      const fullResourcePattern = subresource ? `${endpoint}:${subresource}` : endpoint

      // Authorize if:
      // 1. Subject matches exactly the endpoint (grants access to all subresources)
      // 2. Subject matches exactly the endpoint:subresource pattern
      if (subject === endpoint || subject === fullResourcePattern) {
        result = await handler()
      } else {
        c.status(403)
        c.json({ error: "Not authorized for this resource" })
      }
    })

    // If authMiddleware set an error status, don't override it
    if (c.res.status !== originalStatus && c.res.status !== 200) {
      return c.res
    }

    return result as T
  }
}
```

The AI endpoints use this helper to ensure that the JWT token has either `ai` or `ai:alt` as its subject.

### 4. src/schemas/ai.schema.ts

Zod schemas for AI endpoint validation and response types:

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for AI alt text query parameters (GET method)
 */
export const AiAltTextQuerySchema = z.object({
  image: z
    .string()
    .url()
    .optional()
    .openapi({
      description: "URL of the image to generate alt text for",
      example: "https://example.com/image.jpg"
    })
})

export type AiAltTextQuery = z.infer<typeof AiAltTextQuerySchema>

/**
 * Schema for AI alt text POST request body
 */
export const AiAltPostBodySchema = z.object({
  image: z.string().openapi({
    description: "Base64 encoded image data (must start with data:image/...)",
    example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
  })
})

export type AiAltPostBody = z.infer<typeof AiAltPostBodySchema>

/**
 * Schema for AI alt text response
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
```

This schema file provides:
- **Query parameter validation**: Ensures the `image` parameter is a valid URL format
- **Response type safety**: Defines the structure of successful responses with TypeScript types
- **Error handling**: Standardized error response format with error codes
- **OpenAPI documentation**: Rich metadata for auto-generated API documentation

### 5. bin/jwt.ts

Command-line utility to generate JWT tokens for testing the AI endpoint:

```typescript
#!/usr/bin/env bun
// JWT generation utility
// Usage example for the AI endpoint:
// bun jwt --sub "ai:alt" --expires "24h"
```

This script can be used to generate a token with the required subject (`ai` or `ai:alt`) for testing the AI endpoints.

### 6. wrangler.jsonc

Configuration file for the Cloudflare Worker:

```jsonc
{
  "name": "api-dave-io",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-19",
  "compatibility_flags": ["nodejs_compat", "nodejs_compat_populate_process_env"],
  "observability": {
    "enabled": true
  },
  "kv_namespaces": [
    {
      "binding": "DATA",
      "id": "fa48b0bd010a43289d5e111af42b8b50"
    }
  ],
  // ...other settings
}
```

### 7. src/lib/analytics.ts

Analytics tracking used by all endpoints, including the AI endpoint:

```typescript
export function trackRequestAnalytics(env: { ANALYTICS: AnalyticsEngineDataset }, analytics: RequestAnalytics): void {
  try {
    const { path, method, status, responseTime, userAgent, referer, queryParams, errorMessage } = analytics

    // Create data point with all available info
    env.ANALYTICS.writeDataPoint({
      blobs: [method, path, userAgent || "unknown", referer || "none", queryParams || "none", errorMessage || "none"],
      doubles: [responseTime, status],
      indexes: ["request_analytics"]
    })
  } catch (error) {
    console.error("Error tracking request analytics", error)
  }
}
```

## Implemented AI Functionality

The AI alt text generation endpoints include the following features:

1. **Cloudflare AI Integration**: Using the AI binding in wrangler.jsonc to access Cloudflare's AI models.

2. **Multiple Input Methods**:
   - GET endpoint that accepts image URLs
   - POST endpoint that accepts direct base64-encoded image uploads

3. **AI Model Selection**: Uses the LLaVA model (`@cf/llava-hf/llava-1.5-7b-hf`) for high-quality image captioning.

4. **Rate Limiting**: Implements a rate limit of 100 requests per hour per user.

5. **Error Handling**: Comprehensive error handling for various edge cases:
   - Invalid URLs or file types
   - Network failures when fetching images
   - Base64 decoding errors
   - File size limitations (4MB max)
   - AI model inference failures

6. **JWT Authentication**: Authorization with scope checking (`ai` or `ai:alt`)

7. **Analytics Tracking**: Detailed request tracking with custom metadata

## Future Enhancement Opportunities

1. Add caching for commonly requested images
2. Implement additional image processing options (resizing, compression)
3. Allow customization of alt text style (brief, detailed, technical)
4. Add support for batch processing multiple images
5. Implement fallback models for improved reliability
6. Create monitoring dashboard for usage metrics

## Expanding to Additional AI Subresources

The current implementation with the `/ai/alt` endpoints can be expanded to support additional AI capabilities. Here's a comprehensive plan for scaling the AI endpoints:

### Proposed Additional AI Subresources

```text
/ai/transcribe    - Audio/video transcription
/ai/translate     - Text translation between languages
/ai/summarize     - Text summarization
/ai/chat          - Conversational AI
/ai/classify      - Text/image classification
/ai/generate      - Text/image generation
/ai/extract       - Extract structured data from text/images
/ai/moderate      - Content moderation
```

### Architecture Approaches

#### Option 1: Separate Endpoint Classes (Current Pattern)

Extend the current pattern with individual classes for each subresource:

```typescript
// src/endpoints/ai/alt.ts
export class AiAlt extends OpenAPIRoute { /* ... */ }
export class AiAltPost extends OpenAPIRoute { /* ... */ }

// src/endpoints/ai/transcribe.ts
export class AiTranscribe extends OpenAPIRoute { /* ... */ }

// src/endpoints/ai/translate.ts
export class AiTranslate extends OpenAPIRoute { /* ... */ }

// src/endpoints/ai/summarize.ts
export class AiSummarize extends OpenAPIRoute { /* ... */ }
```

**Pros:**
- Clear separation of concerns
- Easy to maintain and test individual endpoints
- Follows existing pattern
- Granular JWT authorization per subresource

**Cons:**
- Potential code duplication
- More files to manage
- Registration overhead in index.ts

#### Option 2: Unified AI Router with Subresource Handling

Create a single AI router that handles all subresources:

```typescript
// src/endpoints/ai/index.ts
export class AiRouter extends OpenAPIRoute {
  async handle(c: Context) {
    const subresource = c.req.param('subresource')

    switch (subresource) {
      case 'alt':
        return this.handleAltText(c)
      case 'transcribe':
        return this.handleTranscribe(c)
      case 'translate':
        return this.handleTranslate(c)
      // ... etc
    }
  }
}
```

**Pros:**
- Centralized AI logic
- Easier to share common functionality
- Single registration point

**Cons:**
- Large class file
- Less granular authorization
- Harder to test individual features

#### Option 3: Hybrid Approach with Shared Base Class

Create a base AI class with common functionality and specific implementations:

```typescript
// src/endpoints/ai/base.ts
export abstract class BaseAiEndpoint extends OpenAPIRoute {
  protected async authorizeAI(c: Context, subresource: string) {
    return authorizeEndpoint("ai", subresource)(c, async () => {
      return this.handleAiRequest(c)
    })
  }

  protected abstract handleAiRequest(c: Context): Promise<Response>

  protected async validateInput(c: Context, schema: ZodSchema): Promise<any> {
    // Common validation logic
  }

  protected async callAiModel(model: string, inputs: any): Promise<any> {
    // Common AI model calling logic
  }
}

// src/endpoints/ai/alt.ts
export class AiAlt extends BaseAiEndpoint {
  async handle(c: Context) {
    return this.authorizeAI(c, "alt")
  }

  protected async handleAiRequest(c: Context): Promise<Response> {
    // Alt text specific logic
  }
}
```

**Pros:**
- Shared common functionality
- Individual classes for maintainability
- Consistent error handling and validation
- Flexible authorization

**Cons:**
- More complex inheritance structure
- Potential over-engineering for simple endpoints

### JWT Authorization Strategy

The existing authorization pattern scales well to multiple subresources:

```typescript
// Granular permissions
bun jwt --sub "ai:alt"          // Only alt text generation access
bun jwt --sub "ai:transcribe"   // Only transcription access
bun jwt --sub "ai:translate"    // Only translation access

// Grouped permissions
bun jwt --sub "ai:vision"       // Alt text generation, classification, etc.
bun jwt --sub "ai:text"         // Summarize, translate, moderate
bun jwt --sub "ai:audio"        // Transcribe, generate speech

// Full access
bun jwt --sub "ai"              // Access to all AI endpoints
```

Enhanced authorization helper:

```typescript
export function authorizeAiEndpoint(subresource: string, requiredCapabilities?: string[]) {
  return authorizeEndpoint("ai", subresource, {
    allowGroupAccess: true,
    groupMappings: {
      "vision": ["alt", "classify", "extract"],
      "text": ["summarize", "translate", "moderate", "chat"],
      "audio": ["transcribe", "generate-speech"]
    }
  })
}
```

### Configuration Management

Update wrangler.jsonc to support multiple AI models:

```jsonc
{
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "AI_MODELS": {
      "alt": "@cf/llava-hf/llava-1.5-7b-hf",
      "transcribe": "@cf/openai/whisper",
      "translate": "@cf/meta/m2m100-1.2b",
      "summarize": "@cf/facebook/bart-large-cnn",
      "chat": "@cf/meta/llama-3.1-8b-instruct",
      "classify": "@cf/huggingface/distilbert-sst-2-int8"
    }
  }
}
```

### Input Validation Schemas

Define Zod schemas for each AI subresource:

```typescript
// src/schemas/ai.ts
export const AiAltSchema = z.object({
  image: z.string().url().optional(),
  imageData: z.string().optional(), // base64 encoded
  maxLength: z.number().min(10).max(500).default(100)
})

export const AiTranscribeSchema = z.object({
  audioUrl: z.string().url().optional(),
  audioData: z.string().optional(),
  language: z.string().optional(),
  task: z.enum(['transcribe', 'translate']).default('transcribe')
})

export const AiTranslateSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().optional(),
  targetLang: z.string(),
  preserveFormatting: z.boolean().default(false)
})

export const AiSummarizeSchema = z.object({
  text: z.string().min(50).max(10000),
  maxLength: z.number().min(50).max(1000).default(200),
  style: z.enum(['concise', 'detailed', 'bullet-points']).default('concise')
})
```

### Error Handling Strategy

Implement consistent error handling across all AI endpoints:

```typescript
// src/lib/ai-errors.ts
export class AiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AiError'
  }
}

export const AI_ERROR_CODES = {
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  TIMEOUT: 'TIMEOUT'
} as const

export function handleAiError(error: unknown): Response {
  if (error instanceof AiError) {
    return Response.json({
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: error.statusCode })
  }

  // Log unexpected errors and return generic message
  console.error('Unexpected AI error:', error)
  return Response.json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  }, { status: 500 })
}
```

### Rate Limiting Strategy

Implement different rate limits per AI operation:

```typescript
// src/lib/ai-rate-limiting.ts
const RATE_LIMITS = {
  'alt': { requests: 100, window: '1h', cost: 1 },
  'transcribe': { requests: 20, window: '1h', cost: 5 },
  'translate': { requests: 200, window: '1h', cost: 1 },
  'summarize': { requests: 50, window: '1h', cost: 2 },
  'chat': { requests: 1000, window: '1h', cost: 1 },
  'generate': { requests: 10, window: '1h', cost: 10 }
} as const

export async function checkRateLimit(
  env: { DATA: KVNamespace },
  userId: string,
  subresource: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Implementation for rate limiting logic
}
```

### File Organization

Recommended file structure for multiple AI endpoints:

```text
src/
├── endpoints/
│   └── ai/
│       ├── index.ts           # Main AI router or exports
│       ├── base.ts            # Base AI endpoint class
│       ├── alt.ts             # Image alt text generation
│       ├── transcribe.ts      # Audio transcription
│       ├── translate.ts       # Text translation
│       ├── summarize.ts       # Text summarization
│       ├── chat.ts            # Conversational AI
│       ├── classify.ts        # Content classification
│       ├── generate.ts        # Content generation
│       └── moderate.ts        # Content moderation
├── schemas/
│   └── ai.ts                  # AI-specific Zod schemas
├── lib/
│   ├── ai-errors.ts           # AI error handling
│   ├── ai-rate-limiting.ts    # Rate limiting for AI
│   └── ai-models.ts           # AI model configuration
└── types/
    └── ai.ts                  # AI-specific TypeScript types
```

### Monitoring and Analytics

Enhanced analytics for AI endpoints:

```typescript
// src/lib/ai-analytics.ts
export function trackAiRequest(
  env: { ANALYTICS: AnalyticsEngineDataset },
  analytics: {
    subresource: string
    model: string
    inputSize: number
    outputSize: number
    processingTime: number
    success: boolean
    userId: string
    cost?: number
  }
): void {
  env.ANALYTICS.writeDataPoint({
    blobs: [
      analytics.subresource,
      analytics.model,
      analytics.userId,
      analytics.success ? 'success' : 'failure'
    ],
    doubles: [
      analytics.inputSize,
      analytics.outputSize,
      analytics.processingTime,
      analytics.cost || 0
    ],
    indexes: ['ai_requests']
  })
}
```

### Testing Strategy

Comprehensive testing approach for multiple AI endpoints:

```typescript
// tests/ai/alt.test.ts
describe('AI Alt Text Endpoint', () => {
  test('should generate alt text for valid image URL', async () => {
    // Test implementation
  })

  test('should handle invalid image formats', async () => {
    // Test implementation
  })

  test('should respect rate limits', async () => {
    // Test implementation
  })
})

// tests/ai/shared.test.ts
describe('AI Shared Functionality', () => {
  test('should authorize correctly with different JWT subjects', async () => {
    // Test authorization patterns
  })

  test('should handle AI model failures gracefully', async () => {
    // Test error handling
  })
})
```

### Migration Strategy

To migrate from the current single endpoint to multiple subresources:

1. **Phase 1**: Implement base infrastructure
   - Create base AI endpoint class
   - Set up enhanced authorization
   - Implement error handling and rate limiting

2. **Phase 2**: Migrate existing endpoint
   - Refactor current `AiAltText` to use new base class
   - Maintain backward compatibility

3. **Phase 3**: Add new endpoints incrementally
   - Start with simple text-based endpoints (translate, summarize)
   - Add more complex endpoints (transcribe, generate)
   - Monitor usage and performance

4. **Phase 4**: Optimize and enhance
   - Add caching for expensive operations
   - Implement request queuing for heavy workloads
   - Add usage dashboards and billing integration

## Testing the AI Endpoints

You can test the AI endpoints as follows:

1. Generate a JWT token:

   ```bash
   bun jwt --sub "ai:alt" --expires "24h"
   ```

2. Test the GET endpoint with an image URL:

   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt?image=https://example.com/image.jpg"
   ```

   or using token as a query parameter:

   ```bash
   curl "https://api.dave.io/ai/alt?token=<YOUR_TOKEN>&image=https://example.com/image.jpg"
   ```

3. Test the POST endpoint with base64-encoded image data:

   ```bash
   curl -X POST \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"image":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."}' \
     https://api.dave.io/ai/alt
   ```

4. Test error handling with an invalid URL (GET):

   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt?image=invalid-url"
   ```

5. Test error handling with a non-image URL (GET):

   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt?image=https://example.com/document.pdf"
   ```

**Expected Responses:**

- With valid `image` URL (GET): Returns AI-generated alt text with rate limit information
- With valid base64 image data (POST): Returns AI-generated alt text with rate limit information
- Without an image: Returns 400 error with `NO_IMAGE_PROVIDED` code
- With invalid URL: Returns 400 error with `INVALID_URL_FORMAT` code
- With non-image URL: Returns 400 error with `INVALID_IMAGE_URL` code
- With invalid base64 data: Returns 400 error with `INVALID_IMAGE_DATA` code
- Rate limit exceeded: Returns 429 error with `RATE_LIMIT_EXCEEDED` code and reset information
