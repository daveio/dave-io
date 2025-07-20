#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { Command } from "commander"
import readlineSync from "readline-sync"

interface ParsedSecret {
  value: string
  line: number
}

interface CloudflareSecret {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

interface SecretsSyncConfig {
  apiToken: string
  accountId: string
  storeId: string
}

const program = new Command()

program.name("secrets").description("Sync secrets from .env to Cloudflare Secrets Store").version("1.0.0")

/**
 * Validate required environment variables
 * Prefer reading from .env file directly to avoid conflicts with system env vars
 */
function validateEnvironment(envPath: string = ".env"): SecretsSyncConfig {
  // Try to read from .env file first to avoid conflicts with system env vars
  let apiToken = process.env.CLOUDFLARE_API_TOKEN
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  let storeId = process.env.CLOUDFLARE_SECRET_STORE_ID

  // If .env exists, prefer values from there
  const resolvedEnvPath = resolve(envPath)
  if (existsSync(resolvedEnvPath)) {
    const content = readFileSync(resolvedEnvPath, "utf-8")
    const lines = content.split("\n")

    lines.forEach((line) => {
      if (line.trim() && !line.trim().startsWith("#")) {
        const match = line.match(/^([A-Z_]+)="(.+)"/)
        if (match) {
          const [, key, value] = match
          if (key === "CLOUDFLARE_API_TOKEN") apiToken = value
          if (key === "CLOUDFLARE_ACCOUNT_ID") accountId = value
          if (key === "CLOUDFLARE_SECRET_STORE_ID") storeId = value
        }
      }
    })
  }

  const missing: string[] = []
  if (!apiToken) missing.push("CLOUDFLARE_API_TOKEN")
  if (!accountId) missing.push("CLOUDFLARE_ACCOUNT_ID")
  if (!storeId) missing.push("CLOUDFLARE_SECRET_STORE_ID")

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:")
    missing.forEach((v) => console.error(`   - ${v}`))
    console.error("\n💡 Add these to your .env file")
    process.exit(1)
  }

  return {
    apiToken: apiToken as string,
    accountId: accountId as string,
    storeId: storeId as string
  }
}

/**
 * Parse .env file and extract secrets (lines with # secret comment)
 */
function parseEnvFile(filePath: string): Map<string, ParsedSecret> {
  const secrets = new Map<string, ParsedSecret>()

  if (!existsSync(filePath)) {
    console.log(`📝 No .env file found at ${filePath} - skipping secrets sync`)
    process.exit(0)
  }

  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return

    // Skip pure comment lines (lines that start with #)
    if (line.trim().startsWith("#")) return

    // Check if line has # secret comment
    if (line.includes("# secret")) {
      // Extract the assignment part before the comment
      const [assignment] = line.split("#")

      // Match KEY="value" pattern
      const match = assignment.match(/^([A-Z_]+)="(.+)"/)
      if (match) {
        const [, key, value] = match
        secrets.set(key, { value, line: index + 1 })
      } else {
        console.warn(`⚠️  Line ${index + 1}: Invalid format (expected KEY="value" # secret)`)
      }
    }
  })

  return secrets
}

/**
 * Create Cloudflare API client (not used for direct API calls)
 */
async function createCloudflareClient(apiToken: string): Promise<{ apiToken: string }> {
  // For direct API calls, we just need the token
  return { apiToken }
}

/**
 * List all secrets in Cloudflare Secrets Store with retry logic
 */
async function listSecrets(
  client: { apiToken: string },
  accountId: string,
  storeId: string
): Promise<CloudflareSecret[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Using the Cloudflare API directly
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/secrets_store/stores/${storeId}/secrets`,
        {
          headers: {
            Authorization: `Bearer ${client.apiToken}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${errorText}`

        // Parse error if it's JSON
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = `${errorData.errors[0].code}: ${errorData.errors[0].message}`
          }
        } catch {}

        throw new Error(errorMessage)
      }

      const data = (await response.json()) as { result: CloudflareSecret[] }
      return data.result || []
    } catch (error) {
      lastError = error as Error

      // If it's an authentication error, don't retry
      if (lastError.message.includes("10000") || lastError.message.includes("Authentication")) {
        console.error("❌ Authentication error - check your CLOUDFLARE_API_TOKEN")
        throw lastError
      }

      // If we haven't exhausted retries, wait and try again
      if (attempt < maxRetries) {
        console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${attempt}s...`)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  console.error(`❌ Failed to list secrets after ${maxRetries} attempts:`, lastError)
  throw lastError || new Error("Unknown error")
}

