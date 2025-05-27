#!/usr/bin/env bun
import { Command } from "commander"
import jwt from "jsonwebtoken"
import ms from "ms"
import readlineSync from "readline-sync"
import { v4 as uuidv4 } from "uuid"
import { createCloudflareClient, executeD1Query, initializeD1Schema } from "./cloudflare-config"

interface JWTRequest {
  sub: string
  expiresIn?: string
  maxRequests?: number
  description?: string
  noExpiry?: boolean
}

interface TokenMetadata {
  uuid: string
  sub: string
  description?: string
  maxRequests?: number
  createdAt: string
  expiresAt?: string
}

const program = new Command()

program.name("jwt").description("JWT Token Management for dave.io").version("2.0.0")

// Environment variable helpers
function getJWTSecret(): string | null {
  return process.env.API_JWT_SECRET || null
}

// Map D1 result from snake_case to camelCase
function mapD1Token(dbToken: unknown): TokenMetadata {
  const token = dbToken as Record<string, unknown>
  return {
    uuid: token.uuid as string,
    sub: token.sub as string,
    description: token.description as string | undefined,
    maxRequests: token.max_requests as number | undefined,
    createdAt: token.created_at as string,
    expiresAt: token.expires_at as string | undefined
  }
}

// Execute D1 SQL command wrapper
async function executeD1Command(sql: string, params: unknown[] = []): Promise<unknown> {
  try {
    const { client, config } = createCloudflareClient(true)
    if (!config.databaseId) {
      throw new Error("Database ID not configured")
    }
    const response = await executeD1Query(client, config.accountId, config.databaseId, sql, params)
    return (response as { result: unknown }).result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStatus = (error as { status?: number }).status

    if (errorMessage?.includes("API_AUTH_METADATA") || errorStatus === 404) {
      console.error("❌ D1 database 'API_AUTH_METADATA' not found or not accessible")
      console.error("   Please ensure:")
      console.error("   1. You have a valid CLOUDFLARE_API_TOKEN with D1 permissions")
      console.error("   2. CLOUDFLARE_ACCOUNT_ID is correct")
      console.error("   3. CLOUDFLARE_D1_DATABASE_ID points to the API_AUTH_METADATA database")
      console.error("   4. The D1 database exists and is properly configured")
      throw new Error("D1 database not accessible")
    }
    console.error(`D1 command failed: ${errorMessage}`)
    throw error
  }
}

// Token creation
async function createToken(options: JWTRequest, secret: string): Promise<{ token: string; metadata: TokenMetadata }> {
  const uuid = uuidv4()
  const now = Math.floor(Date.now() / 1000)
  const createdAt = new Date().toISOString()

  let exp: number | undefined
  let expiresAt: string | undefined

  if (!options.noExpiry) {
    // Default to 30 days if no expiration specified and not explicitly set to no expiry
    const defaultExpiry = options.expiresIn || "30d"
    exp = now + parseExpiration(defaultExpiry)
    expiresAt = new Date(exp * 1000).toISOString()
  }

  const jwtPayload = {
    sub: options.sub,
    iat: now,
    jti: uuid,
    ...(exp && { exp }),
    ...(options.maxRequests && { maxRequests: options.maxRequests })
  }

  const token = jwt.sign(jwtPayload, secret, { algorithm: "HS256" })

  const metadata: TokenMetadata = {
    uuid,
    sub: options.sub,
    description: options.description,
    maxRequests: options.maxRequests,
    createdAt,
    expiresAt
  }

  return { token, metadata }
}

// Store token metadata in D1
async function storeTokenMetadata(metadata: TokenMetadata): Promise<void> {
  const sql =
    "INSERT INTO jwt_tokens (uuid, sub, description, max_requests, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"

  const params = [
    metadata.uuid,
    metadata.sub,
    metadata.description || null,
    metadata.maxRequests || null,
    metadata.createdAt,
    metadata.expiresAt || null
  ]

  await executeD1Command(sql, params)
}

// Parse expiration duration
function parseExpiration(expiresIn: string): number {
  let milliseconds: number | undefined
  try {
    const result = ms(expiresIn)
    if (typeof result === "string") {
      throw new Error(`Invalid duration format: ${expiresIn}`)
    }
    milliseconds = typeof result === "number" ? result : undefined
  } catch {
    milliseconds = undefined
  }

  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    milliseconds = parseCompoundDuration(expiresIn)
  }

  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    console.error(`❌ Invalid expiration format: ${expiresIn}`)
    process.exit(1)
  }
  return Math.floor(milliseconds / 1000)
}

