#!/usr/bin/env bun
import jwt from "jsonwebtoken"
import readlineSync from "readline-sync"
import { COMMON_SCOPES, type CreateJWTRequest } from "../src/schemas/auth.schema"

interface CLIArgs {
  sub?: string
  scopes?: string[]
  expiresIn?: string
  secret?: string
  interactive?: boolean
  help?: boolean
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  const parsed: CLIArgs = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case "--sub":
      case "-s":
        parsed.sub = args[++i]
        break
      case "--scopes":
        parsed.scopes = args[++i]?.split(",").map((s) => s.trim()) || []
        break
      case "--expires":
      case "-e":
        parsed.expiresIn = args[++i]
        break
      case "--secret":
        parsed.secret = args[++i]
        break
      case "--interactive":
      case "-i":
        parsed.interactive = true
        break
      case "--help":
      case "-h":
        parsed.help = true
        break
    }
  }

  return parsed
}

function showHelp(): void {
  console.log(`
JWT Token Generator for api.dave.io

Usage:
  bun jwt [options]
  bun run jwt [options]

Options:
  -s, --sub <subject>     Subject (user ID) for the token
  --scopes <scopes>       Comma-separated list of scopes (e.g., "read,write,admin")
  -e, --expires <time>    Token expiration (e.g., "1h", "7d", "30m") [default: 1h]
  --secret <secret>       JWT secret key (or set JWT_SECRET env var)
  -i, --interactive       Interactive mode - prompts for all values
  -h, --help              Show this help message

Available Scopes:
  ${Object.values(COMMON_SCOPES).join(", ")}

Examples:
  bun jwt --sub user123 --scopes "read,metrics" --expires "24h"
  bun jwt --interactive
  JWT_SECRET=mysecret bun jwt --sub admin --scopes "admin,read,write"

Environment Variables:
  JWT_SECRET             JWT secret key (required if not passed via --secret)
`)
}

function getInteractiveInput(): CreateJWTRequest & { secret: string } {
  console.log("\\n🔐 Interactive JWT Token Generator\\n")

  const sub = readlineSync.question("Enter subject (user ID): ")
  if (!sub) {
    console.error("❌ Subject is required")
    process.exit(1)
  }

  console.log(`\\nAvailable scopes: ${Object.values(COMMON_SCOPES).join(", ")}`)
  const scopesInput = readlineSync.question("Enter scopes (comma-separated, or press Enter for none): ")
  const scopes = scopesInput ? scopesInput.split(",").map((s) => s.trim()) : []

  const expiresIn = readlineSync.question("Enter expiration time (e.g., 1h, 7d, 30m) [default: 1h]: ") || "1h"

  const secret =
    readlineSync.question("Enter JWT secret (or press Enter to use JWT_SECRET env var): ", {
      hideEchoBack: true
    }) || process.env.JWT_SECRET

  if (!secret) {
    console.error("❌ JWT secret is required")
    process.exit(1)
  }

  return { sub, scopes, expiresIn, secret }
}

function validateScopes(scopes: string[]): boolean {
  const validScopes = Object.values(COMMON_SCOPES)
  return scopes.every((scope) => validScopes.includes(scope as (typeof COMMON_SCOPES)[keyof typeof COMMON_SCOPES]))
}

function generateToken(payload: CreateJWTRequest, secret: string): string {
  const now = Math.floor(Date.now() / 1000)

  const jwtPayload = {
    sub: payload.sub,
    scopes: payload.scopes,
    iat: now,
    exp: now + parseExpiration(payload.expiresIn)
  }

  return jwt.sign(jwtPayload, secret, { algorithm: 'ES256' })
}

function parseExpiration(expiresIn: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800
  }

  const match = expiresIn.match(/^(\\d+)([smhdw])$/)
  if (!match) {
    console.error(`❌ Invalid expiration format: ${expiresIn}. Use format like '1h', '7d', '30m'`)
    process.exit(1)
  }

  const [, value, unit] = match
  return Number.parseInt(value) * units[unit]
}

function main(): void {
  const args = parseArgs()

  if (args.help) {
    showHelp()
    return
  }

  let payload: CreateJWTRequest & { secret: string }

  if (args.interactive) {
    payload = getInteractiveInput()
  } else {
    if (!args.sub) {
      console.error("❌ Subject (--sub) is required. Use --help for usage info.")
      process.exit(1)
    }

    const secret = args.secret || process.env.JWT_SECRET
    if (!secret) {
      console.error("❌ JWT secret is required. Set JWT_SECRET env var or use --secret option.")
      process.exit(1)
    }

    payload = {
      sub: args.sub,
      scopes: args.scopes || [],
      expiresIn: args.expiresIn || "1h",
      secret
    }
  }

  if (payload.scopes.length > 0 && !validateScopes(payload.scopes)) {
    console.error(`❌ Invalid scopes. Available: ${Object.values(COMMON_SCOPES).join(", ")}`)
    process.exit(1)
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
          scopes: payload.scopes,
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
}

if (import.meta.main) {
  main()
}
