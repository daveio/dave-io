#!/usr/bin/env bun

/**
 * Deploy Environment Variables to Production
 *
 * This script reads environment variables from .env and deploys them to Cloudflare Workers
 * using wrangler secret put. It validates configuration and filters out development-only
 * variables.
 *
 * Safety features:
 * - Only deploys production-safe variables
 * - Validates required configuration
 * - Prevents deployment of API_DEV_* variables
 * - Ensures secure API token usage over legacy API key
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { spawn } from "bun"
import { Command } from "commander"

interface EnvVars {
  [key: string]: string
}

/**
 * Parse .env file into key-value pairs
 */
function parseEnvFile(filePath: string): EnvVars {
  if (!existsSync(filePath)) {
    throw new Error(`Environment file not found: ${filePath}`)
  }

  const envContent = readFileSync(filePath, "utf-8")
  const envVars: EnvVars = {}

  for (const line of envContent.split("\n")) {
    const trimmedLine = line.trim()

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const equalIndex = trimmedLine.indexOf("=")
    if (equalIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, equalIndex).trim()
    let value = trimmedLine.slice(equalIndex + 1).trim()

    // Remove quotes from value if present
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    envVars[key] = value
  }

  return envVars
}

/**
 * Validate environment configuration for production deployment
 */