/**
 * Create a new secret in Cloudflare Secrets Store
 */
async function createSecret(
  client: { apiToken: string },
  accountId: string,
  storeId: string,
  name: string,
  value: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/secrets_store/stores/${storeId}/secrets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${client.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          {
            name,
            value,
            scopes: ["workers"],
            comment: "Synced from .env"
          }
        ])
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create secret ${name}: ${error}`)
    }
  } catch (error) {
    console.error(`❌ Failed to create secret ${name}:`, error)
    throw error
  }
}

/**
 * Update an existing secret in Cloudflare Secrets Store
 */
async function updateSecret(
  client: { apiToken: string },
  accountId: string,
  storeId: string,
  secretId: string,
  name: string,
  value: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/secrets_store/stores/${storeId}/secrets/${secretId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${client.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value,
          comment: "Synced from .env"
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update secret ${name}: ${error}`)
    }
  } catch (error) {
    console.error(`❌ Failed to update secret ${name}:`, error)
    throw error
  }
}

/**
 * Display sync plan with hierarchical output
 */
function displaySyncPlan(
  localSecrets: Map<string, ParsedSecret>,
  remoteSecrets: CloudflareSecret[],
  dryRun: boolean
): { toCreate: string[]; toUpdate: Array<{ name: string; id: string }> } {
  console.log("\n🔐 Syncing secrets to Cloudflare Secrets Store")
  console.log(`├── 📋 Found ${localSecrets.size} secrets in .env`)
  console.log("├── 🔍 Checking Cloudflare Secrets Store...")

  const remoteMap = new Map(remoteSecrets.map((s) => [s.name, s]))
  const toCreate: string[] = []
  const toUpdate: Array<{ name: string; id: string }> = []

  localSecrets.forEach((secret, name) => {
    const remote = remoteMap.get(name)
    if (remote) {
      console.log(`│   ├── ✅ ${name} (exists)`)
      toUpdate.push({ name, id: remote.id })
    } else {
      console.log(`│   ├── ❌ ${name} (missing)`)
      toCreate.push(name)
    }
  })

  if (dryRun) {
    console.log("└── 🚫 Dry run mode - no changes will be made\n")
  } else {
    console.log("└── 📤 Syncing secrets...\n")
  }

  return { toCreate, toUpdate }
}

/**
 * Sync command implementation
 */
async function syncCommand(options: { dryRun?: boolean; force?: boolean; env: string; debug?: boolean }) {
  const envPath = resolve(options.env)
  const config = validateEnvironment(envPath)

  if (options.debug) {
    console.log("🔍 Debug mode enabled")
    console.log(`   API Token (first 10 chars): ${config.apiToken.substring(0, 10)}...`)
    console.log(`   Account ID: ${config.accountId}`)
    console.log(`   Store ID: ${config.storeId}`)
    console.log(`   Bun version: ${process.versions.bun}`)
    console.log()
  }

  console.log(`📄 Reading secrets from: ${envPath}`)
  const localSecrets = parseEnvFile(envPath)

  if (localSecrets.size === 0) {
    console.log("⚠️  No secrets found in .env file (looking for lines with '# secret' comment)")
    return
  }

  const client = await createCloudflareClient(config.apiToken)
  const remoteSecrets = await listSecrets(client, config.accountId, config.storeId)

  const { toCreate, toUpdate } = displaySyncPlan(localSecrets, remoteSecrets, options.dryRun || false)

  if (options.dryRun) {
    console.log("📊 Summary (dry run):")
    console.log(`   - ${toCreate.length} secrets to create`)
    console.log(`   - ${toUpdate.length} secrets to update`)
    return
  }

  // Create new secrets
  for (const name of toCreate) {
    const secret = localSecrets.get(name)!
    console.log(`   ├── 🆕 Creating ${name}...`)
    try {
      await createSecret(client, config.accountId, config.storeId, name, secret.value)
      console.log(`   │   └── ✅ Created`)
    } catch (error) {
      console.log(`   │   └── ❌ Failed`)
    }
  }

  // Update existing secrets
  if (toUpdate.length > 0 && !options.force) {
    const proceed = readlineSync.keyInYN(`\n⚠️  Update ${toUpdate.length} existing secrets?`)
    if (!proceed) {
      console.log("❌ Update cancelled")
      return
    }
  }

  for (const { name, id } of toUpdate) {
    const secret = localSecrets.get(name)!
    console.log(`   ├── 🔄 Updating ${name}...`)
    try {
      await updateSecret(client, config.accountId, config.storeId, id, name, secret.value)
      console.log(`   │   └── ✅ Updated`)
    } catch (error) {
      console.log(`   │   └── ❌ Failed`)
    }
  }

  console.log("\n✅ Sync complete!")
  console.log(`   - ${toCreate.length} secrets created`)
  console.log(`   - ${toUpdate.length} secrets updated`)
}

