// server/api/auth/check-authorization.post.ts
import { serverSupabaseServiceRole } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const { email, phone } = await readBody(event)

  if (!email && !phone) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email or phone required"
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from("authorized_users")
    .select("id, email, phone, permissions, is_active")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .eq("is_active", true)
    .single()

  if (error || !data) {
    return { authorized: false, user: null }
  }

  return {
    authorized: true,
    user: data,
    permissions: data.permissions
  }
})
