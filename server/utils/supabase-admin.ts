import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

let adminClient: SupabaseClient | null = null

/**
 * Creates a Supabase client with service role privileges for admin operations
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
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.")
  }

  // Create admin client with service role key
  // Disable auth features that are not needed for server-side operations
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
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
