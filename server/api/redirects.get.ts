import { asc } from "drizzle-orm"
import { redirects } from "~~/server/db/schema"
import { getDB } from "~~/server/utils/cloudflare"
import { ok } from "~~/server/utils/response"

/**
 * Retrieves a list of all redirect slugs from the database. Returns the slugs in an HTTP OK response.
 *
 * This handler is intended to provide a simple listing of redirect identifiers for use by clients.
 *
 * Args:
 *   event: The incoming request event containing context for database access and response handling.
 *
 * Returns:
 *   An HTTP OK response containing an array of redirect slugs.
 */
export default defineEventHandler(async (event) => {
  const db = getDB(event)
  const rows = await db.select({ slug: redirects.slug }).from(redirects).orderBy(asc(redirects.slug))
  const slugs = rows.map(({ slug }) => slug)

  return ok(event, slugs)
})
