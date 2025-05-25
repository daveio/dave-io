#!/usr/bin/env bun
import { Command } from "commander"
import jwt from "jsonwebtoken"
import ms from "ms"
import readlineSync from "readline-sync"

interface JWTRequest {
  sub: string
  expiresIn: string
}

const program = new Command()

program
  .name("jwt")
  .description("JWT Token Generator for api.dave.io")
  .version("1.0.0")
  .option("-s, --sub <subject>", "Subject (user ID) for the token")
  .option("-e, --expires <time>", "Token expiration (e.g., '1h', '7d', '1h30m', '2d12h') [default: 1h]", "1h")
  .option("--secret <secret>", "JWT secret key (takes precedence over env var)")
  .option("-i, --interactive", "Interactive mode - prompts for all values")
  .addHelpText(
    "after",
    `
Examples:
  bun jwt --sub SUBJECT --expires "24h"
  bun jwt --sub SUBJECT --expires "1h30m"
  bun jwt --sub SUBJECT --expires "2d12h"
  bun jwt --interactive
  JWT_SECRET=mysecret bun jwt --sub SUBJECT

Secret Priority (highest to lowest):
  1. --secret option
  2. JWT_SECRET environment variable

Note: Cloudflare secrets are write-only for security and cannot be retrieved.

Environment Variables:
  JWT_SECRET             JWT secret key (fallback if not passed via --secret)
`
  )

async function getSecret(options: { secret?: string }): Promise<string | null> {
  // Priority 1: Explicit --secret option
  if (options.secret) {
    console.log("🔑 Using secret from --secret option")
    return options.secret
  }

  // Priority 2: Environment variable
  if (process.env.JWT_SECRET) {
    console.log("🔑 Using secret from JWT_SECRET environment variable")
    return process.env.JWT_SECRET
  }

  // Note: Cloudflare secrets cannot be retrieved for security reasons

  return null
}

async function getInteractiveInput(): Promise<JWTRequest & { secret: string }> {
  console.log("\\n🔐 Interactive JWT Token Generator\\n")

  const sub = readlineSync.question("Enter subject (user ID): ")
  if (!sub) {
    console.error("❌ Subject is required")
    process.exit(1)
  }

  const expiresIn = readlineSync.question("Enter expiration time (e.g., 1h, 7d, 1h30m, 2d12h) [default: 1h]: ") || "1h"

  // Try to get secret automatically first
  console.log("\\n🔍 Checking for available secrets...")
  let secret = await getSecret({})

  if (!secret) {
    console.log("\\n⚠️  No secrets found automatically. Please enter manually:")
    secret = readlineSync.question("Enter JWT secret: ", {
      hideEchoBack: true
    })
  }

  if (!secret) {
    console.error("❌ JWT secret is required")
    process.exit(1)
  }

  return { sub, expiresIn, secret }
}

function generateToken(payload: JWTRequest, secret: string): string {
  const now = Math.floor(Date.now() / 1000)

  const jwtPayload = {
    sub: payload.sub,
    iat: now,
    exp: now + parseExpiration(payload.expiresIn)
  }

  return jwt.sign(jwtPayload, secret, { algorithm: "HS256" })
}

function parseExpiration(expiresIn: string): number {
  // Try ms library first for simple durations
  let milliseconds: number | undefined
  try {
    // @ts-expect-error: ms library accepts strings but types may be incorrect
    const result = ms(expiresIn)
    milliseconds = typeof result === "number" ? result : undefined
  } catch {
    milliseconds = undefined
  }

  // If ms fails, try compound duration parsing
  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    milliseconds = parseCompoundDuration(expiresIn)
  }

  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    console.error(
      `❌ Invalid expiration format: ${expiresIn}. Use format like '1h', '7d', '90m', or simple durations only`
    )
    process.exit(1)
  }
  return Math.floor(milliseconds / 1000) // Convert to seconds
}

function parseCompoundDuration(duration: string): number | undefined {
  // Parse compound durations like "1h30m" by breaking them down
  const units: Record<string, number> = {
    w: 604800000, // week
    d: 86400000, // day
    h: 3600000, // hour
    m: 60000, // minute
    s: 1000 // second
  }

  let total = 0
  const remaining = duration.toLowerCase()

  // Match patterns like "1h", "30m", etc.
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

async function main(): Promise<void> {
  program.action(async (options) => {
    let payload: JWTRequest & { secret: string }

    if (options.interactive) {
      payload = await getInteractiveInput()
    } else {
      if (!options.sub) {
        console.error("❌ Subject (--sub) is required. Use --help for usage info.")
        process.exit(1)
      }

      const secret = await getSecret({
        secret: options.secret
      })

      if (!secret) {
        console.error("❌ JWT secret is required. Set JWT_SECRET env var or use --secret option.")
        console.error("💡 For production tokens, use the production API with a valid secret.")
        process.exit(1)
      }

      payload = {
        sub: options.sub,
        expiresIn: options.expires,
        secret
      }
    }

    try {
      const token = generateToken(payload, payload.secret)

      console.log("\\n✅ JWT Token Generated Successfully\\n")
      console.log("Token:")
      console.log(token)
      console.log("\\nPayload:")
      console.log(
        JSON.stringify(
          {
            sub: payload.sub,
            expiresIn: payload.expiresIn
          },
          null,
          2
        )
      )

      console.log("\\n💡 Usage Examples:")
      console.log(`curl -H "Authorization: Bearer ${token}" https://api.dave.io/protected-endpoint`)
      console.log(`curl "https://api.dave.io/protected-endpoint?token=${token}"`)
    } catch (error) {
      console.error("❌ Error generating token:", error)
      process.exit(1)
    }
  })

  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
