// trunk-ignore-all(trunk-toolbox/todo)
import { ok } from "~~/server/utils/response"

export default defineEventHandler(async (event) => {
  // TODO: Implement Linear TODO creation logic
  return ok(event, {
    message: "Linear TODO endpoint - not implemented yet",
    received: true,
  })
})
