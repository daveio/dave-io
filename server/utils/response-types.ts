import type { z } from "zod"
import { ApiErrorResponseSchema, ApiSuccessResponseSchema } from "./schemas"
import { createApiResponse } from "./response"
import type { ApiResponseOptions } from "./response"

/**
 * Generic typed API response schema creator
 * @param resultSchema - Zod schema for the result field
 * @returns A Zod schema for the complete API response
 */
export function createTypedSuccessResponseSchema<T extends z.ZodTypeAny>(resultSchema: T) {
  return ApiSuccessResponseSchema.omit({ result: true }).extend({
    result: resultSchema
  })
}

/**
 * Generic typed error response schema creator
 * @param detailsSchema - Optional Zod schema for the details field
 * @returns A Zod schema for the complete error response
 */
export function createTypedErrorResponseSchema<T extends z.ZodTypeAny>(detailsSchema?: T) {
  if (detailsSchema) {
    return ApiErrorResponseSchema.omit({ details: true }).extend({
      details: detailsSchema.optional()
    })
  }
  return ApiErrorResponseSchema
}

/**
 * Create a typed API response with compile-time and runtime validation
 * @param options - Response options including result and schema
 * @returns Validated API response
 */
export function createTypedApiResponse<T, TSchema extends z.ZodTypeAny>(
  options: ApiResponseOptions<T> & { resultSchema: TSchema }
): z.infer<ReturnType<typeof createTypedSuccessResponseSchema<TSchema>>> {
  // Validate the result against the provided schema
  const validatedResult = options.resultSchema.parse(options.result)

  // Create the response with validated result
  const response = createApiResponse({
    ...options,
    result: validatedResult
  })

  // TypeScript will ensure the return type matches the schema
  return response as z.infer<ReturnType<typeof createTypedSuccessResponseSchema<TSchema>>>
}

/**
 * Type helper for creating endpoint-specific response types
 */
export type TypedApiResponse<TResultSchema extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createTypedSuccessResponseSchema<TResultSchema>>
>

/**
 * Type helper for creating endpoint-specific error response types
 */
export type TypedApiErrorResponse<TDetailsSchema extends z.ZodTypeAny | undefined = undefined> =
  TDetailsSchema extends z.ZodTypeAny
    ? z.infer<ReturnType<typeof createTypedErrorResponseSchema<TDetailsSchema>>>
    : z.infer<typeof ApiErrorResponseSchema>

/**
 * Example usage:
 *
 * // Define your result schema
 * const UserResultSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email()
 * })
 *
 * // Create typed response
 * return createTypedApiResponse({
 *   result: { id: "123", name: "John", email: "john@example.com" },
 *   message: "User retrieved successfully",
 *   resultSchema: UserResultSchema
 * })
 *
 * // Type for the response
 * type UserResponse = TypedApiResponse<typeof UserResultSchema>
 */
