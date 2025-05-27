/**
 * KV operations for JWT authentication, usage tracking, and revocation
 */

interface Env {
  DATA: KVNamespace
}

export interface TokenUsageData {
  requestCount: number
  lastUsed: string
}

/**
 * Get current usage count for a token UUID
 */
export async function getTokenUsageCount(env: Env, uuid: string): Promise<number> {
  try {
    const data = await env.DATA.get<TokenUsageData>(`auth:count:${uuid}`, { type: "json" })
    return data?.requestCount ?? 0
  } catch (error) {
    console.error("Error getting token usage count:", { uuid, error })
    return 0
  }
}

/**
 * Increment usage count for a token UUID
 */
export async function incrementTokenUsage(env: Env, uuid: string): Promise<number> {
  try {
    const current = await getTokenUsageCount(env, uuid)
    const newCount = current + 1
    const usageData: TokenUsageData = {
      requestCount: newCount,
      lastUsed: new Date().toISOString()
    }

    await env.DATA.put(`auth:count:${uuid}`, JSON.stringify(usageData))
    return newCount
  } catch (error) {
    console.error("Error incrementing token usage:", { uuid, error })
    // Return the current count as a fallback
    return await getTokenUsageCount(env, uuid)
  }
}

/**
 * Check if a token is revoked
 */
export async function isTokenRevoked(env: Env, uuid: string): Promise<boolean> {
  try {
    const revoked = await env.DATA.get(`auth:revocation:${uuid}`)
    return revoked === "true"
  } catch (error) {
    console.error("Error checking token revocation:", { uuid, error })
    return true // Fail closed in case of error
  }
}

/**
 * Revoke a token
 */
export async function revokeToken(env: Env, uuid: string): Promise<void> {
  try {
    await env.DATA.put(`auth:revocation:${uuid}`, "true")
    console.log("Token revoked:", { uuid })
  } catch (error) {
    console.error("Error revoking token:", { uuid, error })
    throw error
  }
}

/**
 * Un-revoke a token (restore access)
 */
export async function unrevokeToken(env: Env, uuid: string): Promise<void> {
  try {
    await env.DATA.put(`auth:revocation:${uuid}`, "false")
    console.log("Token un-revoked:", { uuid })
  } catch (error) {
    console.error("Error un-revoking token:", { uuid, error })
    throw error
  }
}

/**
 * Get complete token usage information
 */
export async function getTokenUsage(
  env: Env,
  uuid: string
): Promise<{
  requestCount: number
  lastUsed: string | null
  isRevoked: boolean
}> {
  try {
    const [usageData, revoked] = await Promise.all([
      env.DATA.get<TokenUsageData>(`auth:count:${uuid}`, { type: "json" }),
      isTokenRevoked(env, uuid)
    ])

    return {
      requestCount: usageData?.requestCount ?? 0,
      lastUsed: usageData?.lastUsed ?? null,
      isRevoked: revoked
    }
  } catch (error) {
    console.error("Error getting token usage:", { uuid, error })
    return {
      requestCount: 0,
      lastUsed: null,
      isRevoked: false
    }
  }
}

/**
 * Track token metrics for monitoring
 */
export async function trackTokenMetrics(env: Env, uuid: string, event: string): Promise<void> {
  try {
    const key = `metrics:auth:${uuid}:${event}`
    const current = (await env.DATA.get(key)) ?? "0"
    const count = Number.parseInt(current) + 1
    await env.DATA.put(key, count.toString())
  } catch (error) {
    console.error("Error tracking token metrics:", { uuid, event, error })
    // Don't throw, metrics tracking is not critical
  }
}
