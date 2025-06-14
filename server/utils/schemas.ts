import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import { PRESETS } from "./image-presets"

extendZodWithOpenApi(z)

// Common response schemas
export const ApiSuccessResponseSchema = z.object({
  ok: z.literal(true),
  result: z.any(),
  message: z.string(),
  error: z.null(),
  status: z.object({ message: z.string() }).nullable(),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      per_page: z.number().optional(),
      total_pages: z.number().optional(),
      request_id: z.string().optional()
    })
    .optional(),
  timestamp: z.string()
})

export const ApiErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  message: z.string(),
  status: z.object({ message: z.string() }).nullable(),
  details: z.any().optional(),
  meta: z
    .object({
      request_id: z.string().optional()
    })
    .optional(),
  timestamp: z.string()
})

// JWT related schemas
export const JWTPayloadSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number().optional(),
  jti: z.string().optional()
})

export const JWTDetailsSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number().optional(),
  jti: z.string().optional()
})

export const UserSchema = z.object({
  id: z.string(),
  issuedAt: z.string(),
  expiresAt: z.string().nullable(),
  tokenId: z.string().optional()
})

export const AuthSuccessResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  jwt: JWTDetailsSchema,
  user: UserSchema,
  timestamp: z.string()
})

export const AuthIntrospectionSchema = z.object({
  ok: z.boolean(),
  data: z.object({
    valid: z.boolean(),
    payload: JWTDetailsSchema.optional(),
    user: UserSchema.optional(),
    error: z.string().optional()
  }),
  message: z.string().optional(),
  timestamp: z.string()
})

// Health check schemas
export const HealthCheckSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
  version: z.string(),
  environment: z.string(),
  runtime: z.string().optional(),
  cf_ray: z.string().optional(),
  cf_datacenter: z.string().optional()
})

// KV Metrics Schema - matches new YAML structure
export const KVTimeMetricsSchema = z.object({
  "last-hit": z.number(),
  "last-error": z.number(),
  "last-ok": z.number()
})

export const KVVisitorMetricsSchema = z.object({
  human: z.number(),
  bot: z.number(),
  unknown: z.number()
})

export const KVGroupMetricsSchema = z.object({
  "1xx": z.number(),
  "2xx": z.number(),
  "3xx": z.number(),
  "4xx": z.number(),
  "5xx": z.number()
})

export const KVStatusMetricsSchema = z
  .object({
    "304": z.number().optional(),
    "404": z.number().optional(),
    "307": z.number().optional(),
    "405": z.number().optional(),
    "500": z.number().optional()
  })
  .passthrough() // Allow additional status codes

export const KVSampleMetricsSchema = z.object({
  ok: z.number(),
  error: z.number(),
  times: KVTimeMetricsSchema,
  visitor: KVVisitorMetricsSchema,
  group: KVGroupMetricsSchema,
  status: KVStatusMetricsSchema
})

export const KVResourceMetricsSchema = z.record(z.string(), KVSampleMetricsSchema)

export const KVRedirectMetricsSchema = z.record(z.string(), KVSampleMetricsSchema)

export const KVMetricsSchema = z
  .object({
    resources: KVResourceMetricsSchema,
    redirect: KVRedirectMetricsSchema
  })
  .merge(KVSampleMetricsSchema) // Inherit sample metrics at top level

export const KVRedirectMappingSchema = z.record(z.string(), z.string().url())

export const KVDataSchema = z.object({
  metrics: KVMetricsSchema,
  redirect: KVRedirectMappingSchema
})

// Worker info schemas
export const WorkerInfoSchema = z.object({
  runtime: z.string(),
  preset: z.string(),
  api_available: z.boolean(),
  server_side_rendering: z.boolean(),
  edge_functions: z.boolean(),
  cf_ray: z.string(),
  cf_ipcountry: z.string(),
  cf_connecting_ip: z.string(),
  worker_limits: z.object({
    cpu_time: z.string(),
    memory: z.string(),
    request_timeout: z.string()
  })
})

