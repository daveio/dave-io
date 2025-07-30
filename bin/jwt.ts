#!/usr/bin/env bun
import type Cloudflare from "cloudflare"
import { Command } from "commander"
import { jwtVerify, SignJWT } from "jose"
import readlineSync from "readline-sync"
import { v4 as uuidv4 } from "uuid"
import { getJWTSecret, parseExpiration } from "./shared/cli-utils"
import { createCloudflareClient, executeD1Query, putKeyValueKV } from "./shared/cloudflare"

interface JWTRequest {
  sub: string
  expiresIn?: string
  description?: string
  noExpiry?: boolean
}

interface TokenMetadata {
  uuid: string
  sub: string
  description?: string
  createdAt: string
  expiresAt?: string
}

const program = new Command()

program.name("jwt").description("JWT Token Management for dave-io").version("3.0.0")

// Global options
program.option("--script", "Enable script mode (non-interactive, structured output)")
program.option("--local", "Use local KV storage for revocation checks (D1 always remote)")
program.option("--remote", "Use remote KV storage for revocation checks [default]")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

// Check if local mode is enabled for KV operations
function isLocalMode(): boolean {
  return program.opts().local || false
}

// D1 schema initialization

async function initializeD1Schema(client: Cloudflare, accountId: string, databaseId: string): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS jwt_tokens (
      uuid TEXT PRIMARY KEY,
      sub TEXT NOT NULL,
      description TEXT,
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

// Map D1 result from snake_case to camelCase
function mapD1Token(dbToken: unknown): TokenMetadata {
  const token = dbToken as Record<string, unknown>
  return {
    uuid: token.uuid as string,
    sub: token.sub as string,
    description: token.description as string | undefined,
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

    if (errorMessage?.includes("next-api-auth-metadata") || errorStatus === 404) {
      console.error("❌ D1 database 'next-api-auth-metadata' not found or not accessible")
      console.error("   Please ensure:")
      console.error("   1. You have a valid CLOUDFLARE_API_TOKEN with D1 permissions")
      console.error("   2. CLOUDFLARE_ACCOUNT_ID is correct")
      console.error("   3. The D1 database exists and is properly configured")
      throw new Error("D1 database not accessible")
    }
    console.error(`D1 command failed: ${errorMessage}`)
    throw error
  }
}

// Store token metadata in D1
async function storeTokenMetadata(metadata: TokenMetadata, dryRun = false): Promise<void> {
  if (dryRun) {
    console.log(`📋 Would store token metadata: ${metadata.uuid} (${metadata.sub})`)
    return
  }

  const sql = "INSERT INTO jwt_tokens (uuid, sub, description, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"

  const params = [
    metadata.uuid,
    metadata.sub,
    metadata.description || null,
    metadata.createdAt,
    metadata.expiresAt || null
  ]

  await executeD1Command(sql, params)
}

// Token creation with JOSE library (compatible with our auth system)
async function createToken(
  options: JWTRequest,
  secret: string,
  dryRun = false
): Promise<{ token: string; metadata: TokenMetadata }> {
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
    ...(exp && { exp })
  }

  if (dryRun) {
    console.log("📋 Would create JWT token:")
    console.log(`   UUID: ${uuid}`)
    console.log(`   Subject: ${options.sub}`)
    console.log(`   Description: ${options.description || "None"}`)
    console.log(`   Expires: ${expiresAt || "Never"}`)

    const metadata: TokenMetadata = {
      uuid,
      sub: options.sub,
      description: options.description,
      createdAt,
      expiresAt
    }

    return { token: "DRY_RUN_TOKEN", metadata }
  }

  // Use JOSE library (same as our auth system)
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(secret)

  const jwt = new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setSubject(options.sub)
    .setJti(uuid)

  if (exp) {
    jwt.setExpirationTime(exp)
  }

  const token = await jwt.sign(secretKey)

  const metadata: TokenMetadata = {
    uuid,
    sub: options.sub,
    description: options.description,
    createdAt,
    expiresAt
  }

  return { token, metadata }
}

