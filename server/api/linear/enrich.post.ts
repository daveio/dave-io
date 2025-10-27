// trunk-ignore-all(trunk-toolbox/todo)
import { ok } from "~~/server/utils/response"

export default defineEventHandler(async (event) => {
  // TODO: Implement Linear enrichment logic
  return ok(event, {
    message: "Linear enrichment endpoint - not implemented yet",
    received: true,
  })
})
