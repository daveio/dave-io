import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

// Initialize OpenAPI extensions for Zod
extendZodWithOpenApi(z)

/**
 * Schema for dashboard parameters
 */
export const DashboardParamsSchema = z.object({
  name: z.string().openapi({ description: "Dashboard name to retrieve" })
})

export type DashboardParams = z.infer<typeof DashboardParamsSchema>

/**
 * Schema for generic dashboard response data
 */
export const DashboardResponseSchema = z.object({
  dashboard: z.string(),
  data: z.record(z.any()),
  timestamp: z.number()
})

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>

/**
 * Schema for dashboard error response
 */
export const DashboardErrorSchema = z.object({
  error: z.string()
})

export type DashboardError = z.infer<typeof DashboardErrorSchema>

/**
 * Schema for demo dashboard item
 */
export const DashboardItemSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  linkURL: z.string().url().optional(),
  imageURL: z.string().url().optional()
})

export type DashboardItem = z.infer<typeof DashboardItemSchema>

/**
 * Schema for demo dashboard response
 */
export const DemoDashboardSchema = z.object({
  dashboard: z.string(),
  error: z.null(),
  items: z.array(DashboardItemSchema),
  timestamp: z.number()
})

export type DemoDashboard = z.infer<typeof DemoDashboardSchema>
