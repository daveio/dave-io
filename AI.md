# AI Endpoint Documentation

This document provides details about the AI endpoint in the api.dave.io codebase, including all contributing files and components.

## Overview

The API currently has a single AI endpoint:

- `GET /ai/alt-text` or `GET /api/ai/alt-text`: Generate alt text for images using AI
  - Requires: Valid JWT token with `ai` or `ai:alt-text` subject
  - Query parameters: `image` (optional) - URL of the image to generate alt text for
  - Returns: Generated alt text for an image
  - Headers: `Authorization: Bearer <token>` or query parameter `?token=<token>`

## Key Files

### 1. src/endpoints/ai.ts

The main implementation of the AI endpoint:

```typescript
import { OpenAPIRoute } from "chanfana"
import type { Context } from "hono"
import { z } from "zod"
import { type AuthorizedContext, authorizeEndpoint } from "../lib/auth"
import { AiAltTextQuerySchema, AiAltTextResponseSchema, AiErrorSchema } from "../schemas/ai.schema"

export class AiAltText extends OpenAPIRoute {
  schema = {
    tags: ["AI"],
    summary: "Generate alt text for images using AI",
    description: "A protected endpoint that requires authentication to generate alt text for images. Optionally provide an image URL via the 'image' query parameter.",
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

**Current Status**: The implementation is a placeholder that returns mock alt text. It now accepts an optional image URL parameter and validates the URL format and file extension, but doesn't actually process images or use AI yet.

### 2. src/index.ts

Relevant sections that register the AI endpoint routes:

```typescript
// Import the AiAltText class
import { AiAltText } from "./endpoints/ai"

// Register the endpoints
app.get("/ai/alt-text", (c) =>
  new AiAltText({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
app.get("/api/ai/alt-text", (c) =>
  new AiAltText({ router: openapi, raiseUnknownParameters: true, route: c.req.path, urlParams: [] }).execute(c)
)
```

The endpoint is available at both `/ai/alt-text` and `/api/ai/alt-text` paths.

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

The AI endpoint uses this helper to ensure that the JWT token has either `ai` or `ai:alt-text` as its subject.

### 4. src/schemas/ai.schema.ts

Zod schemas for AI endpoint validation and response types:

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for AI alt-text query parameters
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
// bun jwt --sub "ai:alt-text" --expires "24h"
```

This script can be used to generate a token with the required subject (`ai` or `ai:alt-text`) for testing the AI endpoint.

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

## Missing Components for a Complete Implementation

The current AI endpoint is a placeholder. To implement actual AI functionality, you would need to:

1. **Add Cloudflare AI Integration**: The Worker would need an AI binding in wrangler.jsonc to access Cloudflare's AI models.

2. **Image Processing Logic**: Code to extract images from requests, either via URLs or direct uploads.

3. **AI Model Selection**: Choose and integrate an appropriate image recognition model.

4. **Error Handling**: Add robust error handling for AI model failures.

5. **Response Formatting**: Format the AI-generated descriptions properly.

## Next Steps for Implementation

1. Add an AI binding to wrangler.jsonc
2. Modify the AI endpoint to accept image URLs or direct uploads
3. Integrate with a Cloudflare AI model for image description
4. Add proper error handling and validation
5. Update the endpoint documentation
6. Add tests for the AI endpoint

## Expanding to Multiple AI Subresources

The current implementation with a single `alt-text` endpoint can be expanded to support multiple AI capabilities. Here's a comprehensive plan for scaling the AI endpoints:

### Proposed AI Subresources

```text
/ai/alt-text      - Generate alt text for images
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
// src/endpoints/ai/alt-text.ts
export class AiAltText extends OpenAPIRoute { /* ... */ }

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
      case 'alt-text':
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

// src/endpoints/ai/alt-text.ts
export class AiAltText extends BaseAiEndpoint {
  async handle(c: Context) {
    return this.authorizeAI(c, "alt-text")
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
bun jwt --sub "ai:alt-text"     // Only alt-text access
bun jwt --sub "ai:transcribe"   // Only transcription access
bun jwt --sub "ai:translate"    // Only translation access

// Grouped permissions
bun jwt --sub "ai:vision"       // Alt-text, classification, etc.
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
      "vision": ["alt-text", "classify", "extract"],
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
      "alt-text": "@cf/unum/uform-gen2-qwen-500m",
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
export const AiAltTextSchema = z.object({
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
  'alt-text': { requests: 100, window: '1h', cost: 1 },
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
│       ├── alt-text.ts        # Image alt-text generation
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
// tests/ai/alt-text.test.ts
describe('AI Alt-Text Endpoint', () => {
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

## Testing the Current Endpoint

To test the existing endpoint:

1. Generate a JWT token:
   ```bash
   bun jwt --sub "ai:alt-text" --expires "24h"
   ```

2. Make a request without an image URL:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" https://api.dave.io/ai/alt-text
   ```
   or
   ```bash
   curl "https://api.dave.io/ai/alt-text?token=<YOUR_TOKEN>"
   ```

3. Make a request with an image URL:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt-text?image=https://example.com/image.jpg"
   ```
   or
   ```bash
   curl "https://api.dave.io/ai/alt-text?token=<YOUR_TOKEN>&image=https://example.com/image.jpg"
   ```

4. Test error handling with an invalid URL:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt-text?image=invalid-url"
   ```

5. Test error handling with a non-image URL:
   ```bash
   curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://api.dave.io/ai/alt-text?image=https://example.com/document.pdf"
   ```

**Expected Responses:**

- Without `image`: Returns placeholder alt text
- With valid `image`: Returns mock alt text mentioning the image URL
- With invalid `image`: Returns 400 error with appropriate error message and code
- With non-image URL: Returns 400 error indicating invalid image file type
