#!/usr/bin/env bun
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { Command } from "commander"
import readlineSync from "readline-sync"
import { parse as parseJsonc } from "jsonc-parser"

interface ParsedSecret {
  value: string
  line: number
  type: "secret" | "local_secret"
}

interface CloudflareSecret {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

interface WorkerSecret {
  name: string
  type: string
}

interface SecretsSyncConfig {
  apiToken: string
  accountId: string
  storeId: string
  workerName?: string
}

const program = new Command()

program
  .name("secrets")
  .description("Sync secrets from .env to Cloudflare Secrets Store and Worker environment variables")
  .version("1.0.0")

/**
 * Read Worker name from wrangler.jsonc configuration
 */
function getWorkerName(): string | undefined {
  const wranglerPath = resolve("wrangler.jsonc")

  if (!existsSync(wranglerPath)) {
    console.warn("⚠️  No wrangler.jsonc found - Worker secrets will be skipped")
    return undefined
  }

  try {
    const content = readFileSync(wranglerPath, "utf-8")
    const config = parseJsonc(content)

    if (!config || typeof config !== "object" || !("name" in config)) {
      console.warn("⚠️  No 'name' field found in wrangler.jsonc - Worker secrets will be skipped")
      return undefined
    }

    const { name } = config
    if (typeof name !== "string") {
      console.warn("⚠️  'name' field in wrangler.jsonc is not a string - Worker secrets will be skipped")
      return undefined
    }

    return name
  } catch (error) {
    console.warn(`⚠️  Error reading wrangler.jsonc: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}

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

  // If .env doesn't exist, exit gracefully
  if (!existsSync(resolvedEnvPath)) {
    console.log("No .env file found - skipping secrets sync")
    process.exit(0)
  }

  if (existsSync(resolvedEnvPath)) {
    const content = readFileSync(resolvedEnvPath, "utf-8")
    const lines = content.split("\n")

    lines.forEach((line) => {
      if (line.trim() && !line.trim().startsWith("#")) {
        const match = line.match(/^([A-Z_]+)="(.+)"/)
        if (match) {
          const [, key, value] = match
          if (key === "CLOUDFLARE_API_TOKEN") {
            apiToken = value
          }
          if (key === "CLOUDFLARE_ACCOUNT_ID") {
            accountId = value
          }
          if (key === "CLOUDFLARE_SECRET_STORE_ID") {
            storeId = value
          }
        }
      }
    })
  }

  const missing: string[] = []
  if (!apiToken) {
    missing.push("CLOUDFLARE_API_TOKEN")
  }
  if (!accountId) {
    missing.push("CLOUDFLARE_ACCOUNT_ID")
  }
  if (!storeId) {
    missing.push("CLOUDFLARE_SECRET_STORE_ID")
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:")
    missing.forEach((v) => console.error(`   - ${v}`))
    console.error("\n💡 Add these to your .env file")
    process.exit(1)
  }

  return {
    apiToken: apiToken as string,
    accountId: accountId as string,
    storeId: storeId as string,
    workerName: getWorkerName()
  }
}

/**
 * Parse .env file and extract secrets (lines with # secret or # local secret comment)
 */
function parseEnvFile(filePath: string): {
  storeSecrets: Map<string, ParsedSecret>
  workerSecrets: Map<string, ParsedSecret>
} {
  const storeSecrets = new Map<string, ParsedSecret>()
  const workerSecrets = new Map<string, ParsedSecret>()

  if (!existsSync(filePath)) {
    console.log(`📝 No .env file found at ${filePath} - skipping secrets sync`)
    process.exit(0)
  }

  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) {
      return
    }

    // Skip pure comment lines (lines that start with #)
    if (line.trim().startsWith("#")) {
      return
    }

    // Check if line has # local secret comment
    if (line.includes("# local secret")) {
      // Extract the assignment part before the comment
      const [assignment] = line.split("#")

      // Match KEY="value" pattern
      const match = assignment.match(/^([A-Z_]+)="(.+)"/)
      if (match) {
        const [, key, value] = match
        workerSecrets.set(key, { value, line: index + 1, type: "local_secret" })
      } else {
        console.warn(`⚠️  Line ${index + 1}: Invalid format (expected KEY="value" # local secret)`)
      }
    }
    // Check if line has # secret comment (for Secrets Store)
    else if (line.includes("# secret")) {
      // Extract the assignment part before the comment
      const [assignment] = line.split("#")

      // Match KEY="value" pattern
      const match = assignment.match(/^([A-Z_]+)="(.+)"/)
      if (match) {
        const [, key, value] = match
        storeSecrets.set(key, { value, line: index + 1, type: "secret" })
      } else {
        console.warn(`⚠️  Line ${index + 1}: Invalid format (expected KEY="value" # secret)`)
      }
    }
  })

