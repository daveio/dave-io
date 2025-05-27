#!/usr/bin/env bun
import Database from "bun:sqlite"
import { Command } from "commander"
import jwt from "jsonwebtoken"
import ms from "ms"
import readlineSync from "readline-sync"
import { v4 as uuidv4 } from "uuid"

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

program.name("jwt").description("JWT Token Management for api.dave.io").version("2.0.0")

// Environment variable helpers
function getJWTSecret(): string | null {
  return process.env.JWT_SECRET || process.env.API_JWT_SECRET || null
}

function getD1DatabasePath(): string | null {
  return process.env.D1_LOCAL_PATH || process.env.AUTH_DB_PATH || null
}

// Database initialization
function initializeDatabase(dbPath: string): Database {
  const db = new Database(dbPath)

  // Create the tokens table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      uuid TEXT PRIMARY KEY,
      sub TEXT NOT NULL,
      description TEXT,
      max_requests INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT
    )
  `)

  return db
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
function storeTokenMetadata(db: Database, metadata: TokenMetadata): void {
  const query = db.prepare(`
    INSERT INTO tokens (uuid, sub, description, max_requests, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  query.run(
    metadata.uuid,
    metadata.sub,
    metadata.description || null,
    metadata.maxRequests || null,
    metadata.createdAt,
    metadata.expiresAt || null
  )
}

