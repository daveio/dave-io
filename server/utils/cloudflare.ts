/// <reference types="../../worker-configuration" />
import type { H3Event } from "h3"
import { getHeader } from "h3"
import { createApiError } from "./response"

/**
 * Cloudflare request metadata extracted from headers
 */
export interface CloudflareRequestInfo {
  /** Cloudflare Ray ID for request tracing */
  ray: string
  /** Visitor's country code */
  country: string
  /** Visitor's IP address */
  ip: string
  /** Cloudflare datacenter code (first 3 chars of Ray ID) */
  datacenter: string
  /** User agent string */
  userAgent: string
  /** Full request URL */
  requestUrl: string
}

/**
 * Extract Cloudflare metadata from request headers
 * Centralizes the repeated pattern of extracting CF headers
 */
export function getCloudflareRequestInfo(event: H3Event): CloudflareRequestInfo {
  const ray = getHeader(event, "cf-ray") || "unknown"
  const country = getHeader(event, "cf-ipcountry") || "unknown"
  const ip = getHeader(event, "cf-connecting-ip") || getHeader(event, "x-forwarded-for") || "unknown"
  const datacenter = ray.substring(0, 3) || "unknown"
  const userAgent = getHeader(event, "user-agent") || "unknown"
  const requestUrl = event.node.req.url || "/"

  return {
    ray,
    country,
    ip,
    datacenter,
    userAgent,
    requestUrl
  }
}

/**
 * Standard Cloudflare environment bindings interface
 */
export interface CloudflareEnv {
  /** KV Namespace for general data storage */
  KV?: KVNamespace
  /** Cloudflare AI for machine learning tasks */
  AI?: Ai
  /** D1 Database for relational data */
  D1?: D1Database
  /** Cloudflare Images binding for image processing */
  IMAGES?: ImagesBinding
  /** Browser binding for headless browsing */
  BROWSER?: Fetcher
  /** Cloudflare API token for Images API */
  CLOUDFLARE_API_TOKEN?: string
  /** Cloudflare account ID */
  CLOUDFLARE_ACCOUNT_ID?: string
}

/**
 * Get and validate Cloudflare environment bindings from an H3Event
 */
export function getCloudflareEnv(event: H3Event): CloudflareEnv {
  return (event.context.cloudflare?.env as CloudflareEnv) || {}
}

/**
 * Validate that required Cloudflare bindings are available
 * Throws a standardized API error if any are missing
 */
export function validateCloudflareBindings(env: CloudflareEnv, required: (keyof CloudflareEnv)[]): void {
  const missing: string[] = []

  for (const binding of required) {
    if (!env[binding]) {
      missing.push(binding)
    }
  }

  if (missing.length > 0) {
    const bindingsList = missing.join(", ")
    throw createApiError(503, `Required services not available: ${bindingsList}`)
  }
}

/**
 * Safe getter for KV namespace with proper error handling
 */
export function getKVNamespace(env: CloudflareEnv): KVNamespace {
  if (!env.KV) {
    throw createApiError(503, "Storage service not available")
  }
  return env.KV
}

/**
 * Safe getter for AI binding with proper error handling
 */
export function getAIBinding(env: CloudflareEnv): Ai {
  if (!env.AI) {
    throw createApiError(503, "AI service not available")
  }
  return env.AI
}

/**
 * Safe getter for D1 database with proper error handling
 */
export function getD1Database(env: CloudflareEnv): D1Database {
  if (!env.D1) {
    throw createApiError(503, "Database service not available")
  }
  return env.D1
}

export async function batchKVGet(kv: KVNamespace, keys: string[], defaultValue = "0"): Promise<number[]> {
  return await Promise.all(
    keys.map(async (key) => {
      const value = await kv.get(key)
      const parsed = Number.parseInt(value || defaultValue, 10)
      return Number.isNaN(parsed) ? 0 : parsed
    })
  )
}

/**
 * Get multiple KV values as strings
 */
export async function batchKVGetStrings(kv: KVNamespace, keys: string[], defaultValue = ""): Promise<string[]> {
  return await Promise.all(keys.map((key) => kv.get(key).then((v) => v || defaultValue)))
}

/**
 * Cached redirect data structure
 */
interface CachedRedirectData {
  redirects: string[]
  timestamp: number
}

/**
 * Get cached redirect list with automatic refresh
 * Returns cached data if fresh, otherwise fetches new data and updates cache
 * @param kv KV namespace instance
 * @returns Array of redirect slugs
 */
export async function getCachedRedirectList(kv: KVNamespace): Promise<string[]> {
  const cacheDataKey = "cache:redirects:data"
  const cacheExpiryKey = "cache:redirects:expiry"
  const currentTime = Math.floor(Date.now() / 1000) // Unix timestamp in seconds

  try {
    // Get cache expiry setting (default to 3600 seconds = 1 hour)
    const expirySeconds = Number.parseInt((await kv.get(cacheExpiryKey)) || "3600", 10)

    // Try to get cached data
    const cachedDataString = await kv.get(cacheDataKey)

    if (cachedDataString) {
      try {
        const cachedData: CachedRedirectData = JSON.parse(cachedDataString)

        // Check if cache is still fresh
        if (currentTime - cachedData.timestamp < expirySeconds) {
          // Cache is fresh, schedule async refresh for next request
          // Don't await this to avoid blocking the response
          refreshRedirectCache(kv, cacheDataKey, currentTime).catch((error) => {
            console.error("Failed to async refresh redirect cache:", error)
          })

          return cachedData.redirects
        }
      } catch (parseError) {
        console.error("Failed to parse cached redirect data:", parseError)
        // Fall through to fetch fresh data
      }
    }

    // Cache is stale or missing, fetch fresh data synchronously
    return await refreshRedirectCache(kv, cacheDataKey, currentTime)
  } catch (error) {
    console.error("Failed to get cached redirect list:", error)
    // Fallback to direct KV fetch if caching fails
    return await fetchRedirectListDirect(kv)
  }
}

/**
 * Refresh the redirect cache with fresh data
 * @param kv KV namespace instance
 * @param cacheDataKey Cache data key
 * @param currentTime Current timestamp
 * @returns Fresh redirect list
 */
async function refreshRedirectCache(kv: KVNamespace, cacheDataKey: string, currentTime: number): Promise<string[]> {
  const redirectSlugs = await fetchRedirectListDirect(kv)

  const cacheData: CachedRedirectData = {
    redirects: redirectSlugs,
    timestamp: currentTime
  }

  // Update cache asynchronously (don't block on this)
  kv.put(cacheDataKey, JSON.stringify(cacheData)).catch((error) => {
    console.error("Failed to update redirect cache:", error)
  })

  return redirectSlugs
}

/**
 * Fetch redirect list directly from KV
 * @param kv KV namespace instance
 * @returns Array of redirect slugs
 */
async function fetchRedirectListDirect(kv: KVNamespace): Promise<string[]> {
  const redirectKeys = await kv.list({ prefix: "redirect:" })
  return redirectKeys.keys.map((key) => key.name.replace("redirect:", "")).sort()
}