// Init command
program
  .command("init")
  .description("Initialize D1 database schema for JWT tokens")
  .option("-d, --dry-run", "Show what would be initialized without making changes")
  .action(async (options) => {
    try {
      const scriptMode = isScriptMode()

      if (options.dryRun) {
        if (!scriptMode) {
          console.log("📋 Would initialize D1 database schema:")
          console.log("   - Create table: jwt_tokens")
          console.log("   - Create index: idx_jwt_tokens_sub")
        }
        return
      }

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

// Verify token command
program
  .command("verify <token>")
  .description("Verify a JWT token")
  .option("--secret <secret>", "JWT secret key")
  .action(async (token, options) => {
    const secret = options.secret || getJWTSecret()
    if (!secret) {
      console.error("❌ JWT secret is required. Set API_JWT_SECRET env var or use --secret option")
      process.exit(1)
    }

    try {
      const encoder = new TextEncoder()
      const secretKey = encoder.encode(secret)

      const { payload } = await jwtVerify(token, secretKey)

      console.log("✅ Token is valid")
      console.log("\n🔍 Token Details:")
      console.log(JSON.stringify(payload, null, 2))

      if (payload.exp) {
        const expiresAt = new Date(payload.exp * 1000)
        const isExpired = expiresAt <= new Date()
        console.log(`\nExpires: ${expiresAt.toISOString()} ${isExpired ? "❌ (EXPIRED)" : "✅ (Valid)"}`)
      } else {
        console.log("\nExpires: ♾️  Never")
      }
    } catch (error) {
      console.error("❌ Token verification failed:", error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// Create command
program
  .command("create")
  .description("Create a new JWT token")
  .option("-s, --sub <subject>", "Subject (endpoint or user identifier) for the token")
  .option("-e, --expiry <time>", 'Token expiration (e.g., "1h", "7d", "30d") [default: 30d]')
  .option("-d, --description <text>", "Description of the token purpose")
  .option("--no-expiry", "Create a token that never expires (requires confirmation)")
  .option("--seriously-no-expiry", "Skip confirmation for no-expiry tokens (use with caution)")
  .option("--secret <secret>", "JWT secret key")
  .option("-i, --interactive", "Interactive mode")
  .option("--dry-run", "Show what would be created without generating actual token")
  .action(async (options) => {
    let tokenRequest: JWTRequest
    let secret: string
    const scriptMode = isScriptMode()

    if (options.interactive && !scriptMode) {
      console.log("\n🔐 Interactive JWT Token Creator\n")

      const sub = readlineSync.question("Enter subject (endpoint or user identifier): ")
      if (!sub) {
        console.error("❌ Subject is required")
        process.exit(1)
      }

      const description = readlineSync.question("Enter description (optional): ") || undefined
      const expiresIn =
        readlineSync.question('Enter expiration (optional, e.g., "1h", "7d") [default: 30d]: ') || undefined

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

      tokenRequest = { sub, description, expiresIn, noExpiry }
    } else {
      if (!options.sub) {
        console.error("❌ Subject (--sub) is required")
        process.exit(1)
      }

      // Handle no-expiry warnings in command-line mode
      let noExpiry = false
      if (options.noExpiry) {
        // --no-expiry was explicitly specified
        if (!options.seriouslyNoExpiry && !scriptMode) {
          // --seriously-no-expiry was NOT specified and not in script mode
          console.log("⚠️  WARNING: You are creating a token without expiration!")
          console.log("   This is NOT RECOMMENDED for security reasons.")
          console.log("   Tokens without expiration remain valid indefinitely unless explicitly revoked.")
          console.log('   Consider using a long expiration period instead (e.g., --expiry "1y").')
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
        noExpiry
      }
    }

    try {
      const { token, metadata } = await createToken(tokenRequest, secret, options.dryRun)

      if (options.dryRun) {
        if (scriptMode) {
          const output = {
            success: true,
            dryRun: true,
            metadata,
            wouldStore: true
          }
          console.log(JSON.stringify(output, null, 2))
        }
        return
      }

      // Store in D1 production database if possible
      let dbStored = false
      try {
        await storeTokenMetadata(metadata)
        dbStored = true
        if (!scriptMode) {
          console.log("✅ Token metadata stored in D1 production database")
        }
      } catch (error) {
        if (!scriptMode) {
          console.warn("⚠️  Could not store in D1 database:", error)
          console.log("   Token was still created successfully and can be used")
          console.log("   Tip: Run 'bun jwt init' to initialize the database schema if needed")
        }
      }

      if (scriptMode) {
        // Script mode: output structured JSON
        const output = {
          success: true,
          token,
          metadata,
          dbStored
        }
        console.log(JSON.stringify(output, null, 2))
      } else {
        // Interactive mode: human-friendly output
        console.log("\n✅ JWT Token Created Successfully\n")
        console.log("Token:")
        console.log(token)
        console.log("\nMetadata:")
        console.log(JSON.stringify(metadata, null, 2))

        console.log("\n💡 Usage Examples:")
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/ping`)
        console.log(`curl "http://localhost:3000/api/ping?token=${token}"`)

        console.log("\n📋 Test with our API:")
        console.log(`bun run bin/api.ts --token "${token}"`)

        console.log("\n🔧 Token Management:")
        console.log(`bun jwt show ${metadata.uuid}`)
        console.log(`bun jwt revoke ${metadata.uuid}`)
        console.log(`bun jwt search --sub "${metadata.sub}"`)
      }
    } catch (error) {
      if (scriptMode) {
        const output = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          dryRun: options.dryRun || false
        }
        console.log(JSON.stringify(output, null, 2))
      } else {
        console.error("❌ Error creating token:", error)
      }
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
      console.log(`\n📋 Found ${tokens.length} tokens:\n`)

      for (const token of tokens) {
        const expiryStatus = token.expiresAt
          ? new Date(token.expiresAt) > new Date()
            ? "✅ Valid"
            : "❌ Expired"
          : "♾️  No expiry"

        console.log(`🔑 ${token.uuid}`)
        console.log(`   Subject: ${token.sub}`)
        console.log(`   Description: ${token.description || "No description"}`)
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
      console.log("\n🔍 Token Details:\n")
      console.log(`UUID: ${token.uuid}`)
      console.log(`Subject: ${token.sub}`)
      console.log(`Description: ${token.description || "No description"}`)
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
  .option("-d, --dry-run", "Show what would be revoked without making changes")
  .action(async (uuid, options) => {
    try {
      // First check if the token exists in D1
      let tokenInfo = null
      try {
        const result = await executeD1Command("SELECT * FROM jwt_tokens WHERE uuid = ?", [uuid])
        const rawTokens = Array.isArray(result) ? result : []
        const rawToken = rawTokens.length > 0 ? rawTokens[0] : null

        if (rawToken) {
          tokenInfo = mapD1Token(rawToken)
          console.log("\n🔍 Token to revoke:")
          console.log(`   UUID: ${tokenInfo.uuid}`)
          console.log(`   Subject: ${tokenInfo.sub}`)
          console.log(`   Description: ${tokenInfo.description || "No description"}`)
        } else {
          console.log(`\n⚠️  Token with UUID ${uuid} not found in D1 database`)
          console.log("   Proceeding with KV revocation anyway (token may still exist)")
        }
      } catch (error) {
        console.log(`\n⚠️  Could not check D1 database: ${error}`)
        console.log("   Proceeding with KV revocation anyway")
      }

      if (options.dryRun) {
        console.log(`\n📋 Would revoke token ${uuid}`)
        if (tokenInfo) {
          console.log(`   Subject: ${tokenInfo.sub}`)
          console.log(`   Description: ${tokenInfo.description || "No description"}`)
        }
        console.log(`   Would set KV key: auth:revocation:${uuid} = "true"`)
        return
      }

      if (!options.confirm) {
        console.log("\n⚠️  WARNING: This will immediately revoke the token.")
        console.log("   The token will no longer be accepted by the API.")
        console.log("   This action cannot be undone.")

        const confirmed = readlineSync.keyInYN("\nAre you sure you want to revoke this token?")
        if (!confirmed) {
          console.log("❌ Token revocation cancelled")
          process.exit(1)
        }
      }

      console.log(`\n🚫 Revoking token ${uuid}...`)

      // Set revocation flag in KV using wrangler CLI
      const useLocal = isLocalMode()
      await putKeyValueKV(`auth:revocation:${uuid}`, "true", useLocal)

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
      console.log(`\n🔍 Found ${tokens.length} matching tokens:\n`)

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
  init                Initialize D1 database schema for JWT tokens
  create              Create a new JWT token
  verify <token>      Verify and inspect a JWT token
  list                List all stored tokens
  show <uuid>         Show details of a specific token
  search              Search tokens by criteria
  revoke <uuid>       Revoke a token by UUID

Environment Variables:
  API_JWT_SECRET                  JWT secret key
  CLOUDFLARE_API_TOKEN           Cloudflare API token with D1/KV permissions
  CLOUDFLARE_ACCOUNT_ID          Your Cloudflare account ID
  CLOUDFLARE_D1_DATABASE_ID      D1 database ID (defaults to wrangler.jsonc binding)
  CLOUDFLARE_KV_NAMESPACE_ID     KV namespace ID (defaults to wrangler.jsonc binding)

Database:
  Uses production Cloudflare D1 database (always remote) and KV storage via Cloudflare SDK
  KV operations respect --local/--remote flags (default: remote)

Setup Requirements:
  1. Create a Cloudflare API token with D1 and KV read/write permissions
  2. Set the required environment variables
  3. Run 'bun jwt init' to initialize the database schema

Examples:
  bun jwt init                                                       # Initialize D1 schema
  bun jwt create --sub "api:metrics" --description "Metrics access"  # 30d default expiry
  bun jwt create --sub "ai:alt" --expiry "7d"
  bun jwt create --sub "admin" --no-expiry --seriously-no-expiry     # No expiry (dangerous)
  bun jwt create --sub "api" --description "API access" --expiry "1y"
  bun jwt verify "eyJhbGciOiJIUzI1NiJ9..."
  bun jwt list
  bun jwt show <uuid>
  bun jwt search --sub "ai"
  bun jwt search --description "Dave"
  bun jwt revoke <uuid>

Security Notes:
  - Tokens default to 30-day expiration for security
  - Use --no-expiry only for special cases (requires confirmation)
  - Use --seriously-no-expiry to skip confirmation (use with extreme caution)
  - This version is compatible with our Nuxt API authentication system
  - Token metadata is stored in D1, revocation is handled via KV storage
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { createToken }
