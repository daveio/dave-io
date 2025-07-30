#!/usr/bin/env bun

/**
 * KV Admin - Backup, restore, and manage utility for Cloudflare KV storage
 *
 * This tool uses the official Cloudflare SDK to manage KV namespaces via the API.
 * For production operations, set environment variables for authentication.
 *
 * YAML Format:
 * - Export: Flat KV keys → hierarchical YAML for human readability
 * - Import: Hierarchical YAML (with/without anchors) → flat KV keys
 * Example: KV key "metrics:group:5xx" becomes YAML { metrics: { group: { 5xx: value } } }
 *
 * Usage:
 *   bun run bin/kv export             - Export KV data to nested YAML in data/kv/
 *   bun run bin/kv export --all       - Export all KV data to nested YAML
 *   bun run bin/kv import <filename>  - Import KV data from nested YAML file
 *   bun run bin/kv list [--pattern]   - List KV keys with optional pattern filtering
 *   bun run bin/kv wipe [--pattern]   - Wipe KV data (optionally matching pattern)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { Command } from "commander"
import yaml from "js-yaml"
import JSON5 from "json5"
import { getTimestamp, keyMatchesPatterns, tryParseJson } from "./shared/cli-utils"
import { deleteKeyKV, fetchAllKeysKV, getKeyValueKV, putKeyValueKV } from "./shared/cloudflare"

// Configure the key patterns to include in exports (using regular expressions)
// Updated for simple KV key structure
const EXPORT_KEY_PATTERNS = [
  /^metrics:.*$/, // All metrics keys (flat hierarchy)
  /^redirect:.*$/, // All redirect mapping keys
  /^dashboard:.*$/, // Dashboard cache data
  /^token:.*$/ // Token management keys
]

// Fetch key values for multiple keys
async function fetchKeyValues(keys: string[], useLocal = false): Promise<Record<string, unknown>> {
  const kvData: Record<string, unknown> = {}

  for (const key of keys) {
    try {
      console.log("📥 Fetching value for key:", key)
      const valueStr = await getKeyValueKV(key, useLocal)
      kvData[key] = tryParseJson(valueStr)
    } catch (error) {
      console.error("❌ Failed to get value for key:", key, error)
    }
  }

  return kvData
}

// Wipe all keys from KV namespace
async function wipeKVNamespace(dryRun = false, useLocal = false, skipConfirmation = false): Promise<boolean> {
  try {
    console.log(
      `📊 Fetching all keys from ${useLocal ? "local" : "remote"} wrangler KV${dryRun ? " [DRY RUN]" : ""}...`
    )
    const keys = await fetchAllKeysKV(useLocal)

    console.log(`🔍 Found ${keys.length} keys${dryRun ? " that would be deleted" : " to delete"}`)

    if (keys.length === 0) {
      console.log(`✅ No keys to delete. ${useLocal ? "Local" : "Remote"} KV is already empty.`)
      return true
    }

    if (dryRun) {
      console.log("\n🔍 Keys that would be deleted:")
      for (const key of keys.slice(0, 20)) {
        console.log(`  - ${key}`)
      }
      if (keys.length > 20) {
        console.log(`  ... and ${keys.length - 20} more keys`)
      }
      console.log(`\n📊 Total: ${keys.length} keys would be permanently deleted`)
      return true
    }

    // Multiple safety confirmations
    console.log(
      `\n⚠️  WARNING: You are about to PERMANENTLY DELETE ALL DATA in the ${useLocal ? "local" : "remote"} KV namespace.`
    )
    console.log(`This will delete ${keys.length} keys and CANNOT be undone unless you have a backup.`)
    console.log("\n🚨 This is a DESTRUCTIVE operation!")

    // Check for confirmation via flag or environment variable
    const envConfirm = process.env.CONFIRM_WIPE
    const envConfirmed =
      envConfirm && (envConfirm === "yes" || envConfirm === "1" || envConfirm.toLowerCase() === "true")

    const scriptMode = isScriptMode()
    if (!skipConfirmation && !envConfirmed && !scriptMode) {
      console.log("ℹ️  Confirmation required. Use one of the following:")
      console.log("  --yes or -y flag")
      console.log("  CONFIRM_WIPE=yes (or 1, or true) environment variable")

      console.log("❌ Wipe cancelled - confirmation required")
      return false
    }

    // In script mode, assume confirmation if not explicitly denied
    if (scriptMode && !skipConfirmation && !envConfirmed) {
      // Script mode requires explicit confirmation
      return false
    }

    if (skipConfirmation) {
      console.log("✅ Wipe confirmed via --yes flag")
    } else if (envConfirmed) {
      console.log("✅ Wipe confirmed via CONFIRM_WIPE environment variable")
    }

    console.log("🗑️  Deleting all keys...")
    let successCount = 0
    let errorCount = 0

    for (const key of keys) {
      try {
        await deleteKeyKV(key, useLocal)
        console.log("  ✓ Deleted:", key)
        successCount++
      } catch (error) {
        console.error("  ❌ Failed to delete", `${key}:`, error)
        errorCount++
      }
    }

    console.log(`\n✅ Wipe completed! ${successCount} deleted, ${errorCount} errors`)
    return errorCount === 0
  } catch (error) {
    // trunk-ignore(semgrep/javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring): Safe format string
    console.error(`❌ Failed to wipe ${useLocal ? "local" : "remote"} KV data:`, error)
    return false
  }
}

// KV Admin Tool - requires Cloudflare credentials

const program = new Command()

program
  .name("kv")
  .description("KV Admin utility for dave-io-nuxt")
  .version("1.0.0")
  .option("--local", "Use local wrangler KV storage instead of remote Cloudflare API")
  .option("--script", "Enable script mode (non-interactive, structured output)")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

// Filter keys based on export patterns
function filterKeys(allKeys: string[], exportAll: boolean): string[] {
  return exportAll ? allKeys : allKeys.filter((key: string) => keyMatchesPatterns(key, EXPORT_KEY_PATTERNS))
}

// Convert flat KV data to nested structure based on colon-separated keys
function convertToNestedStructure(flatData: Record<string, unknown>): Record<string, unknown> {
  // Use Object.create(null) to avoid prototype pollution
  const nested = Object.create(null) as Record<string, unknown>

  // Prototype pollution protection
  const isPrototypePollutionKey = (key: string): boolean => {
    return key === "__proto__" || key === "constructor" || key === "prototype"
  }

  for (const [key, value] of Object.entries(flatData)) {
    if (isPrototypePollutionKey(key)) {
      continue
    } // Skip dangerous keys entirely

    const parts = key.split(":").filter((part) => part.length > 0 && !isPrototypePollutionKey(part))
    if (parts.length === 0) {
      continue
    }

    let current = nested

    // Navigate/create the nested structure safely
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (part && !isPrototypePollutionKey(part) && !Object.hasOwn(current, part)) {
        current[part] = Object.create(null) as Record<string, unknown>
      }
      if (part && !isPrototypePollutionKey(part) && current[part] && typeof current[part] === "object") {
        const nextCurrent = current[part]
        if (nextCurrent && typeof nextCurrent === "object" && !Array.isArray(nextCurrent)) {
          current = nextCurrent as Record<string, unknown>
        } else {
          break // Exit if we can't navigate further
        }
      } else if (part) {
        break // Exit if we can't navigate further
      }
    }

    // Set the final value safely
    const finalKey = parts[parts.length - 1]
    if (finalKey && !isPrototypePollutionKey(finalKey)) {
      current[finalKey] = value
    }
  }

  return nested
}

// Convert nested structure back to flat KV keys
function convertToFlatStructure(nestedData: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const flat: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(nestedData)) {
    if (!key) {
      continue
    } // Skip empty keys

    const fullKey = prefix ? `${prefix}:${key}` : key

    // Check if value is a nested object (either regular object or null-prototype object)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value.constructor === Object || Object.getPrototypeOf(value) === null)
    ) {
      // Recursively flatten nested objects
      Object.assign(flat, convertToFlatStructure(value as Record<string, unknown>, fullKey))
    } else {
      // Leaf value - store with the full key
      flat[fullKey] = value
    }
  }

  return flat
}

// Get all KV keys with their values, filtering by patterns if specified
async function getAllKVData(exportAll = false, useLocal = false) {
  console.log(
    `📊 Fetching ${exportAll ? "all" : "selected"} keys from ${useLocal ? "local" : "remote"} KV namespace...`
  )

  try {
    const allKeys = await fetchAllKeysKV(useLocal)
    const keys = filterKeys(allKeys, exportAll)

    console.log(`🔍 Found ${keys.length} keys ${exportAll ? "" : `matching patterns (out of ${allKeys.length} total)`}`)

    return await fetchKeyValues(keys, useLocal)
  } catch (error) {
    // trunk-ignore(semgrep/javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring): Safe format string
    console.error(`❌ Failed to fetch keys from ${useLocal ? "local" : "remote"} wrangler KV:`, error)
    throw error
  }
}

// Wipe all KV data
async function wipeKV(dryRun = false, useLocal = false, skipConfirmation = false) {
  return await wipeKVNamespace(dryRun, useLocal, skipConfirmation)
}

// Export KV data to YAML file
async function exportKV(exportAll = false, dryRun = false, useLocal = false, outputPath?: string) {
  try {
    console.log(
      `🚀 Starting KV export to YAML (${exportAll ? "all keys" : "selected keys"}) from ${useLocal ? "local" : "remote"}${dryRun ? " [DRY RUN]" : ""}...`
    )
    const flatKvData = await getAllKVData(exportAll, useLocal)

    // Convert flat structure to nested structure for YAML
    const nestedKvData = convertToNestedStructure(flatKvData)

    // Convert numeric strings to actual numbers for better YAML output
    const processedData = JSON5.parse(
      JSON5.stringify(nestedKvData, (_key, value) => {
        // Convert numeric strings to numbers where appropriate
        if (typeof value === "string") {
          // Check if it's a pure integer
          if (/^-?\d+$/.test(value)) {
            const num = Number.parseInt(value, 10)
            if (!Number.isNaN(num) && Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
              return num
            }
          }
          // Check if it's a float
          if (/^-?\d+\.\d+$/.test(value)) {
            const num = Number.parseFloat(value)
            if (!Number.isNaN(num) && Number.isFinite(num)) {
              return num
            }
          }
        }
        return value
      })
    )

    // Convert to YAML with proper numeric handling, no anchors in output
    const yamlOutput = yaml.dump(processedData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true, // Don't generate YAML references/anchors in output
      quotingType: '"',
      sortKeys: true // Sort keys for consistent output
    })

    if (dryRun) {
      console.log(`📊 Would export ${Object.keys(flatKvData).length} keys`)
      if (outputPath) {
        console.log(`📁 Would save to: ${outputPath}`)
      }
      console.log("\n🔍 YAML preview (first 500 characters):")
      console.log(yamlOutput.substring(0, 500) + (yamlOutput.length > 500 ? "..." : ""))
      return true
    }

    // Determine output file path
    let filepath: string
    if (outputPath) {
      filepath = resolve(outputPath)
    } else {
      // Default filename with timestamp
      const timestamp = getTimestamp()
      filepath = resolve(`kv-${timestamp}.yaml`)
    }

    // Ensure output directory exists if outputPath contains a directory
    const outputDir = resolve(filepath, "..")
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
      console.log(`📁 Created ${outputDir} directory`)
    }

    // Write to file
    writeFileSync(filepath, yamlOutput, "utf8")
    console.log(`✅ Export saved to ${filepath}`)
    console.log(`📊 Exported ${Object.keys(flatKvData).length} keys`)
    return true
  } catch (error) {
    console.error("❌ Failed to export KV data:", error)
    return false
  }
}

// Check if user has confirmed overwrite via flags or environment
function checkOverwriteConfirmation(options: { yes?: boolean; y?: boolean }): boolean {
  // Check command line flags
  if (options.yes || options.y) {
    return true
  }

  // Check environment variable
  const envVar = process.env.KV_IMPORT_ALLOW_OVERWRITE
  if (envVar && (envVar === "1" || envVar.toLowerCase() === "true")) {
    return true
  }

  return false
}

// Import KV data from YAML file
async function importKV(
  filename: string,
  options: { yes?: boolean; y?: boolean; wipe?: boolean; w?: boolean; dryRun?: boolean; local?: boolean }
) {
  try {
    // Resolve file path - support both absolute and relative paths
    const filepath = resolve(filename)

    if (!existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`)
      return false
    }

    console.log(`📖 Reading import file from ${filepath}${options.dryRun ? " [DRY RUN]" : ""}...`)
    const fileData = readFileSync(filepath, "utf-8")

    // Parse YAML data with anchor/reference support
    let nestedImportData: Record<string, unknown>
    try {
      nestedImportData = yaml.load(fileData, {
        schema: yaml.DEFAULT_SCHEMA // Support anchors and references
      }) as Record<string, unknown>

      if (!nestedImportData || typeof nestedImportData !== "object") {
        throw new Error("Invalid YAML structure - expected object")
      }

      // Filter out YAML anchor definitions (keys starting with _)
      const filteredData = Object.create(null) as Record<string, unknown>
      for (const [key, value] of Object.entries(nestedImportData)) {
        if (!key.startsWith("_")) {
          filteredData[key] = value
        }
      }
      nestedImportData = filteredData
    } catch (parseError) {
      console.error("❌ Failed to parse YAML:", parseError)
      return false
    }

    // Convert nested structure back to flat KV keys
    const importData = convertToFlatStructure(nestedImportData)
    const importKeys = Object.keys(importData)
    console.log(`📊 Found ${importKeys.length} keys to import`)

    if (importKeys.length === 0) {
      console.log("✅ Nothing to import - file contains no keys")
      return true
    }

    if (options.dryRun) {
      console.log(`📊 Would import ${importKeys.length} keys`)
      console.log("\n🔍 Keys that would be imported:")
      for (const key of importKeys.slice(0, 20)) {
        const value = importData[key]
        const valueStr = typeof value === "string" ? value : JSON5.stringify(value, null, 0)
        const preview = valueStr.substring(0, 50) + (valueStr.length > 50 ? "..." : "")
        console.log(`  - ${key}: ${preview}`)
      }
      if (importKeys.length > 20) {
        console.log(`  ... and ${importKeys.length - 20} more keys`)
      }
      return true
    }

    // Handle wipe option first
    if (options.wipe || options.w) {
      console.log(`🗑️ Wiping ${options.local ? "local" : "remote"} KV namespace before import...`)
      const wipeSuccess = await wipeKVNamespace(false, options.local, options.yes || options.y)
      if (!wipeSuccess) {
        console.error("❌ Failed to wipe KV namespace - aborting import")
        return false
      }
    } else {
      // Check for existing keys that would be overwritten
      console.log("🔍 Checking for existing keys that would be overwritten...")
      const existingKeys = await fetchAllKeysKV(options.local)
      const conflictingKeys = importKeys.filter((key) => existingKeys.includes(key))

      if (conflictingKeys.length > 0) {
        console.log(`⚠️ WARNING: ${conflictingKeys.length} keys will be overwritten:`)
        for (const key of conflictingKeys.slice(0, 10)) {
          console.log(`  - ${key}`)
        }
        if (conflictingKeys.length > 10) {
          console.log(`  ... and ${conflictingKeys.length - 10} more`)
        }

        // Check if user has confirmed overwrite
        const scriptMode = isScriptMode()
        if (!checkOverwriteConfirmation(options) && !scriptMode) {
          console.log("\n❌ Import cancelled - existing keys would be overwritten")
          console.log("Use one of the following to confirm overwrite:")
          console.log("  --yes or -y flag")
          console.log("  KV_IMPORT_ALLOW_OVERWRITE=1 environment variable")
          console.log("  --wipe or -w flag to clear namespace first")
          return false
        }

        // In script mode, require explicit confirmation
        if (scriptMode && !checkOverwriteConfirmation(options)) {
          return false
        }

        console.log("✅ Overwrite confirmed - proceeding with import")
      }
    }

    // Perform the import
    console.log(`\n🔄 Importing to ${options.local ? "local wrangler" : "Cloudflare"} KV...`)
    let successCount = 0
    let errorCount = 0

    for (const [key, value] of Object.entries(importData)) {
      try {
        // Convert value to simple string - avoid JSON wrapper objects
        let valueStr: string
        if (typeof value === "string") {
          valueStr = value
        } else if (typeof value === "number") {
          valueStr = value.toString()
        } else if (typeof value === "boolean") {
          valueStr = value.toString()
        } else if (value === null || value === undefined) {
          valueStr = ""
        } else {
          // For complex objects, use JSON5 but this should be rare with simple KV structure
          valueStr = JSON5.stringify(value, null, 0)
        }

        await putKeyValueKV(key, valueStr, options.local)

        const preview = valueStr.substring(0, 100) + (valueStr.length > 100 ? "..." : "")
        console.log("  ✓", `${key}:`, preview)
        successCount++
      } catch (error) {
        console.error("  ❌ Failed to import", `${key}:`, error)
        errorCount++
      }
    }

    console.log(`\n✅ Import completed! ${successCount} successful, ${errorCount} errors`)
    return errorCount === 0
  } catch (error) {
    console.error("❌ Failed to import KV data:", error)
    return false
  }
}

// Wipe command
program
  .command("wipe")
  .description("Wipe all KV data (DANGEROUS!)")
  .option("-d, --dry-run", "Show what would be deleted without making changes")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    const useLocal = program.opts().local
    await wipeKV(options.dryRun, useLocal, options.yes)
  })

// List command
program
  .command("list")
  .description("List all KV keys")
  .option("-p, --pattern <pattern>", "Filter keys by pattern")
  .option("-d, --dry-run", "No effect (list is always read-only)")
  .action(async (options) => {
    try {
      const useLocal = program.opts().local
      console.log(`📊 Listing ${useLocal ? "local" : "remote"} KV keys...`)

      const keys = await fetchAllKeysKV(useLocal)

      let filteredKeys = keys
      if (options.pattern) {
        // Sanitize pattern input to prevent ReDoS attacks
        const sanitizedPattern = options.pattern
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
          .substring(0, 100) // Limit pattern length

        try {
          // Use simple string matching instead of regex for safety
          filteredKeys = keys.filter((key: string) => key.toLowerCase().includes(sanitizedPattern.toLowerCase()))
        } catch {
          console.error("❌ Invalid pattern:", options.pattern)
          return
        }
      }

      console.log(`\n🔍 Found ${filteredKeys.length} keys${options.pattern ? ` matching "${options.pattern}"` : ""}:`)

      for (const key of filteredKeys) {
        try {
          const value = await getKeyValueKV(key, useLocal)

          const preview = value.substring(0, 50) + (value.length > 50 ? "..." : "")
          console.log("  📄", `${key}:`, preview)
        } catch {
          console.log("  📄", `${key}: <failed to fetch value>`)
        }
      }
    } catch (error) {
      console.error("❌ Failed to list KV keys:", error)
    }
  })

// Export command
program
  .command("export [output]")
  .description("Export KV data to YAML file")
  .option("-a, --all", "Export all KV data (not just pattern matches)")
  .option("-d, --dry-run", "Show what would be exported without writing files")
  .action(async (output, options) => {
    const useLocal = program.opts().local
    await exportKV(options.all, options.dryRun, useLocal, output)
  })

// Import command
program
  .command("import <filename>")
  .description("Import KV data from YAML file")
  .option("-y, --yes", "Skip confirmation for overwriting existing keys")
  .option("-w, --wipe", "Wipe KV namespace before importing")
  .option("-d, --dry-run", "Show what would be imported without making changes")
  .action(async (filename, options) => {
    const useLocal = program.opts().local
    await importKV(filename, { ...options, local: useLocal })
  })

// Add help text
program.addHelpText(
  "after",
  `
Examples:
  # Remote KV operations (default - requires API credentials)
  bun run bin/kv export                     # Export selected data patterns to timestamped YAML file
  bun run bin/kv export backup.yaml        # Export to specific file path
  bun run bin/kv export data/kv/export.yaml # Export to specific directory and file
  bun run bin/kv export --all              # Export all KV data to timestamped YAML file
  bun run bin/kv export --dry-run          # Preview what would be exported
  bun run bin/kv import backup.yaml        # Import from YAML file
  bun run bin/kv import /path/to/backup.yaml --yes    # Import with auto-confirm
  bun run bin/kv import ./data/backup.yaml --wipe     # Wipe then import
  bun run bin/kv import backup.yaml --wipe --yes      # Wipe then import with confirmation
  bun run bin/kv import backup.yaml --dry-run         # Preview what would be imported
  bun run bin/kv list                       # List all keys
  bun run bin/kv list --pattern "^metrics:" # List metrics keys
  bun run bin/kv wipe                       # Wipe all data (dangerous!)
  bun run bin/kv wipe --yes                 # Wipe all data with confirmation
  bun run bin/kv wipe --dry-run             # Preview what would be deleted

  # Local KV operations (development - uses wrangler local simulator)
  bun run bin/kv --local export             # Export from local wrangler KV storage
  bun run bin/kv --local export local-backup.yaml  # Export to specific file
  bun run bin/kv --local import backup.yaml # Import to local wrangler KV storage
  bun run bin/kv --local list               # List keys from local wrangler storage
  bun run bin/kv --local wipe               # Wipe local wrangler storage

Global Flags:
  --local                           - Use local wrangler KV storage instead of remote API

Environment Variables:
  CLOUDFLARE_API_TOKEN              - Cloudflare API token with KV permissions (remote only)
  CLOUDFLARE_ACCOUNT_ID             - Your Cloudflare account ID (remote only)
  KV_IMPORT_ALLOW_OVERWRITE         - Set to "1" or "true" to skip import confirmation
  CONFIRM_WIPE                      - Set to "yes", "1", or "true" to skip wipe confirmation

Note: Local mode uses wrangler's built-in KV simulator for development.
Remote mode connects to the actual Cloudflare KV namespace via API.

Export Patterns (Updated for simple key structure):
  - metrics:* (all individual metrics keys using colon hierarchy)
  - redirect:* (individual redirect mapping keys)
  - dashboard:* (dashboard cache data as individual keys)
  - token:* (token management data as individual keys)
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { wipeKV, exportKV, importKV }
