import type { AuthorizationCheckResponse } from "../../types/auth"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// In-memory cache for authorization status
const authCache = new Map<
  string,
  {
    authorized: boolean
    timestamp: number
    permissions?: Record<string, unknown>
  }
>()

export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const user = useSupabaseUser()

  // If no user, redirect to login
  if (!user.value) {
    return navigateTo("/auth/login")
  }

  // Create cache key from user identifier
  const cacheKey = user.value.email || user.value.phone || user.value.id

  // Check cache first
  const cached = authCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    if (!cached.authorized) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: User not authorized"
      })
    }
    // User is authorized, continue
    return
  }

  // Check if user is in authorized whitelist
  try {
    const response = await $fetch<AuthorizationCheckResponse>("/api/auth/check-authorization", {
      method: "POST",
      body: {
        email: user.value.email,
        phone: user.value.phone
      }
    })

    // Cache the result
    authCache.set(cacheKey, {
      authorized: response.authorized,
      timestamp: Date.now(),
      permissions: response.permissions
    })

    if (!response.authorized) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: User not authorized"
      })
    }
  } catch (error) {
    // Clear cache on error
    authCache.delete(cacheKey)

    // If it's already a 403, re-throw it
    if (error instanceof Error && "statusCode" in error && error.statusCode === 403) {
      throw error
    }

    // Otherwise, throw generic access denied
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied"
    })
  }
})

// Export helper to clear cache when needed (e.g., on logout)
export const clearAuthCache = (userIdentifier?: string) => {
  if (userIdentifier) {
    authCache.delete(userIdentifier)
  } else {
    authCache.clear()
  }
}
