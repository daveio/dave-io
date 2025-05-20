import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for RouterOS IP data cache
 */
export const RouterOSCacheDataSchema = z.object({
  ipv4Ranges: z.array(z.string()),
  ipv6Ranges: z.array(z.string()),
  lastUpdated: z.string().nullable(),
  lastError: z.string().nullable(),
  updateInProgress: z.boolean().optional()
})

export type RouterOSCacheData = z.infer<typeof RouterOSCacheDataSchema>

/**
 * Schema for RouterOS cache metadata
 */
export const RouterOSCacheMetadataSchema = z.object({
  lastUpdated: z.string().nullable(),
  lastError: z.string().nullable(),
  lastAttempt: z.string().nullable(),
  updateInProgress: z.boolean()
})

export type RouterOSCacheMetadata = z.infer<typeof RouterOSCacheMetadataSchema>

/**
 * Schema for RouterOS API responses
 */

// RIPE API response
export const RipePrefixSchema = z.object({
  prefix: z.string()
})

export const RipeDataSchema = z.object({
  data: z.object({
    prefixes: z.array(RipePrefixSchema)
  })
})

export type RipePrefix = z.infer<typeof RipePrefixSchema>
export type RipeData = z.infer<typeof RipeDataSchema>

// BGPView API response
export const BGPViewPrefixSchema = z.object({
  prefix: z.string(),
  ip: z.string(),
  cidr: z.number(),
  routed: z.boolean()
})

export const BGPViewDataSchema = z.object({
  data: z.object({
    ipv4_prefixes: z.array(BGPViewPrefixSchema),
    ipv6_prefixes: z.array(BGPViewPrefixSchema)
  })
})

export type BGPViewPrefix = z.infer<typeof BGPViewPrefixSchema>
export type BGPViewData = z.infer<typeof BGPViewDataSchema>

// RouterOS API error response
export const RouterOSErrorSchema = z.object({
  error: z.string(),
  message: z.string()
})

export type RouterOSError = z.infer<typeof RouterOSErrorSchema>

// RouterOS Cache Status Response
export const RouterOSCacheStatusSchema = z.object({
  putio: z.object({
    lastUpdated: z.string().nullable(),
    lastError: z.string().nullable(),
    lastAttempt: z.string().nullable(),
    updateInProgress: z.boolean(),
    ipv4Count: z.number(),
    ipv6Count: z.number()
  }),
  shared: z.record(z.unknown()),
  providers: z.array(z.string())
})

export type RouterOSCacheStatus = z.infer<typeof RouterOSCacheStatusSchema>

// RouterOS Cache Reset Response
export const RouterOSResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

export type RouterOSResetResponse = z.infer<typeof RouterOSResetResponseSchema>
