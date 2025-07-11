import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

extendZodWithOpenApi(z)

// Common response schemas
export const ApiSuccessResponseSchema = z.object({
  ok: z.literal(true),
  result: z.any().openapi({ type: "object" }),
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
  details: z.any().openapi({ type: "object" }).optional(),
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
    304: z.number().optional(),
    404: z.number().optional(),
    307: z.number().optional(),
    405: z.number().optional(),
    500: z.number().optional()
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
    .regex(/^[\w-]+$/),
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
    .regex(/^[\w-]+$/),
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional()
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

// AI Social schemas
export const AiSocialNetworkEnum = z.enum(["bluesky", "mastodon", "threads", "x"])

export const AiSocialStrategyEnum = z.enum([
  "sentence_boundary",
  "word_boundary",
  "paragraph_preserve",
  "thread_optimize",
  "hashtag_preserve"
])

export const AiSocialRequestSchema = z
  .object({
    input: z.string().min(1, "Input text is required"),
    networks: z
      .array(AiSocialNetworkEnum)
      .min(1, "At least one network must be specified")
      .max(10, "Maximum 10 networks allowed"),
    markdown: z.boolean().optional().default(false),
    strategies: z
      .array(AiSocialStrategyEnum)
      .max(10, "Maximum 10 strategies allowed")
      .optional()
      .default(["sentence_boundary", "thread_optimize"])
  })
  .openapi({
    title: "AI Social Request",
    description: "Request to split text into social media posts"
  })

export const AiSocialResponseSchema = z
  .object({
    ok: z.literal(true),
    result: z.object({
      networks: z.record(
        AiSocialNetworkEnum,
        z.array(z.string()).max(100, "Maximum 100 posts per network").describe("Array of posts for this network")
      )
    }),
    status: z.object({ message: z.string() }).nullable(),
    error: z.null(),
    timestamp: z.string()
  })
  .openapi({
    title: "AI Social Response",
    description: "Response containing split text for each social network"
  })

// AI Alt schemas
export const AiAltRequestGetSchema = z
  .object({
    image: z.string().min(1, "Image URL is required").url("Must be a valid image URL").openapi({
      type: "string",
      format: "uri",
      description: "URL of the image to analyze"
    })
  })
  .openapi({
    title: "AI Alt Text GET Request",
    description: "Request to generate alt text from an image URL"
  })

export const AiAltRequestPostSchema = z
  .object({
    image: z.any().openapi({ type: "string", format: "binary" }).describe("Image file (multipart form data)")
  })
  .openapi({
    title: "AI Alt Text POST Request",
    description: "Request to generate alt text from an uploaded image file"
  })

export const AiAltResponseSchema = z
  .object({
    ok: z.literal(true),
    result: z.object({
      alt_text: z.string().describe("Generated alt text for the image"),
      confidence: z.number().min(0).max(1).optional().describe("Confidence score for the generated alt text")
    }),
    status: z.object({ message: z.string() }).nullable(),
    error: z.null(),
    timestamp: z.string()
  })
  .openapi({
    title: "AI Alt Text Response",
    description: "Response containing generated alt text for an image"
  })

// AI Word schemas
export const AiWordRequestSchema = z
  .discriminatedUnion("mode", [
    z.object({
      mode: z.literal("single"),
      word: z.string().min(1, "Word is required").max(100, "Word too long")
    }),
    z.object({
      mode: z.literal("context"),
      text: z.string().min(1, "Text is required").max(5000, "Text too long"),
      target_word: z.string().min(1, "Target word is required").max(100, "Target word too long")
    })
  ])
  .openapi({
    title: "AI Word Request",
    description: "Request to find alternative words"
  })

export const AiWordSuggestionSchema = z.object({
  word: z.string().describe("Suggested alternative word"),
  confidence: z.number().min(0).max(1).optional().describe("Confidence score for this suggestion")
})

export const AiWordResponseSchema = z
  .object({
    ok: z.literal(true),
    result: z.object({
      suggestions: z
        .array(AiWordSuggestionSchema)
        .min(5)
        .max(10)
        .describe("Array of word suggestions ordered by likelihood")
    }),
    status: z.object({ message: z.string() }).nullable(),
    error: z.null(),
    timestamp: z.string()
  })
  .openapi({
    title: "AI Word Response",
    description: "Response containing alternative word suggestions"
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
export type TokenUsage = z.infer<typeof TokenUsageSchema>
export type TokenMetrics = z.infer<typeof TokenMetricsSchema>
export type AiSocialNetwork = z.infer<typeof AiSocialNetworkEnum>
export type AiSocialStrategy = z.infer<typeof AiSocialStrategyEnum>
export type AiSocialRequest = z.infer<typeof AiSocialRequestSchema>
export type AiSocialResponse = z.infer<typeof AiSocialResponseSchema>
export type AiAltRequestGet = z.infer<typeof AiAltRequestGetSchema>
export type AiAltRequestPost = z.infer<typeof AiAltRequestPostSchema>
export type AiAltResponse = z.infer<typeof AiAltResponseSchema>
export type AiWordRequest = z.infer<typeof AiWordRequestSchema>
export type AiWordSuggestion = z.infer<typeof AiWordSuggestionSchema>
export type AiWordResponse = z.infer<typeof AiWordResponseSchema>

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
