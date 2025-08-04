import { getSupabaseAdmin, ensureServerOnly } from "../../utils/supabase-admin"
import type { AuthorizationCheckRequest, AuthorizationCheckResponse, AuthorizedUser } from "../../../types/auth"
import { z } from "zod"

// Request validation schema
const requestSchema = z
  .object({
    email: z.email().optional(),
    phone: z.number().optional()
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided"
  })

export default defineEventHandler(async (event): Promise<AuthorizationCheckResponse> => {
  // Ensure this is only called server-side
  ensureServerOnly()

  // Parse and validate request body
  const body = await readBody<AuthorizationCheckRequest>(event)

  try {
    const validatedData = requestSchema.parse(body)

    // Use admin client for secure database access
    const supabase = getSupabaseAdmin()

    // Build query conditions safely
    const conditions: string[] = []
    if (validatedData.email) {
      conditions.push(`email.eq.${validatedData.email}`)
    }
    if (validatedData.phone) {
      conditions.push(`phone.eq.${validatedData.phone}`)
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("id, email, phone, permissions, is_active, created_at, updated_at")
      .or(conditions.join(","))
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return {
        authorized: false,
        user: null
      }
    }

    // Type-safe response
    const user: AuthorizedUser = {
      id: data.id,
      email: data.email,
      phone: data.phone,
      permissions: data.permissions || {},
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

    return {
      authorized: true,
      user,
      permissions: user.permissions
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request data",
        data: error.issues
      })
    }

    // Log error securely (don't expose internal errors to client)
    console.error("Authorization check error:", error)

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error during authorization check"
    })
  }
})
