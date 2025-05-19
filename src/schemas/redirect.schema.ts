import { Str } from "chanfana"
import { z } from "zod"

/**
 * Schema for redirect objects
 * This schema defines the structure for URL redirects
 */
export const RedirectSchema = z.object({
  slug: Str({ example: "hello" }),
  url: Str({ example: "https://dave.io" })
})

export type Redirect = z.infer<typeof RedirectSchema>
