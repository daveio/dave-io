import { logger } from "@sentry/nuxt"
import { error, ok } from "~~/server/utils/response"

/**
 * Handles HTTP POST requests for email verification.
 * This endpoint verifies a Turnstile token and returns my email address.
 *
 * Args:
 *   event: The incoming HTTP event containing the request and context.
 *
 * Returns:
 *   A response object containing the email address and success status.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    return error(event, {}, "Token not provided.", 422)
  }

  logger.info(body, { log_source: "/api/util/email" })

  // Use the built-in Turnstile verification from @nuxtjs/turnstile
  const validationResult = await verifyTurnstileToken(token)

  // Logic was inverted - should fail if NOT successful
  if (!validationResult.success) {
    return error(event, {}, "Token validation failed.", 403)
  }

  // Return the email after successful verification
  return ok(event, {
    email: "dave@dave.io",
  })
})