// Ping endpoint schema (new restructured format)
export const PingResponseSchema = z.object({
  cloudflare: z.object({
    connectingIP: z.string(),
    country: z.object({
      ip: z.string(),
      primary: z.string()
    }),
    datacentre: z.string(),
    ray: z.string(),
    request: z.object({
      agent: z.string(),
      host: z.string(),
      method: z.string(),
      path: z.string(),
      proto: z.object({
        forward: z.string(),
        request: z.string()
      }),
      version: z.string()
    })
  }),
  worker: z.object({
    edge_functions: z.boolean(),
    environment: z.string(),
    limits: z.object({
      cpu_time: z.string(),
      memory: z.string(),
      request_timeout: z.string()
    }),
    preset: z.string(),
    runtime: z.string(),
    server_side_rendering: z.boolean(),
    version: z.string()
  })
})

// Enhanced ping endpoint schema (includes auth and headers)
export const EnhancedPingResponseSchema = z.object({
  data: PingResponseSchema,
  auth: z.object({
    supplied: z.boolean(),
    token: z
      .object({
        value: z.string(),
        valid: z.boolean(),
        payload: z
          .object({
            subject: z.string(),
            tokenId: z.string().nullable(),
            issuedAt: z.string(),
            expiresAt: z.string().nullable()
          })
          .optional()
      })
      .optional()
  }),
  headers: z.object({
    count: z.number(),
    cloudflare: z.record(z.string(), z.string()),
    forwarding: z.record(z.string(), z.string()),
    other: z.record(z.string(), z.string())
  }),
  ok: z.literal(true),
  timestamp: z.string()
})

// URL redirect schemas (for /go endpoints)
export const UrlRedirectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  clicks: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string().optional()
})

export const CreateRedirectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional()
})

// AI service schemas
export const AiAltTextRequestSchema = z
  .object({
    url: z.string().url().optional(),
    image: z
      .string()
      .refine((val) => !val.startsWith("data:"), {
        message: "Image must be raw base64 without data URL"
      })
      .optional() // base64 encoded image
  })
  .refine((data) => data.url || data.image, {
    message: "Either url or image must be provided"
  })

export const AiAltTextResponseSchema = z.object({
  ok: z.literal(true),
  alt_text: z.string(),
  confidence: z.number().optional(),
  processing_time_ms: z.number().optional(),
  timestamp: z.string()
})

// Token management schemas
export const TokenUsageSchema = z.object({
  token_id: z.string(),
  usage_count: z.number(),
  max_requests: z.number().nullable().optional(),
  created_at: z.string(),
  last_used: z.string().optional()
})

export const TokenMetricsSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    total_requests: z.number(),
    successful_requests: z.number(),
    failed_requests: z.number(),
    redirect_clicks: z.number(),
    kv_timings_ms: z.record(z.string(), z.number()).optional()
  }),
  timestamp: z.string()
})

// Image optimisation schemas
export const ImageOptimisationRequestSchema = z
  .object({
    image: z
      .string()
      .refine((val) => !val.startsWith("data:"), {
        message: "Image must be raw base64 without data URL"
      })
      .optional(),
    quality: z.number().min(0).max(100).optional()
  })
  .refine((data) => data.image, {
    message: "Image field is required for POST requests"
  })

export const ImageOptimisationQuerySchema = z.object({
  url: z.string().url("Image URL must be a valid URL"),
  quality: z.number().min(0).max(100).optional()
})

export const ImageOptimisationResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    url: z.string().url(),
    originalSizeBytes: z.number(),
    optimisedSizeBytes: z.number(),
    compressionRatio: z.number(),
    format: z.literal("webp"),
    hash: z.string(),
    quality: z.number().optional(),
    preset: z
      .object({
        name: z.enum(Object.keys(PRESETS) as [string, ...string[]]),
        description: z.string(),
        maxSizeBytes: z.number()
      })
      .optional(),
    imageSource: z.string(),
    timestamp: z.string()
  }),
  message: z.string(),
  timestamp: z.string()
})

