#!/usr/bin/env bun

/**
 * Development Variables Setup Script
 *
 * This script processes .env file during install to create development
 * variable files for Wrangler. It separates regular variables from secrets
 * based on "# secret" comments.
 *
 * Creates:
 * - .dev.vars: Regular environment variables
 * - .dev.vars.secrets: Secret environment variables (if any exist)
 *
 * The script runs as part of the postinstall process and helps automate
 * the setup of development environment for Cloudflare Workers.
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"

const rootDir = join(import.meta.dir, "..")
const envPath = join(rootDir, ".env")
const devVarsPath = join(rootDir, ".dev.vars")
const devVarsSecretsPath = join(rootDir, ".dev.vars.secrets")

// Check if .env exists
if (!existsSync(envPath)) {
  console.log("No .env file found, skipping dev vars setup")
  process.exit(0)
}

// Remove existing files
if (existsSync(devVarsPath)) {
  unlinkSync(devVarsPath)
}
if (existsSync(devVarsSecretsPath)) {
  unlinkSync(devVarsSecretsPath)
}

// Read and parse .env file
const envContent = readFileSync(envPath, "utf-8")
const lines = envContent.split("\n")

const regularVars: string[] = []
const secretVars: string[] = []

// Process each line
for (const line of lines) {
  const trimmedLine = line.trim()

  // Skip empty lines and comments (unless they have variables)
  if (!trimmedLine || (trimmedLine.startsWith("#") && !trimmedLine.includes("="))) {
    continue
  }

  // Check if line has a secret comment at the end
  const secretCommentIndex = line.indexOf("# secret")
  const hasSecretComment = secretCommentIndex !== -1

  if (hasSecretComment) {
    // Remove the comment and add to secrets
    const varLine = line.substring(0, secretCommentIndex).trim()
    if (varLine && varLine.includes("=")) {
      secretVars.push(varLine)
    }
  } else if (trimmedLine.includes("=")) {
    // Regular variable
    regularVars.push(trimmedLine)
  }
}

// Write .dev.vars (always create, even if empty)
let devVarsContent = regularVars.join("\n")

// Add source command if secrets exist
if (secretVars.length > 0) {
  if (devVarsContent) {
    devVarsContent += "\n"
  }
  devVarsContent += "source .dev.vars.secrets\n"
}

writeFileSync(devVarsPath, devVarsContent)
console.log(`Created ${devVarsPath}`)

// Write .dev.vars.secrets only if secrets exist
if (secretVars.length > 0) {
  const devVarsSecretsContent = secretVars.join("\n") + "\n"
  writeFileSync(devVarsSecretsPath, devVarsSecretsContent)
  console.log(`Created ${devVarsSecretsPath} with ${secretVars.length} secrets`)

  // Note: We don't upload secrets automatically during install
  // The user should run 'bun run deploy:env' to upload secrets to Cloudflare
  console.log("\nTo upload secrets to Cloudflare Workers, run: bun run deploy:env")
} else {
  console.log("No secrets found in .env")
}

process.exit(0)