function parseCompoundDuration(duration: string): number | undefined {
  const units: Record<string, number> = {
    w: 604800000, // week
    d: 86400000, // day
    h: 3600000, // hour
    m: 60000, // minute
    s: 1000 // second
  }

  let total = 0
  const remaining = duration.toLowerCase()
  const regex = /(\d+)([wdhms])/g
  let match: RegExpExecArray | null
  let hasMatches = false

  match = regex.exec(remaining)
  while (match !== null) {
    hasMatches = true
    const value = Number.parseInt(match[1])
    const unit = match[2]
    if (units[unit]) {
      total += value * units[unit]
    }
    match = regex.exec(remaining)
  }

  return hasMatches ? total : undefined
}

// Init command
program
  .command("init")
  .description("Initialize D1 database schema for JWT tokens")
  .action(async () => {
    try {
      console.log("🔧 Initializing D1 database schema...")
      const { client, config } = createCloudflareClient(true)
      if (!config.databaseId) {
        throw new Error("Database ID not configured")
      }
      await initializeD1Schema(client, config.accountId, config.databaseId)
      console.log("✅ D1 database schema initialized successfully")
      console.log("   Tables created: jwt_tokens")
      console.log("   Indexes created: idx_jwt_tokens_sub")
    } catch (error) {
      console.error("❌ Failed to initialize D1 database schema:", error)
      process.exit(1)
    }
  })

// Create command
const _createCommand = program
  .command("create")
  .description("Create a new JWT token")
  .option("-s, --sub <subject>", "Subject (user ID) for the token")
  .option("-e, --expiry <time>", "Token expiration (e.g., '1h', '7d', '30d') [default: 30d]")
  .option("-m, --max-requests <number>", "Maximum number of requests allowed", (value) => Number.parseInt(value))
  .option("-d, --description <text>", "Description of the token purpose")
  .option("--no-expiry", "Create a token that never expires (requires confirmation)")
  .option("--seriously-no-expiry", "Skip confirmation for no-expiry tokens (use with caution)")
  .option("--secret <secret>", "JWT secret key")
  .option("-i, --interactive", "Interactive mode")
  .action(async (options) => {
    let tokenRequest: JWTRequest
    let secret: string

    if (options.interactive) {
      console.log("\\n🔐 Interactive JWT Token Creator\\n")

      const sub = readlineSync.question("Enter subject (user ID): ")
      if (!sub) {
        console.error("❌ Subject is required")
        process.exit(1)
      }

      const description = readlineSync.question("Enter description (optional): ") || undefined
      const expiresIn =
        readlineSync.question("Enter expiration (optional, e.g., '1h', '7d') [default: 30d]: ") || undefined
      const maxRequestsStr = readlineSync.question("Enter max requests (optional): ")
      const maxRequests = maxRequestsStr ? Number.parseInt(maxRequestsStr) : undefined

      // Handle no-expiry option in interactive mode
      let noExpiry = false
      if (!expiresIn && readlineSync.keyInYN("Create token without expiration? (NOT RECOMMENDED)")) {
        console.log("⚠️  WARNING: Tokens without expiration can pose security risks!")
        console.log("   They remain valid indefinitely unless explicitly revoked.")
        if (readlineSync.keyInYN("Are you sure you want to create a token without expiration?")) {
          noExpiry = true
        }
      }

      secret = options.secret || getJWTSecret() || readlineSync.question("Enter JWT secret: ", { hideEchoBack: true })

      tokenRequest = { sub, description, expiresIn, maxRequests, noExpiry }
    } else {
      if (!options.sub) {
        console.error("❌ Subject (--sub) is required")
        process.exit(1)
      }

      // Handle no-expiry warnings in command-line mode
      let noExpiry = false
      if (options.noExpiry) {
        // --no-expiry was explicitly specified
        if (!options.seriouslyNoExpiry) {
          // --seriously-no-expiry was NOT specified
          console.log("⚠️  WARNING: You are creating a token without expiration!")
          console.log("   This is NOT RECOMMENDED for security reasons.")
          console.log("   Tokens without expiration remain valid indefinitely unless explicitly revoked.")
          console.log("   Consider using a long expiration period instead (e.g., --expiry '1y').")
          console.log("")
          const confirmed = readlineSync.keyInYN("Are you sure you want to create a token without expiration?")
          if (!confirmed) {
            console.log("❌ Token creation cancelled")
            process.exit(1)
          }
        }
        noExpiry = true
      }

      secret = options.secret || getJWTSecret()
      if (!secret) {
        console.error("❌ JWT secret is required. Set API_JWT_SECRET env var or use --secret option")
        process.exit(1)
      }

      tokenRequest = {
        sub: options.sub,
        description: options.description,
        expiresIn: options.expiry,
        maxRequests: options.maxRequests,
        noExpiry
      }
    }

    try {
      const { token, metadata } = await createToken(tokenRequest, secret)

      // Store in D1 production database
      try {
        await storeTokenMetadata(metadata)
        console.log("✅ Token metadata stored in D1 production database")
      } catch (error) {
        console.warn("⚠️  Could not store in D1 database:", error)
        console.log("   Token was still created successfully and can be used")
        console.log("   Tip: Run 'bun jwt init' to initialize the database schema if needed")
      }

      console.log("\\n✅ JWT Token Created Successfully\\n")
      console.log("Token:")
      console.log(token)
      console.log("\\nMetadata:")
      console.log(JSON.stringify(metadata, null, 2))

      console.log("\\n💡 Usage Examples:")
      console.log(`curl -H "Authorization: Bearer ${token}" https://dave.io/api/auth`)
      console.log(`curl "https://dave.io/api/auth?token=${token}"`)
    } catch (error) {
      console.error("❌ Error creating token:", error)
      process.exit(1)
    }
  })

