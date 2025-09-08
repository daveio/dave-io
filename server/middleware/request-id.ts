import { defineEventHandler, setResponseHeader } from "h3"
import { getRequestId } from "~~/server/utils/logging"

export default defineEventHandler((event) => {
  // Prefer Cloudflare's CF-Ray, fallback to x-request-id, else generate
  const requestId = getRequestId(event)

  // Expose on the event context for easy access anywhere
  event.context.requestId = requestId

  // Ensure the response always carries the ID for client-side correlation
  try {
    setResponseHeader(event, "x-request-id", requestId)
  } catch {
    // Ignore if headers are not settable in this context
  }
})
