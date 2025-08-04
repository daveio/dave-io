import { getSupabaseAdmin, ensureServerOnly } from "../../utils/supabase-admin"
import type { AuthorizationCheckRequest, AuthorizationCheckResponse, AuthorizedUser } from "../../../types/auth"
import { z } from "zod"

// Request validation schema with E.164 phone number validation
const requestSchema = z
  .object({
    email: z.email().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164)")
      .optional()
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

    // Build query using proper Supabase query builder methods
    let query = supabase
      .from("contacts")
      .select("id, email, phone, permissions, is_active, created_at, updated_at")
      .eq("is_active", true)

    // Add conditions safely using query builder
    if (validatedData.email && validatedData.phone) {
      query = query.or(`email.eq.${validatedData.email},phone.eq.${validatedData.phone}`)
    } else if (validatedData.email) {
      query = query.eq("email", validatedData.email)
    } else if (validatedData.phone) {
      query = query.eq("phone", validatedData.phone)
    }

    const { data, error } = await query.single()

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
