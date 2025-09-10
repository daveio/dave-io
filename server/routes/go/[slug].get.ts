import { eq } from "drizzle-orm"
import { defineEventHandler, getRouterParam, sendRedirect } from "h3"
import { redirects } from "~~/server/db/schema"
import { getDB } from "~~/server/utils/cloudflare"
import { error } from "~~/server/utils/response"

export default defineEventHandler(async (event) => {
  // Get database connection from the event context
  const db = getDB(event)

  // Extract the slug parameter from the route (e.g., /redirect/:slug)
  const slug = getRouterParam(event, "slug") as string

  // Validate that slug exists and is not empty
  if (!slug || slug.length === 0) {
    return error(event, {}, "Slug is required", 400)
  }

  // Query the redirects table for a matching slug
  const redirect = await db.select().from(redirects).where(eq(redirects.slug, slug)).limit(1)

  // Check if redirect was found in the database
  if (!redirect || redirect.length === 0 || !redirect[0]) {
    return error(event, {}, "Redirect not found", 404)
  }

  // Perform the redirect to the stored destination URL with 302 (temporary) status
  await sendRedirect(event, redirect[0].destination, 302)
})
