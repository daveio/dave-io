import type { AuthorizationCheckResponse } from "../../types/auth"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 requests per minute per user

// In-memory cache for authorization status
const authCache = new Map<
  string,
  {
    authorized: boolean
    timestamp: number
    permissions?: Record<string, unknown>
  }
>()

// Rate limiter storage
const rateLimiter = new Map<
  string,
  {
    count: number
    resetTime: number
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

  // Check rate limit
  const now = Date.now()
  const rateLimit = rateLimiter.get(cacheKey)

  if (rateLimit) {
    // Clean up expired rate limit entries
    if (now > rateLimit.resetTime) {
      rateLimiter.delete(cacheKey)
    } else if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limit exceeded
      throw createError({
        statusCode: 429,
        statusMessage: "Too many requests. Please try again later."
      })
    }
  }

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
    // Update rate limit counter
    const currentLimit = rateLimiter.get(cacheKey)
    if (currentLimit && now <= currentLimit.resetTime) {
      currentLimit.count++
    } else {
      rateLimiter.set(cacheKey, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      })
    }

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
/**
 * Clears the authentication cache for a specific user or all users
 *
 * @param userIdentifier - Optional email or phone to clear specific user cache
 */
export const clearAuthCache = (userIdentifier?: string) => {
  if (userIdentifier) {
    authCache.delete(userIdentifier)
  } else {
    authCache.clear()
  }
}
