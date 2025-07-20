/**
 * Shared Cloudflare configuration and client management for CLI tools
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import Cloudflare from "cloudflare"
import { parse as parseJSONC } from "jsonc-parser"

export interface CloudflareConfig {
  apiToken: string
  accountId: string
  databaseId?: string
  kvNamespaceId?: string
}

interface D1Database {
  binding: string
  database_id: string
}

interface KVNamespace {
  binding: string
  id: string
}

export interface CloudflareClientResult {
  client: Cloudflare
  config: CloudflareConfig
}

export interface WranglerConfig {
  databaseId?: string
  kvNamespaceId?: string
}

/**
 * Parse wrangler.jsonc configuration file to extract binding IDs
 */
export function getWranglerConfig(): WranglerConfig {
  try {
    const wranglerPath = join(process.cwd(), "wrangler.jsonc")
    const wranglerContent = readFileSync(wranglerPath, "utf-8")
    const wranglerConfig = parseJSONC(wranglerContent)

    // Extract D1 database ID
    let databaseId: string | undefined
    if (wranglerConfig.d1_databases && Array.isArray(wranglerConfig.d1_databases)) {
      const dbBinding = (wranglerConfig.d1_databases as D1Database[]).find((db) => db.binding === "DB")
      if (dbBinding?.database_id) {
        databaseId = dbBinding.database_id
      }
    }

    // Extract KV namespace ID
    let kvNamespaceId: string | undefined
    if (wranglerConfig.kv_namespaces && Array.isArray(wranglerConfig.kv_namespaces)) {
      const kvBinding = (wranglerConfig.kv_namespaces as KVNamespace[]).find((kv) => kv.binding === "KV")
      if (kvBinding?.id) {
        kvNamespaceId = kvBinding.id
      }
    }

    return { databaseId, kvNamespaceId }
  } catch (error) {
    console.warn(
      "⚠️  Could not read wrangler.jsonc, using fallback IDs:",
      error instanceof Error ? error.message : String(error)
    )
    return {
      databaseId: "106894e2-1f5c-4979-a777-0b45febbb993",
      kvNamespaceId: "184eca13ac05485d96de48c436a6f5e6"
    }
  }
}

/**
 * Get Cloudflare configuration from environment variables and wrangler.jsonc
 */
