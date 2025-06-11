#!/usr/bin/env bun
import { writeFileSync } from "node:fs"
import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { type ZodTypeAny, z } from "zod"
import * as schemas from "../server/utils/schemas"

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

// Register all Zod schemas
for (const [name, schema] of Object.entries(schemas)) {
  if (name.endsWith("Schema") && (schema as ZodTypeAny)?.safeParse) {
    registry.register(name, schema as ZodTypeAny)
  }
}

// Register security scheme for JWT Bearer authentication
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token authorization. Include 'Bearer ' prefix."
})

// Register API endpoints
registry.registerPath({
  method: "get",
  path: "/api/internal/health",
  tags: ["Internal"],
  summary: "Health check endpoint",
  description: "Returns system health status and Cloudflare metadata",
  responses: {
    200: {
      description: "Health check successful",
      content: {
        "application/json": {
          schema: schemas.HealthCheckSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/internal/ping",
  tags: ["Internal"],
  summary: "Ping endpoint",
  description: "Simple ping/pong for monitoring",
  responses: {
    200: {
      description: "Pong response",
      content: {
        "text/plain": {
          schema: { type: "string", example: "pong" }
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/internal/worker",
  tags: ["Internal"],
  summary: "Worker information",
  description: "Returns Cloudflare Worker runtime details",
  responses: {
    200: {
      description: "Worker information",
      content: {
        "application/json": {
          schema: schemas.WorkerInfoSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/internal/auth",
  tags: ["Authentication"],
  summary: "Validate JWT token",
  description: "Validates and returns JWT token information",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Token validation successful",
      content: {
        "application/json": {
          schema: schemas.AuthIntrospectionSchema
        }
      }
    },
    401: {
      description: "Invalid or missing token",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/internal/metrics",
  tags: ["Metrics"],
  summary: "Get API metrics",
  description: "Returns comprehensive API usage metrics in various formats",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "format",
      in: "query",
      description: "Output format",
      schema: {
        type: "string",
        enum: ["json", "yaml", "prometheus"],
        default: "json"
      }
    }
  ],
  responses: {
    200: {
      description: "Metrics data",
      content: {
        "application/json": {
          schema: schemas.KVMetricsSchema
        },
        "application/yaml": {
          schema: { type: "string" }
        },
        "text/plain": {
          schema: { type: "string" }
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/ai/alt",
  tags: ["AI"],
  summary: "Generate alt-text from URL",
  description: "Generates descriptive alt-text for images from URL using AI",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "url",
      in: "query",
      required: true,
      description: "Image URL to analyze",
      schema: {
        type: "string",
        format: "uri"
      }
    }
  ],
  responses: {
    200: {
      description: "Alt-text generated successfully",
      content: {
        "application/json": {
          schema: schemas.AiAltTextResponseSchema
        }
      }
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "post",
  path: "/api/ai/alt",
  tags: ["AI"],
  summary: "Generate alt-text from base64 image",
  description: "Generates descriptive alt-text for base64-encoded images using AI",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              format: "uri",
              description: "Image URL to analyze"
            },
            image: {
              type: "string",
              description: "Base64-encoded image data (without data: prefix)"
            }
          },
          oneOf: [
            { required: ["url"] },
            { required: ["image"] }
          ]
        }
      }
    }
  },
  responses: {
    200: {
      description: "Alt-text generated successfully",
      content: {
        "application/json": {
          schema: schemas.AiAltTextResponseSchema
        }
      }
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "post",
  path: "/api/images/optimise",
  tags: ["Images"],
  summary: "Optimize image",
  description: "Optimizes images using Cloudflare Images service",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            image: {
              type: "string",
              description: "Base64-encoded image data (without data: prefix)"
            },
            quality: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Image quality (0-100, default: 80)"
            }
          },
          required: ["image"]
        }
      }
    }
  },
  responses: {
    200: {
      description: "Image optimized successfully",
      content: {
        "application/json": {
          schema: schemas.ImageOptimisationResponseSchema
        }
      }
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/tokens/{uuid}",
  tags: ["Tokens"],
  summary: "Get token information",
  description: "Retrieves detailed information about a specific token",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "uuid",
      in: "path",
      required: true,
      description: "Token UUID",
      schema: {
        type: "string",
        format: "uuid"
      }
    }
  ],
  responses: {
    200: {
      description: "Token information",
      content: {
        "application/json": {
          schema: schemas.ApiSuccessResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    },
    404: {
      description: "Token not found",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/tokens/{uuid}/usage",
  tags: ["Tokens"],
  summary: "Get token usage metrics",
  description: "Retrieves usage statistics for a specific token",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "uuid",
      in: "path",
      required: true,
      description: "Token UUID",
      schema: {
        type: "string",
        format: "uuid"
      }
    }
  ],
  responses: {
    200: {
      description: "Token usage metrics",
      content: {
        "application/json": {
          schema: schemas.TokenMetricsSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    },
    404: {
      description: "Token not found",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "post",
  path: "/api/tokens/{uuid}/revoke",
  tags: ["Tokens"],
  summary: "Revoke or restore token",
  description: "Revokes or restores access for a specific token",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "uuid",
      in: "path",
      required: true,
      description: "Token UUID",
      schema: {
        type: "string",
        format: "uuid"
      }
    }
  ],
  responses: {
    200: {
      description: "Token revocation status updated",
      content: {
        "application/json": {
          schema: schemas.ApiSuccessResponseSchema
        }
      }
    },
    403: {
      description: "Insufficient permissions",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    },
    404: {
      description: "Token not found",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/go/{slug}",
  tags: ["Redirects"],
  summary: "URL redirection",
  description: "Redirects to configured URL and tracks clicks",
  parameters: [
    {
      name: "slug",
      in: "path",
      required: true,
      description: "Redirect slug",
      schema: {
        type: "string",
        pattern: "^[a-zA-Z0-9\\-_]+$"
      }
    }
  ],
  responses: {
    307: {
      description: "Temporary redirect",
      headers: {
        Location: {
          description: "Target URL",
          schema: {
            type: "string",
            format: "uri"
          }
        }
      }
    },
    404: {
      description: "Slug not found",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/dashboard/{name}",
  tags: ["Dashboard"],
  summary: "Get dashboard data",
  description: "Retrieves dashboard data for specified source",
  parameters: [
    {
      name: "name",
      in: "path",
      required: true,
      description: "Dashboard name (e.g., 'hacker-news')",
      schema: {
        type: "string"
      }
    }
  ],
  responses: {
    200: {
      description: "Dashboard data",
      content: {
        "application/json": {
          schema: schemas.ApiSuccessResponseSchema
        }
      }
    },
    400: {
      description: "Invalid dashboard name",
      content: {
        "application/json": {
          schema: schemas.ApiErrorResponseSchema
        }
      }
    }
  }
})

registry.registerPath({
  method: "get",
  path: "/api/docs",
  tags: ["Documentation"],
  summary: "API documentation",
  description: "Interactive Swagger UI documentation",
  responses: {
    200: {
      description: "API documentation page",
      content: {
        "text/html": {
          schema: { type: "string" }
        }
      }
    }
  }
})

const generator = new OpenApiGeneratorV31(registry.definitions)

const doc = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Dave.io API",
    version: "1.0.0",
    description: "Automatically generated OpenAPI specification"
  },
  servers: [
    {
      url: "https://next.dave.io",
      description: "Production server"
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ]
})

writeFileSync("public/openapi.json", JSON.stringify(doc, null, 2))
console.log("Generated public/openapi.json")
