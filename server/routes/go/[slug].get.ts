import { getHeader, sendRedirect } from "h3"
import { getCloudflareEnv, getKVNamespace } from "~/server/utils/cloudflare"
import { updateRedirectMetricsAsync } from "~/server/utils/kv-metrics"
import { createApiError, isApiError, logRequest } from "~/server/utils/response"
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
    const env = getCloudflareEnv(event)
    const kv = getKVNamespace(env)

    const slug = getRouterParam(event, "slug")

    if (!slug) {
      throw createApiError(400, "Slug parameter is required")
    }

    // Get redirect URL and click count from simple KV keys
    let redirectData: RedirectData | undefined

    try {
      // Get redirect URL and metrics using simple KV keys
      const [redirectUrl, clickCountStr] = await Promise.all([
        kv.get(`redirect:${slug}`),
        kv.get(`metrics:redirect:${slug}:ok`)
      ])

      if (redirectUrl) {
        const clickCount = clickCountStr ? Number.parseInt(clickCountStr) : 0
        redirectData = {
          slug: slug,
          url: redirectUrl,
          clicks: clickCount,
          created_at: Date.now().toString(),
          updated_at: Date.now().toString()
        }
      }
    } catch (error) {
      console.error("KV redirect lookup failed:", error)
      throw createApiError(500, "Failed to lookup redirect")
    }

    if (!redirectData) {
      throw createApiError(404, `Redirect not found for slug: ${slug}`)
    }

    // Validate redirect data
    const redirect = UrlRedirectSchema.parse(redirectData)

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

    // Perform redirect using H3 utility
    await sendRedirect(event, redirect.url, 302)
    return
  } catch (error: unknown) {
    // biome-ignore lint/suspicious/noExplicitAny: isApiError type guard ensures statusCode property exists
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    const slug = getRouterParam(event, "slug")

    // Log failed redirect request
    logRequest(event, `go/${slug || "unknown"}`, "GET", statusCode, {
      // biome-ignore lint/suspicious/noExplicitAny: isApiError type guard ensures statusMessage property exists
      error: isApiError(error) ? (error as any).statusMessage || "Unknown error" : "Internal error"
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Redirect failed")
  }
})
