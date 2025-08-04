/**
 * Authentication-related type definitions
 */

/**
 * Represents an authorized user in the system
 */
export interface AuthorizedUser {
  id: string
  email: string | null
  phone: string | null
  permissions: UserPermissions
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * User permissions object
 */
export interface UserPermissions {
  [key: string]: boolean | string | number
}

/**
 * Authorization check request body
 */
export interface AuthorizationCheckRequest {
  email?: string
  phone?: string
}

/**
 * Authorization check response
 */
export interface AuthorizationCheckResponse {
  authorized: boolean
  user: AuthorizedUser | null
  permissions?: UserPermissions
}

/**
 * Supabase auth error types
 */
export interface SupabaseAuthError {
  message: string
  status?: number
  code?: string
}
