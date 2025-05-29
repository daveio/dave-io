#!/usr/bin/env bun

/**
 * KV Admin - Backup, restore, and manage utility for Cloudflare KV storage
 *
 * Usage:
 *   bun run bin/kv backup             - Backup KV data matching configured patterns to _backup/kv-$TIMESTAMP.json
 *   bun run bin/kv backup --all       - Backup all KV data to _backup/kv-$TIMESTAMP.json
 *   bun run bin/kv restore <filename> - Restore KV data from backup file
 *   bun run bin/kv wipe               - Wipe all KV data (DANGEROUS!)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { createCloudflareClient } from "./cloudflare-config"

const BACKUP_DIR = "_backup"

// Configure the key patterns to include in the backup (using regular expressions)
const BACKUP_KEY_PATTERNS = [
  /^dashboard:demo:items$/, // Exact match for "dashboard:demo:items"
  /^redirect:.*$/ // All keys starting with "redirect:"
]

// Ensure backup directory exists
function ensureBackupDirExists() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR)
    console.log(`Created ${BACKUP_DIR} directory`)
  }
}

// Get current timestamp in format YYYY-MM-DD-HHmmss
function getTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
}

// Get KV namespace ID from environment or use default
function getKVNamespaceId(): string {
  return process.env.CLOUDFLARE_KV_NAMESPACE_ID || "7ac00514fd4c4d4183851b8d7053eb53"
}

// List all KV keys
async function listAllKVKeys() {
  const { client, config } = createCloudflareClient(false, true)
  const kvNamespaceId = getKVNamespaceId()

  const allKeys: string[] = []
  let cursor: string | undefined

  do {
    const response = await client.kv.namespaces.keys.list(kvNamespaceId, {
      account_id: config.accountId,
      cursor,
      limit: 1000
    })

    allKeys.push(...response.result.map((key) => key.name))
    cursor = response.result_info?.cursor
  } while (cursor)

  return allKeys
}

// Get KV value
async function getKVValue(key: string): Promise<string | null> {
  const { client, config } = createCloudflareClient(false, true)
  const kvNamespaceId = getKVNamespaceId()

  try {
    const response = await client.kv.namespaces.values.get(kvNamespaceId, key, {
      account_id: config.accountId
    })
    return response as string
  } catch (error: unknown) {
    const errorStatus = (error as { status?: number }).status
    if (errorStatus === 404) {
      return null
    }
    throw error
  }
}

// Set KV value
async function setKVValue(key: string, value: string): Promise<void> {
  const { client, config } = createCloudflareClient(false, true)
  const kvNamespaceId = getKVNamespaceId()

  await client.kv.namespaces.values.update(kvNamespaceId, key, {
    account_id: config.accountId,
    value,
    metadata: {}
  })
}

// Delete KV key
async function deleteKVKey(key: string): Promise<void> {
  const { client, config } = createCloudflareClient(false, true)
  const kvNamespaceId = getKVNamespaceId()

  await client.kv.namespaces.values.delete(kvNamespaceId, key, {
    account_id: config.accountId
  })
}

// Check if a key matches any of the configured patterns
function keyMatchesPatterns(key: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(key))
}

// Get all KV keys with their values, filtering by patterns if specified
async function getAllKVData(backupAll = false) {
  console.log(`Fetching ${backupAll ? "all" : "selected"} keys from KV namespace...`)

  // List all keys
  const allKeys = await listAllKVKeys()

  // Filter keys if not backing up all
  const keys = backupAll ? allKeys : allKeys.filter((key) => keyMatchesPatterns(key, BACKUP_KEY_PATTERNS))

  console.log(`Found ${keys.length} keys ${!backupAll ? `matching patterns (out of ${allKeys.length} total)` : ""}`)

  const kvData: Record<string, unknown> = {}

  // Get values for each key
  for (const key of keys) {
    try {
      console.log("Fetching value for key:", key)
      const valueRaw = await getKVValue(key)

      if (valueRaw === null) {
        console.warn(`Key ${key} not found, skipping`)
        continue
      }

      // First try to parse as JSON, but be more careful about handling pure strings
      // Check if the value looks like a JSON object, array, number, boolean, or null
      const jsonPatterns = [
        /^\{.*\}$/, // Object: {...}
        /^\[.*\]$/, // Array: [...]
        /^-?\d+(\.\d+)?$/, // Number: 123 or 123.45
        /^(true|false)$/, // Boolean: true or false
        /^null$/ // null
      ]

      const looksLikeJson = jsonPatterns.some((pattern) => pattern.test(valueRaw))

      if (looksLikeJson) {
        try {
          // Try to parse it as JSON
          kvData[key] = JSON.parse(valueRaw)
        } catch {
          // If parsing fails, store as string
          kvData[key] = valueRaw
        }
      } else {
        // For values that don't look like JSON, store as plain strings
        kvData[key] = valueRaw
      }
    } catch (error) {
      console.error("Failed to get value for key:", key, error)
    }
  }

  return kvData
}

// Backup KV data to file
async function backupKV(backupAll = false) {
  ensureBackupDirExists()
  const timestamp = getTimestamp()
  const filename = `kv-${timestamp}.json`
  const filepath = resolve(BACKUP_DIR, filename)

  try {
    console.log(`Starting KV backup (${backupAll ? "all keys" : "selected keys"})...`)
    const kvData = await getAllKVData(backupAll)

    // Write to file
    writeFileSync(filepath, JSON.stringify(kvData, null, 2))
    console.log(`✅ Backup saved to ${filepath}`)
    return true
  } catch (error) {
    console.error("Failed to backup KV data:", error)
    return false
  }
}

// Restore KV data from file
async function restoreKV(filename: string) {
  try {
    const filepath = filename.startsWith("/") ? filename : resolve(BACKUP_DIR, filename)

    if (!existsSync(filepath)) {
      console.error(`File not found: ${filepath}`)
      return false
    }

    console.log(`Reading backup from ${filepath}...`)
    const fileData = readFileSync(filepath, "utf-8")
    const kvData = JSON.parse(fileData)

    console.log(`Found ${Object.keys(kvData).length} keys to restore`)

    // Confirm with user
    console.log("⚠️  WARNING: This will overwrite existing KV data with the same keys.")
    console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...")
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Put each key-value pair
    for (const [key, value] of Object.entries(kvData)) {
      console.log(`Restoring key: ${key}`)

      // Handle different value types appropriately
      let valueArg: string
      if (typeof value === "string") {
        // Use the string value directly without JSON.stringify to avoid double quotes
        valueArg = value
      } else {
        // For objects, arrays and other types, stringify them
        valueArg = JSON.stringify(value)
      }

      await setKVValue(key, valueArg)
    }

    console.log("✅ Restore completed successfully!")
    return true
  } catch (error) {
    console.error("Failed to restore KV data:", error)
    return false
  }
}

// Wipe all KV data
async function wipeKV() {
  try {
    // Get all keys first
    console.log("Fetching all keys from KV namespace...")
    const keys = await listAllKVKeys()
    console.log(`Found ${keys.length} keys to delete`)

    if (keys.length === 0) {
      console.log("No keys to delete. KV namespace is already empty.")
      return true
    }

    // Multiple safety confirmations
    console.log("⚠️  WARNING: You are about to PERMANENTLY DELETE ALL DATA in the KV namespace.")
    console.log(`This will delete ${keys.length} keys and CANNOT be undone unless you have a backup.`)
    console.log("Are you absolutely sure? Type 'yes' to confirm:")

    const readlineSync = require("readline-sync")
    const confirmation = readlineSync.question("")

    if (confirmation.toLowerCase() !== "yes") {
      console.log("Wipe operation cancelled.")
      return false
    }

    console.log("Type the name of the KV namespace to confirm deletion:")
    const namespaceConfirmation = readlineSync.question("")

    if (namespaceConfirmation !== "DATA") {
      console.log("Wipe operation cancelled. Namespace name did not match.")
      return false
    }

    // Final confirmation with countdown
    console.log("Final confirmation. Wiping will begin in 5 seconds...")
    console.log("Press Ctrl+C to cancel")
    for (let i = 5; i > 0; i--) {
      process.stdout.write(`${i}... `)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    console.log("\n")

    // Delete all keys
    console.log("Starting KV wipe operation...")
    let deletedCount = 0

    for (const key of keys) {
      console.log(`Deleting key: ${key}`)

      await deleteKVKey(key)

      deletedCount++
      if (deletedCount % 10 === 0) {
        console.log(`Progress: ${deletedCount}/${keys.length} keys deleted`)
      }
    }

    console.log(`✅ KV wipe completed successfully! Deleted ${deletedCount} keys.`)
    return true
  } catch (error) {
    console.error("Failed to wipe KV data:", error)
    return false
  }
}

// Main function
async function main() {
  const command = process.argv[2]

  if (!command) {
    console.log(`
KV Admin - Backup, restore, and manage utility for Cloudflare KV storage

Usage:
  bun run bin/kv backup             - Backup KV data matching configured patterns to _backup/kv-$TIMESTAMP.json
  bun run bin/kv backup --all       - Backup all KV data to _backup/kv-$TIMESTAMP.json
  bun run bin/kv restore <filename> - Restore KV data from backup file
  bun run bin/kv wipe               - Wipe all KV data (DANGEROUS!)

Environment Variables:
  CLOUDFLARE_API_TOKEN              - Cloudflare API token with KV permissions
  CLOUDFLARE_ACCOUNT_ID             - Your Cloudflare account ID

Setup Requirements:
  1. Create a Cloudflare API token with KV read/write permissions
  2. Set the required environment variables
  3. KV namespace 'DATA' must exist in your Cloudflare account
`)
    process.exit(1)
  }

  switch (command) {
    case "backup": {
      const backupAll = process.argv.includes("--all") || process.argv.includes("-a")
      await backupKV(backupAll)
      break
    }
    case "restore": {
      const filename = process.argv[3]
      if (!filename) {
        console.error("Missing filename for restore operation")
        process.exit(1)
      }
      await restoreKV(filename)
      break
    }
    case "wipe":
      await wipeKV()
      break
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
