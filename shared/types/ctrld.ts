export type unblockDuration = "temporary" | "permanent"

export type ctrldProfile = "main" | "permissive" | "parents"

export type ctrldUnblockRequest = {
  domain: string
  auth: string
  profile: string
  permanent: boolean
}
