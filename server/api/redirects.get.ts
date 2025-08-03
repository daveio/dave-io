import { z } from "zod"
import { getCloudflareEnv, getKVNamespace, getCachedRedirectList } from "../utils/cloudflare"
import { createApiError, isApiError } from "../utils/response"
import { createTypedApiResponse } from "../utils/response-types"

/// <reference types="../../worker-configuration" />

const RedirectsResultSchema = z.object({
  redirects: z
    .array(z.string())
    .min(0)
    .max(100)
    .describe("Array of available redirect slugs (truncated to 100 if more exist)")
})

export default defineEventHandler(async (event) => {
  try {
    const env = getCloudflareEnv(event)
    const kv = getKVNamespace(env)

    // Fetch available redirect slugs from cached KV
    let redirectSlugs: string[] = []
    try {
      const allRedirects = await getCachedRedirectList(kv)

      // Handle case where more than 100 redirects exist
      if (allRedirects.length > 100) {
        console.error(`Warning: ${allRedirects.length} redirects found, truncating to 100 for API response`)
        redirectSlugs = allRedirects.slice(0, 100)
      } else {
        redirectSlugs = allRedirects
      }
    } catch (error) {
      console.error("Failed to fetch cached redirect slugs:", error)
      // Continue with empty array if KV lookup fails
    }

    const redirectsData = RedirectsResultSchema.parse({
      redirects: redirectSlugs
    })

    return createTypedApiResponse({
      result: redirectsData,
      message: "Redirects retrieved successfully",
      error: null,
      resultSchema: RedirectsResultSchema
    })
  } catch (error) {
    console.error("Error in redirects endpoint:", error)

    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Failed to retrieve redirects")
  }
})
