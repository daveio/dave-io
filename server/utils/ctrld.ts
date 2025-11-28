import { DateTime } from "luxon"
import { parse } from "tldts"
import type { H3Event } from "h3"
import { logger } from "./logging"

export interface UnblockRequest {
  domain: string
  profileId: string
  permanent: boolean
}

export interface DeleteCustomRuleResponse {
  body: [] // always an empty array it seems
  success: boolean
  message: string
}

function normaliseDomain(input: string): string {
  // Defensive normalization: trim, lower-case, unify dot variants, drop trailing noise
  let host = (input ?? "").trim().toLowerCase()
  host = host.replace(/[。．｡]/g, ".") // normalize unicode dots to ASCII dot
  host = host.replace(/[\s/]+$/g, "") // strip trailing slashes/whitespace

  logger.info("Normalising input domain", { input, normalised: host })

  const { domain } = parse(host, {
    allowIcannDomains: true,
    allowPrivateDomains: true,
    detectIp: false, // we never want IPs because we're dealing with DNS
    extractHostname: true,
    validateHostname: true,
    mixedInputs: true,
  })

  if (domain) {
    logger.info("Parsed domain from input", { input, normalised: domain })
  } else {
    logger.warn("Falling back to best-effort host", { input, normalised: host })
  }

  return domain ?? host // fallback to best-effort host if parsing fails
}

export async function unblockDomain(request: UnblockRequest, apiKey: string) {
  let expiry: number = 0

  if (!request.permanent) {
    expiry = DateTime.now().plus({ minutes: 15 }).toUnixInteger()
  }

  const body: { do: 1; status: 1; hostnames: string[]; ttl?: number } = {
    do: 1,
    status: 1,
    hostnames: [normaliseDomain(request.domain)],
  }

  if (!request.permanent) {
    body.ttl = expiry
  }

  const previousDeleted = await ensureRuleDeleted(request, apiKey)

  if (!previousDeleted) {
    logger.error("Failed to ensure deletion of existing override", {
      domain: request.domain,
      profileId: request.profileId,
      proceeding: true,
    })
  }

  const requestUrl = `https://api.controld.com/profiles/${request.profileId}/rules`

  logger.info("Calling ControlD API", {
    apiKeyLength: apiKey.length,
    apiKeyLast4: apiKey.slice(-4),
    previousDeleted,
    apiRequest: { requestUrl, body },
  })

  return await $fetch(requestUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
}

async function ensureRuleDeleted(request: UnblockRequest, apiKey: string) {
  const deletionResponse = (await $fetch(
    `https://api.controld.com/profiles/${request.profileId}/rules/${normaliseDomain(request.domain)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  )) as DeleteCustomRuleResponse // idempotent; succeeds anyway if no deletion

  logger.info("Attempted deletion", { deletionResponse })

  return deletionResponse.success
}

export async function checkDomain(event: H3Event, domain: string) {
  logger.info("checkDomain invoked", { domain }, event)
  return { safe: true, reasoning: `${domain}: AI checks not yet implemented` }
}
