import { sendRedirect } from "h3"
import { getCloudflareEnv, getKVNamespace } from "../../utils/cloudflare"
import { createApiError, isApiError } from "../../utils/response"
import { UrlRedirectSchema } from "../../utils/schemas"

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

    // Get redirect URL from simple KV keys
    let redirectData: RedirectData | undefined

    try {
      // Get redirect URL using simple KV keys
      const redirectUrl = await kv.get(`redirect:${slug}`)

      if (redirectUrl) {
        redirectData = {
          slug: slug,
          url: redirectUrl,
          clicks: 0, // No longer tracking clicks
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

    // Perform proper HTTP redirect
    await sendRedirect(event, redirect.url, 302)
  } catch (error: unknown) {
    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Redirect failed")
  }
})
