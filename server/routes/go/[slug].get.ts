import { getHeader, sendRedirect, setResponseStatus, setResponseHeader } from "h3"
import { getCloudflareEnv, getCloudflareRequestInfo, getKVNamespace } from "~/server/utils/cloudflare"
import { updateRedirectMetrics, updateRedirectMetricsAsync } from "~/server/utils/kv-metrics"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { UrlRedirectSchema } from "~/server/utils/schemas"

interface RedirectData {
  slug: string
  url: string
  title?: string
  description?: string
  clicks: number
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  try {
    console.log("[DEBUG] Starting redirect handler for:", event.node.req.url)
    
    const env = getCloudflareEnv(event)
    const kv = getKVNamespace(env)

    const slug = getRouterParam(event, "slug")
    console.log("[DEBUG] Extracted slug:", slug)

    if (!slug) {
      console.log("[DEBUG] No slug provided, throwing 400 error")
      throw createApiError(400, "Slug parameter is required")
    }

    // Get redirect URL and click count from simple KV keys
    let redirectData: RedirectData | undefined

    try {
      console.log("[DEBUG] Looking up redirect for slug:", slug)
      // Get redirect URL and metrics using simple KV keys
      const [redirectUrl, clickCountStr] = await Promise.all([
        kv.get(`redirect:${slug}`),
        kv.get(`metrics:redirect:${slug}:ok`)
      ])
      
      console.log("[DEBUG] KV lookup results - redirectUrl:", redirectUrl, "clickCountStr:", clickCountStr)

      if (redirectUrl) {
        const clickCount = clickCountStr ? Number.parseInt(clickCountStr) : 0
        redirectData = {
          slug: slug,
          url: redirectUrl,
          clicks: clickCount,
          created_at: Date.now().toString(),
          updated_at: Date.now().toString()
        }
        console.log("[DEBUG] Created redirectData:", redirectData)
      }
    } catch (error) {
      console.error("[DEBUG] KV redirect lookup failed:", error)
      throw createApiError(500, "Failed to lookup redirect")
    }

    if (!redirectData) {
      console.log("[DEBUG] No redirect data found, throwing 404 error")
      throw createApiError(404, `Redirect not found for slug: ${slug}`)
    }

    // Validate redirect data
    console.log("[DEBUG] Validating redirect data with schema")
    const redirect = UrlRedirectSchema.parse(redirectData)
    console.log("[DEBUG] Schema validation passed, redirect:", redirect)

    // Update redirect metrics using new hierarchical schema asynchronously
    try {
      const userAgent = getHeader(event, "user-agent") || ""
      // Use updateRedirectMetricsAsync for non-blocking metrics update
      updateRedirectMetricsAsync(kv, slug, 302, userAgent)
    } catch (error) {
      console.error("Failed to update redirect metrics:", error)
      // Continue with redirect even if metrics fails
    }

    // Log redirect request
    logRequest(event, `go/${slug}`, "GET", 302, {
      target: redirect.url,
      clicks: redirect.clicks + 1,
      cached: "hit"
    })

    // Perform proper HTTP redirect - try multiple approaches
    console.log("[DEBUG] Attempting redirect to:", redirect.url)
    
    try {
      // Method 1: Try h3's sendRedirect
      console.log("[DEBUG] Using sendRedirect method")
      await sendRedirect(event, redirect.url, 302)
      console.log("[DEBUG] sendRedirect completed successfully")
    } catch (redirectError) {
      console.error("[DEBUG] sendRedirect failed:", redirectError)
      
      // Method 2: Manual redirect response
      console.log("[DEBUG] Falling back to manual redirect")
      setResponseStatus(event, 302)
      setResponseHeader(event, "Location", redirect.url)
      setResponseHeader(event, "Cache-Control", "no-cache")
      return ""
    }
  } catch (error: unknown) {
    console.error("[DEBUG] Error in redirect handler:", error)
    
    // biome-ignore lint/suspicious/noExplicitAny: isApiError type guard ensures statusCode property exists
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    const slug = getRouterParam(event, "slug")

    console.log("[DEBUG] Error statusCode:", statusCode, "slug:", slug)

    // Log failed redirect request
    logRequest(event, `go/${slug || "unknown"}`, "GET", statusCode, {
      // biome-ignore lint/suspicious/noExplicitAny: isApiError type guard ensures statusMessage property exists
      error: isApiError(error) ? (error as any).statusMessage || "Unknown error" : "Internal error"
    })

    // Re-throw API errors
    if (isApiError(error)) {
      console.log("[DEBUG] Re-throwing API error")
      throw error
    }

    console.log("[DEBUG] Throwing generic redirect failed error")
    throw createApiError(500, "Redirect failed")
  }
})
