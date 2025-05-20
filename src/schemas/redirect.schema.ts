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
