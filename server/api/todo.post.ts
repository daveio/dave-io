import { ok, error } from "~~/server/utils/response"
import { logger } from "~~/server/utils/logging"

// trunk-ignore-all(trunk-toolbox/todo)

/**
 * Stub route for TODO submissions.
 * Accepts POSTed data and returns a placeholder response. This is intentionally not
 * wired to Linear yet — backend integration will be implemented separately.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    title?: string
    description?: string
    type?: string
    priority?: string
    name?: string
    email?: string
  }>(event)

  if (!body?.title || !body?.description) {
    return error(event, {}, "Missing required fields: title and description", 422)
  }

  // Structured log for visibility during local/dev testing
  logger.info(
    "/api/todo (stub) received",
    {
      title: body.title,
      type: body.type,
      priority: body.priority,
      name: body.name,
      email: body.email,
      descriptionLength: body.description?.length || 0,
    },
    event,
  )

  // Reply with a stub response
  return ok(
    event,
    {
      received: true,
      message: "TODO API stub: request accepted. Backend Linear integration not implemented yet.",
    },
    202,
  )
})
