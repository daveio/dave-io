import { eq } from "drizzle-orm"
import { defineEventHandler, getRouterParam, sendRedirect } from "h3"
import { redirects } from "~~/server/db/schema"
import { getDB } from "~~/server/utils/cloudflare"
import { error } from "~~/server/utils/response"

/**
 * Handles HTTP GET requests for redirecting based on a slug parameter.
 * Looks up the destination URL for the given slug and issues a 302 redirect, or returns an error if not found.
 *
 * Args:
 *   event: The incoming HTTP event containing the request and context.
 *
 * Returns:
 *   A redirect response to the destination URL if the slug is found, or an error response otherwise.
 */
export default defineEventHandler(async (event) => {
  // Get database connection from the event context
  const db = getDB(event)

  // Extract the slug parameter from the route (e.g., /redirect/:slug)
  const slug = getRouterParam(event, "slug")

  // Validate that slug exists and is not empty
  if (!slug || slug.length === 0) {
    return error(event, {}, "Slug is required", 400)
  }

  // Query the redirects table for a matching slug
  const redirect = await db.select().from(redirects).where(eq(redirects.slug, slug)).limit(1)

  // Check if redirect was found in the database
  if (!redirect || redirect.length === 0) {
    return error(event, {}, "Redirect not found", 404)
  }

  // Perform the redirect to the stored destination URL with 302 (temporary) status
  await sendRedirect(event, redirect[0].destination, 302)
})
