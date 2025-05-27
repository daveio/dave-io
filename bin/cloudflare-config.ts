import Cloudflare from "cloudflare"

export interface CloudflareConfig {
  apiToken: string
  accountId: string
  databaseId?: string
  kvNamespaceId?: string
}

export interface CloudflareClients {
  client: Cloudflare
  config: CloudflareConfig
}

/**
 * Get Cloudflare configuration from environment variables
 */
export function getCloudflareConfig(includeDatabase = false, includeKV = false): CloudflareConfig {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID
  const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || "fa48b0bd010a43289d5e111af42b8b50"

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

  if (includeKV) {
    config.kvNamespaceId = kvNamespaceId
  }

  return config
}

/**
 * Create Cloudflare client with configuration
 */
export function createCloudflareClient(includeDatabase = false, includeKV = false): CloudflareClients {
  const config = getCloudflareConfig(includeDatabase, includeKV)
  const client = new Cloudflare({ apiToken: config.apiToken })

  return { client, config }
}

/**
 * Execute D1 SQL command via Cloudflare SDK
 */
export async function executeD1Query(
  client: Cloudflare,
  accountId: string,
  databaseId: string,
  sql: string,
  params: unknown[] = []
): Promise<unknown> {
  try {
    const response = await client.d1.database.query(databaseId, {
      account_id: accountId,
      sql,
      params: params as string[]
    })
    return response
  } catch (error) {
    console.error("D1 query failed:", { sql, params, error })
    throw error
  }
}

/**
 * Initialize D1 database schema for JWT tokens
 */
export async function initializeD1Schema(client: Cloudflare, accountId: string, databaseId: string): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS jwt_tokens (
      uuid TEXT PRIMARY KEY,
      sub TEXT NOT NULL,
      description TEXT,
      max_requests INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT
    )
  `

  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_jwt_tokens_sub ON jwt_tokens(sub)
  `

  await executeD1Query(client, accountId, databaseId, createTableSQL)
  await executeD1Query(client, accountId, databaseId, createIndexSQL)
}