// List command
program
  .command("list")
  .description("List all stored tokens")
  .option("--limit <number>", "Limit number of results", (value) => Number.parseInt(value), 50)
  .action(async (options) => {
    try {
      const result = await executeD1Command("SELECT * FROM jwt_tokens ORDER BY created_at DESC LIMIT ?", [
        options.limit
      ])
      const rawTokens = Array.isArray(result) ? result : []

      if (rawTokens.length === 0) {
        console.log("📭 No tokens found")
        return
      }

      const tokens = rawTokens.map(mapD1Token)
      console.log(`\\n📋 Found ${tokens.length} tokens:\\n`)

      for (const token of tokens) {
        const expiryStatus = token.expiresAt
          ? new Date(token.expiresAt) > new Date()
            ? "✅ Valid"
            : "❌ Expired"
          : "♾️  No expiry"

        console.log(`🔑 ${token.uuid}`)
        console.log(`   Subject: ${token.sub}`)
        console.log(`   Description: ${token.description || "No description"}`)
        console.log(`   Max Requests: ${token.maxRequests || "Unlimited"}`)
        console.log(`   Created: ${token.createdAt}`)
        console.log(`   Expires: ${token.expiresAt || "Never"} ${expiryStatus}`)
        console.log()
      }
    } catch (error) {
      console.error("❌ Error listing tokens:", error)
      process.exit(1)
    }
  })

// Show command
program
  .command("show <uuid>")
  .description("Show detailed information about a specific token")
  .action(async (uuid) => {
    try {
      const result = await executeD1Command("SELECT * FROM jwt_tokens WHERE uuid = ?", [uuid])
      const rawTokens = Array.isArray(result) ? result : []
      const rawToken = rawTokens.length > 0 ? rawTokens[0] : null

      if (!rawToken) {
        console.error(`❌ Token with UUID ${uuid} not found`)
        process.exit(1)
      }

      const token = mapD1Token(rawToken)
      console.log("\\n🔍 Token Details:\\n")
      console.log(`UUID: ${token.uuid}`)
      console.log(`Subject: ${token.sub}`)
      console.log(`Description: ${token.description || "No description"}`)
      console.log(`Max Requests: ${token.maxRequests || "Unlimited"}`)
      console.log(`Created: ${token.createdAt}`)
      console.log(`Expires: ${token.expiresAt || "Never"}`)

      if (token.expiresAt) {
        const isExpired = new Date(token.expiresAt) <= new Date()
        console.log(`Status: ${isExpired ? "❌ Expired" : "✅ Valid"}`)
      } else {
        console.log("Status: ♾️  No expiry")
      }
    } catch (error) {
      console.error("❌ Error showing token:", error)
      process.exit(1)
    }
  })

