import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

let adminClient: SupabaseClient | null = null

/**
 * Creates a Supabase client with API key for admin operations
 * This should ONLY be used in server-side code
 *
 * @returns Supabase client with admin privileges
 * @throws Error if environment variables are not configured
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_KEY are set.")
  }

  // Validate that we're using a service role key (starts with sb_secret_)
  if (!supabaseKey.startsWith("sb_secret_")) {
    throw new Error("Invalid Supabase key format. Use service role key starting with sb_secret_")
  }

  // Create admin client with API key
  // Disable auth features that are not needed for server-side operations
  adminClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })

  return adminClient
}

/**
 * Validates that the code is running on the server
 * @throws Error if called from client-side code
 */
export function ensureServerOnly(): void {
  if (import.meta.client) {
    throw new Error("This function can only be called on the server side")
  }
}