// AI Tickets schemas
export const AiTicketImageDataSchema = z.object({
  data: z.string().refine((val) => !val.startsWith("data:"), {
    message: "Image must be raw base64 without data URL"
  }),
  filename: z.string()
})

export const AiTicketTitleRequestSchema = z
  .object({
    description: z.string().optional(),
    image: AiTicketImageDataSchema.optional()
  })
  .refine((data) => data.description || data.image, {
    message: "Either description or image must be provided"
  })

export const AiTicketTitleResponseSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    title: z.string()
  }),
  status: z.object({ message: z.string() }).nullable(),
  error: z.null(),
  timestamp: z.string()
})

export const AiTicketDescriptionRequestSchema = z.object({
  title: z.string()
})

export const AiTicketDescriptionResponseSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    description: z.string()
  }),
  status: z.object({ message: z.string() }).nullable(),
  error: z.null(),
  timestamp: z.string()
})

export const AiTicketEnrichRequestSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    image: AiTicketImageDataSchema.optional()
  })
  .refine((data) => data.description || data.image, {
    message: "Either description or image must be provided in addition to title"
  })

export const AiTicketEnrichResponseSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    description: z.string()
  }),
  status: z.object({ message: z.string() }).nullable(),
  error: z.null(),
  timestamp: z.string()
})

// Export commonly used types
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type JWTPayload = z.infer<typeof JWTPayloadSchema>
export type JWTDetails = z.infer<typeof JWTDetailsSchema>
export type User = z.infer<typeof UserSchema>
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>
export type AuthIntrospection = z.infer<typeof AuthIntrospectionSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
export type WorkerInfo = z.infer<typeof WorkerInfoSchema>
export type PingResponse = z.infer<typeof PingResponseSchema>
export type EnhancedPingResponse = z.infer<typeof EnhancedPingResponseSchema>
export type UrlRedirect = z.infer<typeof UrlRedirectSchema>
export type CreateRedirect = z.infer<typeof CreateRedirectSchema>
export type AiAltTextRequest = z.infer<typeof AiAltTextRequestSchema>
export type AiAltTextResponse = z.infer<typeof AiAltTextResponseSchema>
export type TokenUsage = z.infer<typeof TokenUsageSchema>
export type TokenMetrics = z.infer<typeof TokenMetricsSchema>
export type ImageOptimisationRequest = z.infer<typeof ImageOptimisationRequestSchema>
export type ImageOptimisationQuery = z.infer<typeof ImageOptimisationQuerySchema>
export type ImageOptimisationResponse = z.infer<typeof ImageOptimisationResponseSchema>
export type AiTicketImageData = z.infer<typeof AiTicketImageDataSchema>
export type AiTicketTitleRequest = z.infer<typeof AiTicketTitleRequestSchema>
export type AiTicketTitleResponse = z.infer<typeof AiTicketTitleResponseSchema>
export type AiTicketDescriptionRequest = z.infer<typeof AiTicketDescriptionRequestSchema>
export type AiTicketDescriptionResponse = z.infer<typeof AiTicketDescriptionResponseSchema>
export type AiTicketEnrichRequest = z.infer<typeof AiTicketEnrichRequestSchema>
export type AiTicketEnrichResponse = z.infer<typeof AiTicketEnrichResponseSchema>

// New KV schema types
export type KVTimeMetrics = z.infer<typeof KVTimeMetricsSchema>
export type KVVisitorMetrics = z.infer<typeof KVVisitorMetricsSchema>
export type KVGroupMetrics = z.infer<typeof KVGroupMetricsSchema>
export type KVStatusMetrics = z.infer<typeof KVStatusMetricsSchema>
export type KVSampleMetrics = z.infer<typeof KVSampleMetricsSchema>
export type KVResourceMetrics = z.infer<typeof KVResourceMetricsSchema>
export type KVRedirectMetrics = z.infer<typeof KVRedirectMetricsSchema>
export type KVMetrics = z.infer<typeof KVMetricsSchema>
export type KVRedirectMapping = z.infer<typeof KVRedirectMappingSchema>
export type KVData = z.infer<typeof KVDataSchema>