// Revoke command
program
  .command("revoke <uuid>")
  .description("Revoke a token by UUID")
  .option("--confirm", "Skip confirmation prompt")
  .action(async (uuid, options) => {
    try {
      // First check if the token exists
      const result = await executeD1Command("SELECT * FROM jwt_tokens WHERE uuid = ?", [uuid])
      const rawTokens = Array.isArray(result) ? result : []
      const rawToken = rawTokens.length > 0 ? rawTokens[0] : null

      if (!rawToken) {
        console.error(`❌ Token with UUID ${uuid} not found`)
        process.exit(1)
      }

      const token = mapD1Token(rawToken)
      console.log("\\n🔍 Token to revoke:")
      console.log(`   UUID: ${token.uuid}`)
      console.log(`   Subject: ${token.sub}`)
      console.log(`   Description: ${token.description || "No description"}`)

      if (!options.confirm) {
        console.log("\\n⚠️  WARNING: This will immediately revoke the token.")
        console.log("   The token will no longer be accepted by the API.")
        console.log("   This action cannot be undone.")

        const confirmed = readlineSync.keyInYN("\\nAre you sure you want to revoke this token?")
        if (!confirmed) {
          console.log("❌ Token revocation cancelled")
          process.exit(1)
        }
      }

      console.log(`\\n🚫 Revoking token ${uuid}...`)

      // Set revocation flag in KV
      const { client, config } = createCloudflareClient(false, true)
      if (!config.kvNamespaceId) {
        throw new Error("KV namespace ID not configured")
      }
      const kvNamespaceId = config.kvNamespaceId

      await client.kv.namespaces.values.update(kvNamespaceId, `auth:revocation:${uuid}`, {
        account_id: config.accountId,
        value: "true",
        metadata: {}
      })

      console.log("✅ Token revoked successfully")
      console.log("   The token is now immediately invalid and cannot be used")
    } catch (error) {
      console.error("❌ Failed to revoke token:", error)
      process.exit(1)
    }
  })

// Search command
program
  .command("search")
  .description("Search tokens by various criteria")
  .option("--uuid <uuid>", "Search by UUID")
  .option("--sub <subject>", "Search by subject")
  .option("--description <text>", "Search by description")
  .action(async (options) => {
    if (!options.uuid && !options.sub && !options.description) {
      console.error("❌ At least one search criteria is required")
      process.exit(1)
    }

    try {
      let sql: string
      let params: unknown[]

      if (options.uuid) {
        sql = "SELECT * FROM jwt_tokens WHERE uuid = ?"
        params = [options.uuid]
      } else if (options.sub) {
        sql = "SELECT * FROM jwt_tokens WHERE sub LIKE ?"
        params = [`%${options.sub}%`]
      } else if (options.description) {
        sql = "SELECT * FROM jwt_tokens WHERE description LIKE ?"
        params = [`%${options.description}%`]
      } else {
        throw new Error("No search criteria provided")
      }

      const result = await executeD1Command(sql, params)
      const rawTokens = Array.isArray(result) ? result : []

      if (rawTokens.length === 0) {
        console.log("📭 No matching tokens found")
        return
      }

      const tokens = rawTokens.map(mapD1Token)
      console.log(`\\n🔍 Found ${tokens.length} matching tokens:\\n`)

      for (const token of tokens) {
        const expiryStatus = token.expiresAt
          ? new Date(token.expiresAt) > new Date()
            ? "✅ Valid"
            : "❌ Expired"
          : "♾️  No expiry"

        console.log(`🔑 ${token.uuid}`)
        console.log(`   Subject: ${token.sub}`)
        console.log(`   Description: ${token.description || "No description"}`)
        console.log(`   Status: ${expiryStatus}`)
        console.log()
      }
    } catch (error) {
      console.error("❌ Error searching tokens:", error)
      process.exit(1)
    }
  })

// Add help text to the main program
program.addHelpText(
  "after",
  `
Commands:
  create              Create a new JWT token
  list                List all stored tokens
  show <uuid>         Show details of a specific token
  search              Search tokens by criteria
  revoke <uuid>       Revoke a token by UUID

Environment Variables:
  API_JWT_SECRET                  JWT secret key
  CLOUDFLARE_API_TOKEN           Cloudflare API token with D1 permissions
  CLOUDFLARE_ACCOUNT_ID          Your Cloudflare account ID
  CLOUDFLARE_D1_DATABASE_ID      D1 database ID for API_AUTH_METADATA

Database:
  Uses production Cloudflare D1 database via Cloudflare SDK

Setup Requirements:
  1. Create a Cloudflare API token with D1 read/write permissions
  2. Set the required environment variables
  3. D1 database 'API_AUTH_METADATA' must exist in your Cloudflare account

Examples:
  bun jwt create --sub "ai:alt" --description "Alt text generation"  # 30d default expiry
  bun jwt create --sub "ai" --max-requests 1000 --expiry "7d"
  bun jwt create --sub "admin" --no-expiry --seriously-no-expiry  # No expiry (dangerous)
  bun jwt create --sub "metrics" --description "Metrics access" --expiry "1y"
  bun jwt list
  bun jwt show <uuid>
  bun jwt search --sub "ai"
  bun jwt search --description "Dave"

Security Notes:
  - Tokens default to 30-day expiration for security
  - Use --no-expiry only for special cases (requires confirmation)
  - Use --seriously-no-expiry to skip confirmation (use with extreme caution)
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