/**
 * List command implementation
 */
async function listCommand(options: { debug?: boolean }) {
  const config = validateEnvironment()

  if (options.debug) {
    console.log("🔍 Debug mode enabled")
    console.log(`   API Token (first 10 chars): ${config.apiToken.substring(0, 10)}...`)
    console.log(`   Account ID: ${config.accountId}`)
    console.log(`   Store ID: ${config.storeId}`)
    console.log(`   Bun version: ${process.versions.bun}`)
    console.log()
  }

  const client = await createCloudflareClient(config.apiToken)

  console.log("🔐 Listing secrets in Cloudflare Secrets Store...")
  const secrets = await listSecrets(client, config.accountId, config.storeId)

  if (secrets.length === 0) {
    console.log("📭 No secrets found")
    return
  }

  console.log(`\n📋 Found ${secrets.length} secrets:`)
  secrets.forEach((secret) => {
    console.log(`   - ${secret.name}`)
  })
}

/**
 * Validate command implementation
 */
async function validateCommand(options: { env: string }) {
  const envPath = resolve(options.env)
  const config = validateEnvironment(envPath)

  console.log(`📄 Reading secrets from: ${envPath}`)
  const localSecrets = parseEnvFile(envPath)

  if (localSecrets.size === 0) {
    console.log("⚠️  No secrets found in .env file (looking for lines with '# secret' comment)")
    return
  }

  const client = await createCloudflareClient(config.apiToken)
  const remoteSecrets = await listSecrets(client, config.accountId, config.storeId)

  console.log("\n🔍 Validation Results:")
  console.log(`├── 📋 Local secrets: ${localSecrets.size}`)
  console.log(`├── ☁️  Remote secrets: ${remoteSecrets.length}`)

  const remoteNames = new Set(remoteSecrets.map((s) => s.name))
  const missing: string[] = []
  const extra: string[] = []

  // Check for missing secrets
  localSecrets.forEach((_, name) => {
    if (!remoteNames.has(name)) {
      missing.push(name)
    }
  })

  // Check for extra secrets
  remoteSecrets.forEach((secret) => {
    if (!localSecrets.has(secret.name)) {
      extra.push(secret.name)
    }
  })

  if (missing.length > 0) {
    console.log("├── ❌ Missing in Cloudflare:")
    missing.forEach((name) => {
      console.log(`│   └── ${name}`)
    })
  }

  if (extra.length > 0) {
    console.log("├── ⚠️  Extra in Cloudflare (not in .env):")
    extra.forEach((name) => {
      console.log(`│   └── ${name}`)
    })
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log("└── ✅ All secrets are in sync!")
  } else {
    console.log(`└── 📊 Summary: ${missing.length} missing, ${extra.length} extra`)
  }
}

// Define commands
program
  .command("sync")
  .description("Sync all secrets from .env to Cloudflare Secrets Store")
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Update existing secrets without confirmation")
  .option("--env <path>", "Custom .env file path", ".env")
  .option("--debug", "Show debug information")
  .action(syncCommand)

program
  .command("list")
  .description("List all secrets in Cloudflare Secrets Store")
  .option("--debug", "Show debug information")
  .action(listCommand)

program
  .command("validate")
  .description("Check which secrets need syncing")
  .option("--env <path>", "Custom .env file path", ".env")
  .action(validateCommand)

// Parse command line arguments
program.parse()