// Parse expiration duration
function parseExpiration(expiresIn: string): number {
  let milliseconds: number | undefined
  try {
    const result = ms(expiresIn)
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

// Create command
const createCommand = program
  .command("create")
  .description("Create a new JWT token")
  .option("-s, --sub <subject>", "Subject (user ID) for the token")
  .option("-e, --expires <time>", "Token expiration (e.g., '1h', '7d', '30d') [default: 30d]")
  .option("-m, --max-requests <number>", "Maximum number of requests allowed", (value) => Number.parseInt(value))
  .option("-d, --description <text>", "Description of the token purpose")
  .option("--no-expiry", "Create a token that never expires (requires confirmation)")
  .option("--no-seriously-no-expiry", "Skip confirmation for no-expiry tokens (use with caution)")
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
      if (options.expiry === false) {
        // --no-expiry was explicitly specified
        if (options.seriouslyNoExpiry !== false) {
          // --no-seriously-no-expiry was NOT specified
          console.log("⚠️  WARNING: You are creating a token without expiration!")
          console.log("   This is NOT RECOMMENDED for security reasons.")
          console.log("   Tokens without expiration remain valid indefinitely unless explicitly revoked.")
          console.log("   Consider using a long expiration period instead (e.g., --expires '1y').")
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
        console.error("❌ JWT secret is required. Set JWT_SECRET env var or use --secret option")
        process.exit(1)
      }

      tokenRequest = {
        sub: options.sub,
        description: options.description,
        expiresIn: options.expires,
        maxRequests: options.maxRequests,
        noExpiry
      }
    }

    try {
      const { token, metadata } = await createToken(tokenRequest, secret)

      // Store in D1 if database path is available
      const dbPath = getD1DatabasePath()
      if (dbPath) {
        try {
          const db = initializeDatabase(dbPath)
          storeTokenMetadata(db, metadata)
          db.close()
          console.log("✅ Token metadata stored in database")
        } catch (error) {
          console.warn("⚠️  Could not store in database:", error)
        }
      } else {
        console.warn("⚠️  No D1 database path configured. Set D1_LOCAL_PATH or AUTH_DB_PATH env var")
      }

      console.log("\\n✅ JWT Token Created Successfully\\n")
      console.log("Token:")
      console.log(token)
      console.log("\\nMetadata:")
      console.log(JSON.stringify(metadata, null, 2))

      console.log("\\n💡 Usage Examples:")
      console.log(`curl -H "Authorization: Bearer ${token}" https://api.dave.io/auth`)
      console.log(`curl "https://api.dave.io/auth?token=${token}"`)
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
    const dbPath = getD1DatabasePath()
    if (!dbPath) {
      console.error("❌ D1 database path not configured. Set D1_LOCAL_PATH or AUTH_DB_PATH env var")
      process.exit(1)
    }

    try {
      const db = initializeDatabase(dbPath)
      const query = db.prepare("SELECT * FROM tokens ORDER BY created_at DESC LIMIT ?")
      const tokens = query.all(options.limit) as TokenMetadata[]
      db.close()

      if (tokens.length === 0) {
        console.log("📭 No tokens found")
        return
      }

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
    const dbPath = getD1DatabasePath()
    if (!dbPath) {
      console.error("❌ D1 database path not configured. Set D1_LOCAL_PATH or AUTH_DB_PATH env var")
      process.exit(1)
    }

    try {
      const db = initializeDatabase(dbPath)
      const query = db.prepare("SELECT * FROM tokens WHERE uuid = ?")
      const token = query.get(uuid) as TokenMetadata | null
      db.close()

      if (!token) {
        console.error(`❌ Token with UUID ${uuid} not found`)
        process.exit(1)
      }

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
  .action(async (uuid) => {
    console.log(`\\n🚫 Revoking token ${uuid}...\\n`)

    // Note: This would require KV access which is not available in the CLI
    // For now, we'll just show how to revoke via the API or manual KV update
    console.log("Token revocation requires KV access.")
    console.log("To revoke this token:")
    console.log(`1. Set KV key "auth:revocation:${uuid}" to "true"`)
    console.log("2. Or use the API endpoint (when implemented)")
    console.log("3. Or use Wrangler CLI:")
    console.log(`   bun run wrangler kv:key put "auth:revocation:${uuid}" "true" --binding DATA`)
  })

// Search command
program
  .command("search")
  .description("Search tokens by various criteria")
  .option("--uuid <uuid>", "Search by UUID")
  .option("--sub <subject>", "Search by subject")
  .option("--description <text>", "Search by description")
  .action(async (options) => {
    const dbPath = getD1DatabasePath()
    if (!dbPath) {
      console.error("❌ D1 database path not configured. Set D1_LOCAL_PATH or AUTH_DB_PATH env var")
      process.exit(1)
    }

    if (!options.uuid && !options.sub && !options.description) {
      console.error("❌ At least one search criteria is required")
      process.exit(1)
    }

    try {
      const db = initializeDatabase(dbPath)
      let query: any
      let params: any[]

      if (options.uuid) {
        query = db.prepare("SELECT * FROM tokens WHERE uuid = ?")
        params = [options.uuid]
      } else if (options.sub) {
        query = db.prepare("SELECT * FROM tokens WHERE sub LIKE ?")
        params = [`%${options.sub}%`]
      } else if (options.description) {
        query = db.prepare("SELECT * FROM tokens WHERE description LIKE ?")
        params = [`%${options.description}%`]
      }

      const tokens = query.all(...params) as TokenMetadata[]
      db.close()

      if (tokens.length === 0) {
        console.log("📭 No matching tokens found")
        return
      }

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
  JWT_SECRET or API_JWT_SECRET    JWT secret key
  D1_LOCAL_PATH or AUTH_DB_PATH   Path to local D1 database

Examples:
  bun jwt create --sub "ai:alt" --description "Alt text generation"  # 30d default expiry
  bun jwt create --sub "ai" --max-requests 1000 --expires "7d"
  bun jwt create --sub "admin" --no-expiry --no-seriously-no-expiry  # No expiry (dangerous)
  bun jwt create --sub "metrics" --description "Metrics access" --expires "1y"
  bun jwt list
  bun jwt show <uuid>
  bun jwt search --sub "ai"
  bun jwt search --description "Dave"

Security Notes:
  - Tokens default to 30-day expiration for security
  - Use --no-expiry only for special cases (requires confirmation)
  - Use --no-seriously-no-expiry to skip confirmation (use with extreme caution)
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
