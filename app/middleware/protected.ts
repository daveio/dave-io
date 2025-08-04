import type { AuthorizationCheckResponse } from "../../types/auth"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 requests per minute per user

// Cache cleanup configuration
const CLEANUP_INTERVAL = 10 * 60 * 1000 // Clean up every 10 minutes
const MAX_CACHE_SIZE = 10000 // Maximum number of cache entries

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

// Cache cleanup tracking
let lastCleanup = Date.now()

/**
 * Creates a consistent cache key based on user ID to prevent collision risks
 * Falls back to email/phone only if ID is not available (edge case)
 */
function createSecureCacheKey(user: any): string {
  // Always prioritize user ID for consistency
  if (user.id) {
    return `user:${user.id}`
  }

  // Fallback for edge cases where ID might not be available
  // Use a deterministic combination to avoid collision
  const email = user.email?.toLowerCase() || ""
  const phone = user.phone || ""

  if (email && phone) {
    // If both exist, create a composite key to ensure uniqueness
    return `composite:${email}:${phone}`
  }

  return email || phone || "unknown"
}

/**
 * Performs cache cleanup to prevent memory leaks
 */
function cleanupCaches(): void {
  const now = Date.now()

  // Clean up expired auth cache entries
  for (const [key, value] of authCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      authCache.delete(key)
    }
  }

  // Clean up expired rate limit entries
  for (const [key, value] of rateLimiter.entries()) {
    if (now > value.resetTime) {
      rateLimiter.delete(key)
    }
  }

  // If caches are still too large, remove oldest entries (LRU-style)
  if (authCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(authCache.entries())
    entries.sort((a, b) => (a[1]?.timestamp || 0) - (b[1]?.timestamp || 0))

    // Remove oldest 20% of entries
    const removeCount = Math.floor(MAX_CACHE_SIZE * 0.2)
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      const entry = entries[i]
      if (entry?.[0]) {
        authCache.delete(entry[0])
      }
    }
  }

  if (rateLimiter.size > MAX_CACHE_SIZE) {
    const entries = Array.from(rateLimiter.entries())
    entries.sort((a, b) => (a[1]?.resetTime || 0) - (b[1]?.resetTime || 0))

    // Remove oldest 20% of entries
    const removeCount = Math.floor(MAX_CACHE_SIZE * 0.2)
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      const entry = entries[i]
      if (entry?.[0]) {
        rateLimiter.delete(entry[0])
      }
    }
  }

  lastCleanup = now
}

export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const user = useSupabaseUser()

  // If no user, redirect to login
  if (!user.value) {
    return navigateTo("/auth/login")
  }

  // Create secure cache key to prevent collision attacks
  const cacheKey = createSecureCacheKey(user.value)

  // Perform periodic cache cleanup to prevent memory leaks
  const now = Date.now()
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupCaches()
  }

  // Check rate limit
  const rateLimit = rateLimiter.get(cacheKey)

  if (rateLimit) {
    // Check if rate limit window has expired
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
 * @param user - Optional user object to clear specific user cache
 */
export const clearAuthCache = (user?: any) => {
  if (user) {
    const cacheKey = createSecureCacheKey(user)
    authCache.delete(cacheKey)
    rateLimiter.delete(cacheKey)
  } else {
    authCache.clear()
    rateLimiter.clear()
  }
}

/**
 * Forces immediate cache cleanup - useful for testing or manual cleanup
 */
export const forceCleanupCaches = () => {
  cleanupCaches()
}

/**
 * Gets cache statistics for monitoring
 */
export const getCacheStats = () => {
  return {
    authCacheSize: authCache.size,
    rateLimiterSize: rateLimiter.size,
    lastCleanup,
    nextCleanup: lastCleanup + CLEANUP_INTERVAL
  }
}
