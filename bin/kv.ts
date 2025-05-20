#!/usr/bin/env bun

/**
 * KV Admin - Backup and restore utility for Cloudflare KV storage
 *
 * Usage:
 *   bun run bin/kv backup   - Backup all KV data to _backup/kv-$TIMESTAMP.json
 *   bun run bin/kv restore <filename> - Restore KV data from backup file
 */

import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const BACKUP_DIR = "_backup"
const KV_NAMESPACE = "DATA"

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
  const result = spawnSync("npx", ["wrangler", ...args], {
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

// Get all KV keys with their values
async function getAllKVData() {
  console.log(`Fetching all keys from KV namespace ${KV_NAMESPACE}...`)

  // List all keys
  const keys = runWranglerCommand(["kv:key", "list", "--binding", KV_NAMESPACE])
  console.log(`Found ${keys.length} keys`)

  const kvData: Record<string, unknown> = {}

  // Get values for each key
  for (const keyInfo of keys) {
    const key = keyInfo.name
    try {
      console.log("Fetching value for key:", key)
      const valueRaw = spawnSync("npx", ["wrangler", "kv:key", "get", "--binding", KV_NAMESPACE, key], {
        encoding: "utf-8"
      }).stdout

      // Try to parse as JSON, if it fails, store as string
      try {
        kvData[key] = JSON.parse(valueRaw)
      } catch {
        kvData[key] = valueRaw
      }
    } catch (error) {
      console.error("Failed to get value for key:", key, error)
    }
  }

  return kvData
}

// Backup KV data to file
async function backupKV() {
  ensureBackupDirExists()
  const timestamp = getTimestamp()
  const filename = `kv-${timestamp}.json`
  const filepath = resolve(BACKUP_DIR, filename)

  try {
    console.log("Starting KV backup...")
    const kvData = await getAllKVData()

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
      const jsonValue = JSON.stringify(value)

      spawnSync("npx", ["wrangler", "kv:key", "put", "--binding", KV_NAMESPACE, key, jsonValue], {
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

// Main function
async function main() {
  const command = process.argv[2]

  if (!command) {
    console.log(`
KV Admin - Backup and restore utility for Cloudflare KV storage

Usage:
  bun run kv backup   - Backup all KV data to _backup/kv-$TIMESTAMP.json
  bun run kv restore <filename> - Restore KV data from backup file
`)
    process.exit(1)
  }

  switch (command) {
    case "backup":
      await backupKV()
      break
    case "restore": {
      const filename = process.argv[3]
      if (!filename) {
        console.error("Missing filename for restore operation")
        process.exit(1)
      }
      await restoreKV(filename)
      break
    }
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