  return { storeSecrets, workerSecrets }
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
        } catch {
          // Ignore JSON parsing errors
        }

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

  console.error(`❌ Failed to list secrets after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`)
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
    console.error(`❌ Failed to create secret ${name}: ${error instanceof Error ? error.message : String(error)}`)
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
    console.error(`❌ Failed to update secret ${name}: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

/**
 * List all secrets for a Worker
 */
async function listWorkerSecrets(
  client: { apiToken: string },
  accountId: string,
  workerName: string
): Promise<WorkerSecret[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/secrets`,
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

        try {
          const errorData = JSON.parse(errorText)
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = `${errorData.errors[0].code}: ${errorData.errors[0].message}`
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(errorMessage)
      }

      const data = (await response.json()) as { result: WorkerSecret[] }
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

  console.error(
    `❌ Failed to list worker secrets after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  )
  throw lastError || new Error("Unknown error")
}

/**
 * Create or update a Worker secret
 */
async function createOrUpdateWorkerSecret(
  client: { apiToken: string },
  accountId: string,
  workerName: string,
  name: string,
  value: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/secrets`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${client.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          text: value,
          type: "secret_text"
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create/update worker secret ${name}: ${error}`)
    }
  } catch (error) {
    // Check for specific Cloudflare API errors
    if (error instanceof Error && error.message.includes('"code": 10215')) {
      console.error(`❌ Failed to update Worker secret ${name}:`)
      console.error("   🚨 Worker must be deployed before secrets can be updated via API")
      console.error("   💡 To fix this, run one of these commands:")
      console.error("      • bun run wrangler deploy  (deploy current version)")
      console.error("      • bun run wrangler publish (legacy deploy command)")
      console.error("   ℹ️  After deployment, re-run the secrets sync command")
      throw new Error(`Worker deployment required before updating secrets`)
    }

    console.error(
      `❌ Failed to create/update worker secret ${name}: ${error instanceof Error ? error.message : String(error)}`
    )
    throw error
  }
}

/**
 * Display sync plan with hierarchical output
 */
function displaySyncPlan(
  storeSecrets: Map<string, ParsedSecret>,
  workerSecrets: Map<string, ParsedSecret>,
  remoteStoreSecrets: CloudflareSecret[],
  remoteWorkerSecrets: WorkerSecret[],
  workerName: string | undefined,
  dryRun: boolean
): {
  storeToCreate: string[]
  storeToUpdate: Array<{ name: string; id: string }>
  workerToSync: string[]
} {
  console.log("\n🔐 Syncing secrets to Cloudflare")

  // Secrets Store sync plan
  const remoteStoreMap = new Map(remoteStoreSecrets.map((s) => [s.name, s]))
  const storeToCreate: string[] = []
  const storeToUpdate: Array<{ name: string; id: string }> = []

  if (storeSecrets.size > 0) {
    console.log(`├── 📦 Secrets Store: ${storeSecrets.size} secrets found`)
    console.log("│   └── 🔍 Checking remote secrets...")

    storeSecrets.forEach((secret, name) => {
      const remote = remoteStoreMap.get(name)
      if (remote) {
        console.log(`│       ├── ✅ ${name} (exists)`)
        storeToUpdate.push({ name, id: remote.id })
      } else {
        console.log(`│       ├── ❌ ${name} (missing)`)
        storeToCreate.push(name)
      }
    })
  }

  // Worker secrets sync plan
  const remoteWorkerMap = new Map(remoteWorkerSecrets.map((s) => [s.name, s]))
  const workerToSync: string[] = []

  if (workerSecrets.size > 0) {
    if (workerName) {
      console.log(`├── ⚡ Worker (${workerName}): ${workerSecrets.size} local secrets found`)
      console.log("│   └── 🔍 Checking remote worker secrets...")

      workerSecrets.forEach((secret, name) => {
        const remote = remoteWorkerMap.get(name)
        if (remote) {
          console.log(`│       ├── 🔄 ${name} (will update)`)
        } else {
          console.log(`│       ├── 🆕 ${name} (will create)`)
        }
        workerToSync.push(name)
      })
    } else {
      console.log(`├── ⚡ Worker secrets: ${workerSecrets.size} found but no Worker name configured`)
      console.log("│   └── ⚠️  Skipping Worker secrets (add 'name' to wrangler.jsonc)")
    }
  }

  if (dryRun) {
    console.log("└── 🚫 Dry run mode - no changes will be made\n")
  } else {
    console.log("└── 📤 Syncing secrets...\n")
  }

  return { storeToCreate, storeToUpdate, workerToSync }
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
    console.log(`   Worker Name: ${config.workerName || "Not configured"}`)
    console.log(`   Bun version: ${process.versions.bun}`)
    console.log()
  }

  console.log(`📄 Reading secrets from: ${envPath}`)
  const { storeSecrets, workerSecrets } = parseEnvFile(envPath)

  if (storeSecrets.size === 0 && workerSecrets.size === 0) {
    console.log("⚠️  No secrets found in .env file (looking for lines with '# secret' or '# local secret' comments)")
    return
  }

  const client = await createCloudflareClient(config.apiToken)

  // Fetch remote secrets
  const remoteStoreSecrets = storeSecrets.size > 0 ? await listSecrets(client, config.accountId, config.storeId) : []
  const remoteWorkerSecrets =
    workerSecrets.size > 0 && config.workerName
      ? await listWorkerSecrets(client, config.accountId, config.workerName)
      : []

  const { storeToCreate, storeToUpdate, workerToSync } = displaySyncPlan(
    storeSecrets,
    workerSecrets,
    remoteStoreSecrets,
    remoteWorkerSecrets,
    config.workerName,
    options.dryRun || false
  )

  if (options.dryRun) {
    console.log("📊 Summary (dry run):")
    console.log(`   - ${storeToCreate.length} secrets to create in Secrets Store`)
    console.log(`   - ${storeToUpdate.length} secrets to update in Secrets Store`)
    console.log(`   - ${workerToSync.length} secrets to sync to Worker`)
    return
  }

  let totalStoreCreated = 0
  let totalStoreUpdated = 0
  let totalWorkerSynced = 0

  // Create new secrets in Secrets Store
  for (const name of storeToCreate) {
    const secret = storeSecrets.get(name)!
    console.log(`   ├── 🆕 Creating Secrets Store secret ${name}...`)
    try {
      await createSecret(client, config.accountId, config.storeId, name, secret.value)
      console.log(`   │   └── ✅ Created`)
      totalStoreCreated++
    } catch (error) {
      console.log(`   │   └── ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Update existing secrets in Secrets Store
  if (storeToUpdate.length > 0 && !options.force) {
    const proceed = readlineSync.keyInYN(`\n⚠️  Update ${storeToUpdate.length} existing Secrets Store secrets?`)
    if (!proceed) {
      console.log("❌ Secrets Store update cancelled")
    } else {
      for (const { name, id } of storeToUpdate) {
        const secret = storeSecrets.get(name)!
        console.log(`   ├── 🔄 Updating Secrets Store secret ${name}...`)
        try {
          await updateSecret(client, config.accountId, config.storeId, id, name, secret.value)
          console.log(`   │   └── ✅ Updated`)
          totalStoreUpdated++
        } catch (error) {
          console.log(`   │   └── ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  } else if (storeToUpdate.length > 0 && options.force) {
    for (const { name, id } of storeToUpdate) {
      const secret = storeSecrets.get(name)!
      console.log(`   ├── 🔄 Updating Secrets Store secret ${name}...`)
      try {
        await updateSecret(client, config.accountId, config.storeId, id, name, secret.value)
        console.log(`   │   └── ✅ Updated`)
        totalStoreUpdated++
      } catch (error) {
        console.log(`   │   └── ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  // Sync Worker secrets
  if (workerToSync.length > 0 && config.workerName) {
    if (!options.force) {
      const proceed = readlineSync.keyInYN(`\n⚠️  Sync ${workerToSync.length} secrets to Worker?`)
      if (!proceed) {
        console.log("❌ Worker secrets sync cancelled")
      } else {
        for (const name of workerToSync) {
          const secret = workerSecrets.get(name)!
          console.log(`   ├── ⚡ Syncing Worker secret ${name}...`)
          try {
            await createOrUpdateWorkerSecret(client, config.accountId, config.workerName, name, secret.value)
            console.log(`   │   └── ✅ Synced`)
            totalWorkerSynced++
          } catch (error) {
            console.log(`   │   └── ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
    } else {
      for (const name of workerToSync) {
        const secret = workerSecrets.get(name)!
        console.log(`   ├── ⚡ Syncing Worker secret ${name}...`)
        try {
          await createOrUpdateWorkerSecret(client, config.accountId, config.workerName, name, secret.value)
          console.log(`   │   └── ✅ Synced`)
          totalWorkerSynced++
        } catch (error) {
          console.log(`   │   └── ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
  }

  console.log("\n✅ Sync complete!")
  if (totalStoreCreated > 0 || totalStoreUpdated > 0) {
    console.log(`   📦 Secrets Store: ${totalStoreCreated} created, ${totalStoreUpdated} updated`)
  }
  if (totalWorkerSynced > 0) {
    console.log(`   ⚡ Worker: ${totalWorkerSynced} secrets synced`)
  }
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
    console.log(`   Worker Name: ${config.workerName || "Not configured"}`)
    console.log(`   Bun version: ${process.versions.bun}`)
    console.log()
  }

  const client = await createCloudflareClient(config.apiToken)

  console.log("🔐 Listing secrets in Cloudflare...")

  // List Secrets Store secrets
  console.log("\n📦 Secrets Store:")
  try {
    const storeSecrets = await listSecrets(client, config.accountId, config.storeId)
    if (storeSecrets.length === 0) {
      console.log("   📭 No secrets found")
    } else {
      console.log(`   📋 Found ${storeSecrets.length} secrets:`)
      storeSecrets.forEach((secret) => {
        console.log(`      - ${secret.name}`)
      })
    }
  } catch (error) {
    console.log(`   ❌ Failed to list Secrets Store: ${error instanceof Error ? error.message : String(error)}`)
  }

  // List Worker secrets
  console.log("\n⚡ Worker Secrets:")
  if (!config.workerName) {
    console.log("   ⚠️  No Worker name configured (add 'name' to wrangler.jsonc)")
  } else {
    try {
      const workerSecrets = await listWorkerSecrets(client, config.accountId, config.workerName)
      if (workerSecrets.length === 0) {
        console.log("   📭 No secrets found")
      } else {
        console.log(`   📋 Found ${workerSecrets.length} secrets:`)
        workerSecrets.forEach((secret) => {
          console.log(`      - ${secret.name} (${secret.type})`)
        })
      }
    } catch (error) {
      console.log(`   ❌ Failed to list Worker secrets: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Validate command implementation
 */
async function validateCommand(options: { env: string }) {
  const envPath = resolve(options.env)
  const config = validateEnvironment(envPath)

  console.log(`📄 Reading secrets from: ${envPath}`)
  const { storeSecrets, workerSecrets } = parseEnvFile(envPath)

  if (storeSecrets.size === 0 && workerSecrets.size === 0) {
    console.log("⚠️  No secrets found in .env file (looking for lines with '# secret' or '# local secret' comments)")
    return
  }

  const client = await createCloudflareClient(config.apiToken)

  console.log("\n🔍 Validation Results:")

  // Validate Secrets Store
  if (storeSecrets.size > 0) {
    console.log(`\n📦 Secrets Store Validation:`)
    console.log(`├── 📋 Local secrets: ${storeSecrets.size}`)

    try {
      const remoteStoreSecrets = await listSecrets(client, config.accountId, config.storeId)
      console.log(`├── ☁️  Remote secrets: ${remoteStoreSecrets.length}`)

      const remoteStoreNames = new Set(remoteStoreSecrets.map((s) => s.name))
      const storeMissing: string[] = []
      const storeExtra: string[] = []

      // Check for missing secrets
      storeSecrets.forEach((_, name) => {
        if (!remoteStoreNames.has(name)) {
          storeMissing.push(name)
        }
      })

      // Check for extra secrets
      remoteStoreSecrets.forEach((secret) => {
        if (!storeSecrets.has(secret.name)) {
          storeExtra.push(secret.name)
        }
      })

      if (storeMissing.length > 0) {
        console.log("├── ❌ Missing in Secrets Store:")
        storeMissing.forEach((name) => {
          console.log(`│   └── ${name}`)
        })
      }

      if (storeExtra.length > 0) {
        console.log("├── ⚠️  Extra in Secrets Store (not in .env):")
        storeExtra.forEach((name) => {
          console.log(`│   └── ${name}`)
        })
      }

      if (storeMissing.length === 0 && storeExtra.length === 0) {
        console.log("└── ✅ Secrets Store is in sync!")
      } else {
        console.log(`└── 📊 Secrets Store Summary: ${storeMissing.length} missing, ${storeExtra.length} extra`)
      }
    } catch (error) {
      console.log(`└── ❌ Failed to validate Secrets Store: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Validate Worker secrets
  if (workerSecrets.size > 0) {
    console.log(`\n⚡ Worker Secrets Validation:`)
    console.log(`├── 📋 Local worker secrets: ${workerSecrets.size}`)

    if (!config.workerName) {
      console.log("└── ⚠️  No Worker name configured (add 'name' to wrangler.jsonc)")
    } else {
      try {
        const remoteWorkerSecrets = await listWorkerSecrets(client, config.accountId, config.workerName)
        console.log(`├── ☁️  Remote worker secrets: ${remoteWorkerSecrets.length}`)

        const remoteWorkerNames = new Set(remoteWorkerSecrets.map((s) => s.name))
        const workerMissing: string[] = []
        const workerExtra: string[] = []

        // Check for missing secrets
        workerSecrets.forEach((_, name) => {
          if (!remoteWorkerNames.has(name)) {
            workerMissing.push(name)
          }
        })

        // Check for extra secrets
        remoteWorkerSecrets.forEach((secret) => {
          if (!workerSecrets.has(secret.name)) {
            workerExtra.push(secret.name)
          }
        })

        if (workerMissing.length > 0) {
          console.log("├── ❌ Missing in Worker:")
          workerMissing.forEach((name) => {
            console.log(`│   └── ${name}`)
          })
        }

        if (workerExtra.length > 0) {
          console.log("├── ⚠️  Extra in Worker (not in .env):")
          workerExtra.forEach((name) => {
            console.log(`│   └── ${name}`)
          })
        }

        if (workerMissing.length === 0 && workerExtra.length === 0) {
          console.log("└── ✅ Worker secrets are in sync!")
        } else {
          console.log(`└── 📊 Worker Summary: ${workerMissing.length} missing, ${workerExtra.length} extra`)
        }
      } catch (error) {
        console.log(
          `└── ❌ Failed to validate Worker secrets: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }
}

// Define commands
program
  .command("sync")
  .description(
    "Sync secrets from .env to Cloudflare Secrets Store and Worker (supports both '# secret' and '# local secret' comments). Note: Worker must be deployed before updating Worker secrets."
  )
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Update existing secrets without confirmation")
  .option("--env <path>", "Custom .env file path", ".env")
  .option("--debug", "Show debug information")
  .action(syncCommand)

program
  .command("list")
  .description("List all secrets in Cloudflare Secrets Store and Worker")
  .option("--debug", "Show debug information")
  .action(listCommand)

program
  .command("validate")
  .description("Check which secrets need syncing for both Secrets Store and Worker")
  .option("--env <path>", "Custom .env file path", ".env")
  .action(validateCommand)

// Parse command line arguments
program.parse()
