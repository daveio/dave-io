import { z } from "zod"

/**
 * Schema for ping response
 */
export const PingResponseSchema = z.object({
  service: z.string(),
  response: z.string()
})

export type PingResponse = z.infer<typeof PingResponseSchema>
