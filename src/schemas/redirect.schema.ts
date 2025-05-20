import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { Str } from "chanfana"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for redirect objects
 * This schema defines the structure for URL redirects
 */
export const RedirectSchema = z.object({
  slug: z.string().openapi({ example: "hello" }),
  url: z.string().openapi({ example: "https://dave.io" })
})

export type Redirect = z.infer<typeof RedirectSchema>

/**
 * Schema for redirect params
 */
export const RedirectParamsSchema = z.object({
  slug: z.string().openapi({ description: "Redirect slug" })
})

export type RedirectParams = z.infer<typeof RedirectParamsSchema>

/**
 * Schema for click tracking data
 */
export const ClickDataSchema = z.object({
  count: z.number(),
  lastAccessed: z.string().nullable()
})

export type ClickData = z.infer<typeof ClickDataSchema>

/**
 * Schema for redirect response
 */
export const RedirectResponseSchema = z.object({
  success: z.boolean(),
  redirect: RedirectSchema
})

export type RedirectResponse = z.infer<typeof RedirectResponseSchema>
