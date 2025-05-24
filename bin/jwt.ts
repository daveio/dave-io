#!/usr/bin/env bun

/**
 * JWT Token Generator CLI
 *
 * This CLI tool generates JWT tokens for API authentication.
 * It can be used to create tokens with specific scopes and expiration times.
 */

import readline from "readline-sync"
import { generateToken } from "../src/lib/auth"
import { TokenGenerationSchema } from "../src/schemas"

// Default values
const DEFAULT_EXPIRATION = "1d"
const DEFAULT_ISSUER = "api.dave.io"
const DEFAULT_AUDIENCE = "api.dave.io"

// Get JWT secret from environment or prompt user
const getJwtSecret = (): string => {
  // Try to get from environment
  const envSecret = process.env.JWT_SECRET

  if (envSecret) {
    return envSecret
  }

  // Prompt user for secret
  const secret = readline.question("Enter JWT secret key: ", {
    hideEchoBack: true
  })

  if (!secret) {
    console.error("JWT secret is required")
    process.exit(1)
  }

  return secret
}

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2)
  const options: Record<string, string | string[]> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith("--")) {
      const key = arg.slice(2)

      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        // Handle array values for scopes
        if (key === "scopes") {
          const scopesStr = args[i + 1]
          options[key] = scopesStr.split(",")
        } else {
          options[key] = args[i + 1]
        }
        i++
      } else {
        options[key] = "true"
      }
    }
  }

  return options
}

// Main function
const main = async () => {
  try {
    console.log("JWT Token Generator")
    console.log("==================")

    // Get JWT secret
    const jwtSecret = getJwtSecret()

    // Parse command line arguments
    const args = parseArgs()

    // Get subject (required)
    const subject = (args.subject as string) || readline.question("Enter subject (user identifier): ")

    if (!subject) {
      console.error("Subject is required")
      process.exit(1)
    }

    // Get scopes
    let scopes: string[]
    if (args.scopes) {
      scopes = args.scopes as string[]
    } else {
      const scopesInput = readline.question("Enter scopes (comma-separated): ")
      scopes = scopesInput ? scopesInput.split(",").map((s) => s.trim()) : []
    }

    // Get expiration
    const expiresIn =
      (args.expiresIn as string) ||
      readline.question(`Enter expiration time (default: ${DEFAULT_EXPIRATION}): `) ||
      DEFAULT_EXPIRATION

    // Get issuer
    const issuer =
      (args.issuer as string) || readline.question(`Enter issuer (default: ${DEFAULT_ISSUER}): `) || DEFAULT_ISSUER

    // Get audience
    const audience =
      (args.audience as string) ||
      readline.question(`Enter audience (default: ${DEFAULT_AUDIENCE}): `) ||
      DEFAULT_AUDIENCE

    // Validate input using our schema
    const tokenRequest = TokenGenerationSchema.parse({
      subject,
      scopes,
      expiresIn,
      issuer,
      audience
    })

    // Generate token
    const { token, expiresAt } = generateToken(
      {
        sub: tokenRequest.subject,
        scopes: tokenRequest.scopes,
        iss: tokenRequest.issuer,
        aud: tokenRequest.audience
      },
      jwtSecret,
      tokenRequest.expiresIn
    )

    // Output the token
    console.log("\nGenerated JWT Token:")
    console.log("====================")
    console.log(token)
    console.log("\nToken Details:")
    console.log("==============")
    console.log(`Subject: ${tokenRequest.subject}`)
    console.log(`Scopes: ${tokenRequest.scopes.join(", ") || "none"}`)
    console.log(`Expires: ${expiresAt.toISOString()} (${tokenRequest.expiresIn})`)
    console.log(`Issuer: ${tokenRequest.issuer}`)
    console.log(`Audience: ${tokenRequest.audience}`)
  } catch (error) {
    console.error("Error generating token:", error)
    process.exit(1)
  }
}

// Run the main function
main()
