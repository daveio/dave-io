import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

// Common response schemas
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
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
  success: z.literal(false),
  error: z.string(),
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
  success: z.literal(true),
  message: z.string(),
  jwt: JWTDetailsSchema,
  user: UserSchema,
  timestamp: z.string()
})

export const AuthIntrospectionSchema = z.object({
  success: z.boolean(),
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

// Legacy SystemMetrics for backward compatibility
export const SystemMetricsSchema = z.object({
  users: z.object({
    total: z.number(),
    active: z.number(),
    new_today: z.number()
  }),
  posts: z.object({
    total: z.number(),
    published: z.number(),
    drafts: z.number()
  }),
  system: z.object({
    runtime: z.string(),
    timestamp: z.string(),
    cf_ray: z.string().optional(),
    cf_datacenter: z.string().optional(),
    cf_country: z.string().optional()
  }),
  api: z.object({
    version: z.string(),
    endpoints_available: z.number()
  })
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
  success: z.literal(true),
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
  success: z.literal(true),
  data: z.object({
    total_requests: z.number(),
    successful_requests: z.number(),
    failed_requests: z.number(),
    redirect_clicks: z.number()
  }),
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
export type SystemMetrics = z.infer<typeof SystemMetricsSchema>
export type WorkerInfo = z.infer<typeof WorkerInfoSchema>
export type UrlRedirect = z.infer<typeof UrlRedirectSchema>
export type CreateRedirect = z.infer<typeof CreateRedirectSchema>
export type AiAltTextRequest = z.infer<typeof AiAltTextRequestSchema>
export type AiAltTextResponse = z.infer<typeof AiAltTextResponseSchema>
export type TokenUsage = z.infer<typeof TokenUsageSchema>
export type TokenMetrics = z.infer<typeof TokenMetricsSchema>

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
