import { checkDomain } from "~~/server/utils/ctrld"

export default defineEventHandler(async (event) => {
  const { auth, domain } = await readBody<{ auth: string; domain: string }>(event)
  if (auth !== useRuntimeConfig(event).ctrldAuthKey) {
    return error(event, {}, "Invalid auth", 401)
  }
  return checkDomain(event, domain)
})
