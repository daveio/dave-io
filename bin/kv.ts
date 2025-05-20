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

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const BACKUP_DIR = "_backup"
const KV_NAMESPACE = "DATA"

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

// Run a Wrangler command and return parsed JSON output
function runWranglerCommand(args: string[]) {
  const result = spawnSync("bun", ["run", "wrangler", ...args], {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "inherit"]
  })

  if (result.status !== 0) {
    throw new Error(`Failed to run wrangler command: ${args.join(" ")}`)
  }

  try {
    return JSON.parse(result.stdout)
  } catch (error) {
    console.error("Failed to parse wrangler output as JSON:", result.stdout)
    throw error
  }
}

// Check if a key matches any of the configured patterns
function keyMatchesPatterns(key: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(key))
}

// Get all KV keys with their values, filtering by patterns if specified
async function getAllKVData(backupAll = false) {
  console.log(`Fetching ${backupAll ? "all" : "selected"} keys from KV namespace ${KV_NAMESPACE}...`)

  // List all keys
  const allKeys = runWranglerCommand(["kv", "key", "list", "--remote", "--binding", KV_NAMESPACE])

  // Filter keys if not backing up all
  const keys = backupAll ? allKeys : allKeys.filter((keyInfo) => keyMatchesPatterns(keyInfo.name, BACKUP_KEY_PATTERNS))

  console.log(`Found ${keys.length} keys ${!backupAll ? `matching patterns (out of ${allKeys.length} total)` : ""}`)

  const kvData: Record<string, unknown> = {}

  // Get values for each key
  for (const keyInfo of keys) {
    const key = keyInfo.name
    try {
      console.log("Fetching value for key:", key)
      const valueRaw = spawnSync(
        "bun",
        ["run", "wrangler", "kv", "key", "get", "--remote", "--binding", KV_NAMESPACE, key],
        {
          encoding: "utf-8"
        }
      ).stdout.trim() // Trim to remove extra whitespace

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

      spawnSync("bun", ["run", "wrangler", "kv", "key", "put", "--remote", "--binding", KV_NAMESPACE, key, valueArg], {
        encoding: "utf-8",
        stdio: "inherit"
      })
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
    console.log(`Fetching all keys from KV namespace ${KV_NAMESPACE}...`)
    const keys = runWranglerCommand(["kv", "key", "list", "--remote", "--binding", KV_NAMESPACE])
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

    if (namespaceConfirmation !== KV_NAMESPACE) {
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

    for (const keyInfo of keys) {
      const key = keyInfo.name
      console.log(`Deleting key: ${key}`)

      spawnSync("bun", ["run", "wrangler", "kv", "key", "delete", "--remote", "--binding", KV_NAMESPACE, key], {
        encoding: "utf-8",
        stdio: "inherit"
      })

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