function validateEnvironment(envVars: EnvVars): void {
  const requiredVars = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "API_JWT_SECRET"]
  const missingVars = requiredVars.filter((varName) => !envVars[varName])

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`)
  }

  // Check for dangerous API key configuration
  if (
    (envVars.CLOUDFLARE_API_KEY || envVars.CLOUDFLARE_EMAIL)
    && (!envVars.CLOUDFLARE_API_TOKEN || !envVars.CLOUDFLARE_ACCOUNT_ID)
  ) {
    throw new Error(
      "API key and email are configured but missing CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. "
      + "Production deployment requires secure API token authentication."
    )
  }
}

/**
 * Filter environment variables for production deployment
 */
function filterProductionVars(envVars: EnvVars, scriptMode = false): EnvVars {
  const productionVars: EnvVars = {}
  const excludedPrefixes = ["API_DEV_"]
  const excludedKeys = ["CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL"]

  for (const [key, value] of Object.entries(envVars)) {
    // Skip development variables
    if (excludedPrefixes.some((prefix) => key.startsWith(prefix))) {
      if (!scriptMode) {
        console.log(`🔇 Skipping development variable: ${key}`)
      }
      continue
    }

    // Skip dangerous legacy authentication
    if (excludedKeys.includes(key)) {
      if (!scriptMode) {
        console.log(`🔒 Skipping insecure variable: ${key}`)
      }
      continue
    }

    // Skip empty values
    if (!value.trim()) {
      if (!scriptMode) {
        console.log(`⚠️  Skipping empty variable: ${key}`)
      }
      continue
    }

    productionVars[key] = value
    if (!scriptMode) {
      console.log(`✅ Including production variable: ${key}`)
    }
  }

  return productionVars
}

/**
 * Update wrangler.jsonc config file with environment variables
 */
async function updateWranglerConfig(key: string, value: string): Promise<void> {
  const configPath = join(process.cwd(), "wrangler.jsonc")

  if (!existsSync(configPath)) {
    throw new Error("wrangler.jsonc not found")
  }

  const configContent = readFileSync(configPath, "utf-8")
  const config = JSON.parse(configContent)

  // Initialize vars section if it doesn't exist
  if (!config.vars) {
    config.vars = {}
  }

  // Set the environment variable
  config.vars[key] = value

  // Write back to file with proper formatting
  const updatedContent = JSON.stringify(config, null, 2)
  writeFileSync(configPath, updatedContent, "utf-8")
}

/**
 * Deploy a single environment variable using wrangler
 */
async function deployVariable(
  key: string,
  value: string,
  scriptMode = false,
  useLocal = false,
  dryRun = false
): Promise<boolean> {
  try {
    // Determine if this should be a secret or environment variable
    const isSecret = ["CLOUDFLARE_API_TOKEN", "API_JWT_SECRET"].includes(key)
    const target = useLocal ? "local" : "remote"
    const varType = isSecret ? "secret" : "wrangler config variable"

    if (!scriptMode) {
      console.log(`🚀 Deploying ${varType} to ${target}${dryRun ? " [DRY RUN]" : ""}: ${key}`)
    }

    if (dryRun) {
      if (!scriptMode) {
        if (isSecret) {
          console.log(`📋 Would deploy: ${key} = [${value.length} characters] as ${varType}`)
        } else {
          console.log(`📋 Would update wrangler.jsonc vars section: ${key} = ${value}`)
        }
      }
      return true
    }

    if (isSecret) {
      // Deploy as secret via stdin
      const wranglerArgs = ["bun", "run", "wrangler", "secret", "put", key]
      // Note: wrangler secret put doesn't support --local or --remote flags

      const process = spawn(wranglerArgs, {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe"
      })

      // Send the secret value via STDIN
      process.stdin?.write(value)
      process.stdin?.end()

      const result = await process.exited

      if (result === 0) {
        if (!scriptMode) {
          console.log(`✅ Successfully deployed: ${key}`)
        }
        return true
      }
      if (!scriptMode) {
        // Capture stderr for debugging
        const stderr = await new Response(process.stderr).text()
        console.error(`❌ Failed to deploy: ${key}`)
        if (stderr.trim()) {
          console.error(`Error details: ${stderr.trim()}`)
        }
      }
      return false
    }
    // For non-secrets, update wrangler.jsonc config file
    if (!scriptMode) {
      console.log(`📝 Updating wrangler.jsonc with environment variable: ${key}`)
    }

    try {
      await updateWranglerConfig(key, value)
      if (!scriptMode) {
        console.log(`✅ Successfully updated config: ${key}`)
      }
      return true
    } catch (error) {
      if (!scriptMode) {
        /* trunk-ignore(semgrep/javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring) */
        console.error(`❌ Failed to update config: ${key}`, error)
      }
      return false
    }
  } catch (error) {
    if (!scriptMode) {
      console.error("❌ Error deploying variable:", key, error)
    }
    return false
  }
}

const program = new Command()

program
  .name("env")
  .description("Deploy Environment Variables to Cloudflare Workers")
  .version("1.0.0")
  .option("--script", "Enable script mode (non-interactive, structured output)")
  .option("--env-file <path>", "Path to environment file", ".env")
  .option("--local", "Deploy to local wrangler dev environment")
  .option("--remote", "Deploy to remote production environment [default]")
  .option("-d, --dry-run", "Show what would be deployed without making changes")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

// Check if local mode is enabled
function isLocalMode(): boolean {
  return program.opts().local || false
}

/**
 * Main deployment function
 */
async function deployEnvironment(
  envFilePath: string,
  scriptMode: boolean,
  useLocal: boolean,
  dryRun = false
): Promise<void> {
  try {
    if (!scriptMode) {
      console.log(`🔧 Starting environment deployment${dryRun ? " [DRY RUN]" : ""}...`)
      console.log(`📂 Reading environment from: ${envFilePath}`)
    }

    // Parse and validate environment
    const envVars = parseEnvFile(envFilePath)
    validateEnvironment(envVars)

    // Filter for production variables
    const productionVars = filterProductionVars(envVars, scriptMode)

    if (Object.keys(productionVars).length === 0) {
      if (scriptMode) {
        const output = {
          success: true,
          message: "No production variables to deploy",
          deployed: 0,
          total: 0,
          dryRun
        }
        console.log(JSON.stringify(output, null, 2))
      } else {
        console.log("⚠️  No production variables to deploy")
      }
      return
    }

    if (!scriptMode) {
      console.log(`📦 ${dryRun ? "Would deploy" : "Deploying"} ${Object.keys(productionVars).length} variables...`)
    }

    // Deploy each variable
    const results = await Promise.all(
      Object.entries(productionVars).map(([key, value]) => deployVariable(key, value, scriptMode, useLocal, dryRun))
    )

    const successCount = results.filter(Boolean).length
    const totalCount = results.length

    if (scriptMode) {
      const output = {
        success: successCount === totalCount,
        deployed: dryRun ? 0 : successCount,
        total: totalCount,
        variables: Object.keys(productionVars),
        dryRun
      }
      console.log(JSON.stringify(output, null, 2))
    } else if (dryRun) {
      console.log(`📋 Would deploy ${totalCount} variables successfully`)
    } else {
      if (successCount === totalCount) {
        console.log(`🎉 Successfully deployed all ${totalCount} variables!`)
      } else {
        console.error(`❌ Deployed ${successCount}/${totalCount} variables. Some deployments failed.`)
      }
    }

    process.exit(successCount === totalCount ? 0 : 1)
  } catch (error) {
    if (scriptMode) {
      const output = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        dryRun
      }
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.error("💥 Deployment failed:", error instanceof Error ? error.message : error)
    }
    process.exit(1)
  }
}

// CLI action
program.action(async (options) => {
  const envFilePath = join(process.cwd(), options.envFile)
  const scriptMode = isScriptMode()
  const useLocal = isLocalMode()
  await deployEnvironment(envFilePath, scriptMode, useLocal, options.dryRun)
})

async function main(): Promise<void> {
  await program.parseAsync()
}

// Run the deployment
if (import.meta.main) {
  main()
}