export function getCloudflareConfig(includeDatabase = false, includeKV = false): CloudflareConfig {
  // CLI tools run outside the Worker context, so they must use environment variables
  // For production use, set these via Wrangler secrets commands:
  // wrangler secrets-store secret create <STORE_ID> --name CLOUDFLARE_API_TOKEN --remote
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const wranglerConfig = getWranglerConfig()
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || wranglerConfig.databaseId
  const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || wranglerConfig.kvNamespaceId

  const missingVars: string[] = []

  if (!apiToken) {
    missingVars.push("CLOUDFLARE_API_TOKEN")
  }
  if (!accountId) {
    missingVars.push("CLOUDFLARE_ACCOUNT_ID")
  }
  if (includeDatabase && !databaseId) {
    missingVars.push("CLOUDFLARE_D1_DATABASE_ID")
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join("\n")}`)
  }

  const config: CloudflareConfig = {
    apiToken: apiToken as string,
    accountId: accountId as string
  }

  if (includeDatabase && databaseId) {
    config.databaseId = databaseId
  }

  if (includeKV && kvNamespaceId) {
    config.kvNamespaceId = kvNamespaceId
  }

  return config
}

/**
 * Create a Cloudflare client with configuration
 */
export function createCloudflareClient(includeDatabase = false, includeKV = false): CloudflareClientResult {
  const config = getCloudflareConfig(includeDatabase, includeKV)
  const client = new Cloudflare({ apiToken: config.apiToken })
  return { client, config }
}

/**
 * Create a Cloudflare client with optional configuration (returns null if credentials missing)
 */
export function createOptionalCloudflareClient(
  includeDatabase = false,
  includeKV = false
): CloudflareClientResult | null {
  try {
    return createCloudflareClient(includeDatabase, includeKV)
  } catch {
    return null
  }
}

/**
 * Validate that Cloudflare credentials are configured and return client
 */
export function validateCloudflareConfig(includeDatabase = false, includeKV = false): CloudflareClientResult {
  const result = createOptionalCloudflareClient(includeDatabase, includeKV)

  if (!result) {
    console.error("❌ Cloudflare credentials not configured")
    console.error("   Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables")
    process.exit(1)
  }

  return result
}

/**
 * Execute D1 database query
 */
export async function executeD1Query(
  client: Cloudflare,
  accountId: string,
  databaseId: string,
  sql: string,
  params: unknown[] = []
): Promise<unknown> {
  try {
    return await client.d1.database.query(databaseId, {
      account_id: accountId,
      sql,
      params: params as string[]
    })
  } catch (error) {
    console.error("D1 query failed:", { sql, params, error })
    throw error
  }
}

/**
 * Get KV binding name from wrangler.jsonc
 */
export function getKVBindingName(): string {
  try {
    // Check the raw JSONC for kv_namespaces array
    const wranglerPath = join(process.cwd(), "wrangler.jsonc")
    const wranglerContent = readFileSync(wranglerPath, "utf-8")
    const rawConfig = parseJSONC(wranglerContent)

    if (rawConfig.kv_namespaces && Array.isArray(rawConfig.kv_namespaces)) {
      const kvBinding = rawConfig.kv_namespaces[0]
      if (kvBinding?.binding) {
        return kvBinding.binding
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    console.warn("⚠️  Could not read KV binding from wrangler.jsonc, using default 'KV'")
  }
  return "KV"
}

/**
 * Execute wrangler command and return parsed output
 */
export async function execWrangler(args: string[]): Promise<string> {
  try {
    const proc = Bun.spawn(["bun", "run", "wrangler", ...args], {
      stdout: "pipe",
      stderr: "pipe"
    })

    const output = await new Response(proc.stdout).text()
    const error = await new Response(proc.stderr).text()

    const exitCode = await proc.exited
    if (exitCode !== 0) {
      throw new Error(`Wrangler command failed (exit ${exitCode}): ${error || "Unknown error"}`)
    }

    return output.trim()
  } catch (error) {
    throw new Error(`Failed to execute wrangler: ${error}`)
  }
}

/**
 * Fetch all keys from KV namespace using wrangler CLI
 */
export async function fetchAllKeysKV(useLocal = false): Promise<string[]> {
  try {
    const bindingName = getKVBindingName()
    const mode = useLocal ? "--local" : "--remote"
    const output = await execWrangler(["kv", "key", "list", `--binding=${bindingName}`, mode])

    // Parse wrangler output - it returns JSON array of key objects
    const keyObjects = JSON.parse(output) as Array<{ name: string }>
    return keyObjects.map((obj) => obj.name)
  } catch (error) {
    // trunk-ignore(semgrep/javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring): Safe format string
    console.error(`❌ Failed to fetch keys from ${useLocal ? "local" : "remote"} wrangler KV:`, error)
    throw error
  }
}

/**
 * Put key-value pair using wrangler CLI (avoids SDK JSON wrapper issue)
 */
export async function putKeyValueKV(key: string, value: string, useLocal = false): Promise<void> {
  // Check for JSON data and warn user
  if (value.includes("{") || value.includes("}")) {
    console.warn("⚠️  JSON data detected in value - this may cause issues with KV storage")
    console.warn("   Consider storing as plain text or using a different approach for structured data")
  }

  const bindingName = getKVBindingName()
  const mode = useLocal ? "--local" : "--remote"
  await execWrangler(["kv", "key", "put", key, value, `--binding=${bindingName}`, mode])
}

/**
 * Get key value using wrangler CLI
 */
export async function getKeyValueKV(key: string, useLocal = false): Promise<string> {
  const bindingName = getKVBindingName()
  const mode = useLocal ? "--local" : "--remote"
  return await execWrangler(["kv", "key", "get", key, `--binding=${bindingName}`, mode])
}

/**
 * Delete key using wrangler CLI
 */
export async function deleteKeyKV(key: string, useLocal = false): Promise<void> {
  const bindingName = getKVBindingName()
  const mode = useLocal ? "--local" : "--remote"
  await execWrangler(["kv", "key", "delete", key, `--binding=${bindingName}`, mode])
}
