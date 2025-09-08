/**
 * Handles HTTP GET requests for the ping endpoint.
 * This endpoint returns a simple "pong!" message and the current redirects from the database.
 *
 * Args:
 *   event: The incoming HTTP event containing the request and context.
 *
 * Returns:
 *   A response object containing the message and redirects from the database.
 */
export default defineEventHandler(async (event) => {
  throw new Error(`Sentry test error inside /api/sentry: ${event}`)
})
