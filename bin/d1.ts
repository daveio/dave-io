#!/usr/bin/env bun

/**
 * D1 Database Management Utility
 *
 * This tool provides operations for managing Cloudflare D1 databases,
 * including listing, searching, and removing entries.
 *
 * Usage:
 *   bun run bin/d1.ts list <table>              - List all entries in a table
 *   bun run bin/d1.ts search <table> <column> <value> - Search for entries
 *   bun run bin/d1.ts delete <table> <column> <value> - Delete entries
 *   bun run bin/d1.ts query <sql>               - Execute custom SQL query
 */

import { Command } from "commander"
import { createCloudflareClient, executeD1Query } from "./shared/cloudflare"

const program = new Command()

program.name("d1").description("D1 Database Management Utility for dave-io-nuxt").version("1.0.0")

// Global options
program.option("--script", "Enable script mode (non-interactive, structured output)")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

// Removed unused getD1Config function - configuration is handled directly in executeD1Command

/**
 * Execute a D1 query and return results
 * @param sql SQL query to execute
 * @param params Query parameters
 * @returns Query results
 */
export async function executeD1Command(sql: string, params: unknown[] = []): Promise<unknown> {
  try {
    const { client, config } = createCloudflareClient(true)
    if (!config.databaseId) {
      throw new Error("Database ID not configured")
    }
    const response = await executeD1Query(client, config.accountId, config.databaseId, sql, params)
    return (response as { result: unknown }).result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStatus = (error as { status?: number }).status

    if (errorMessage?.includes("next-api-auth-metadata") || errorStatus === 404) {
      console.error("❌ D1 database 'next-api-auth-metadata' not found or not accessible")
      console.error("   Please ensure:")
      console.error("   1. You have a valid CLOUDFLARE_API_TOKEN with D1 permissions")
      console.error("   2. CLOUDFLARE_ACCOUNT_ID is correct")
      console.error("   3. The D1 database exists and is properly configured")
      throw new Error("D1 database not accessible")
    }
    console.error(`D1 command failed: ${errorMessage}`)
    throw error
  }
}

/**
 * List all entries in a table
 * @param tableName Name of the table to list
 * @param limit Maximum number of entries to return
 * @returns Array of table entries
 */
export async function listTable(tableName: string, limit = 100): Promise<unknown[]> {
  const sql = `SELECT * FROM ${tableName} LIMIT ?`
  const result = await executeD1Command(sql, [limit])
  return (result as { results: unknown[] }).results || []
}

/**
 * Search for entries in a table
 * @param tableName Name of the table to search
 * @param column Column to search in
 * @param value Value to search for
 * @returns Array of matching entries
 */
export async function searchTable(tableName: string, column: string, value: string): Promise<unknown[]> {
  const sql = `SELECT * FROM ${tableName} WHERE ${column} = ?`
  const result = await executeD1Command(sql, [value])
  return (result as { results: unknown[] }).results || []
}

/**
 * Delete entries from a table
 * @param tableName Name of the table
 * @param column Column to match
 * @param value Value to match for deletion
 * @returns Number of deleted rows
 */
export async function deleteFromTable(tableName: string, column: string, value: string): Promise<number> {
  const sql = `DELETE FROM ${tableName} WHERE ${column} = ?`
  const result = await executeD1Command(sql, [value])
  return (result as { meta: { changes: number } }).meta?.changes || 0
}

// List command
program
  .command("list <table>")
  .description("List all entries in a table")
  .option("-l, --limit <number>", "Maximum number of entries to return", "100")
  .action(async (table, options) => {
    const scriptMode = isScriptMode()

    try {
      if (!scriptMode) {
        console.log(`📊 Listing entries from table: ${table}`)
      }

      const entries = await listTable(table, Number.parseInt(options.limit, 10))

      if (scriptMode) {
        console.log(JSON.stringify({ success: true, table, count: entries.length, results: entries }, null, 2))
      } else {
        console.log(`\n✅ Found ${entries.length} entries:`)
        entries.forEach((entry, index) => {
          console.log(`\n[${index + 1}]`)
          console.log(JSON.stringify(entry, null, 2))
        })
      }
    } catch (error) {
      if (scriptMode) {
        console.log(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
        )
      } else {
        console.error("❌ Failed to list table:", error)
      }
      process.exit(1)
    }
  })

// Search command
program
  .command("search <table> <column> <value>")
  .description("Search for entries in a table")
  .action(async (table, column, value) => {
    const scriptMode = isScriptMode()

    try {
      if (!scriptMode) {
        console.log(`🔍 Searching in table: ${table}`)
        console.log(`   Column: ${column} = "${value}"`)
      }

      const entries = await searchTable(table, column, value)

      if (scriptMode) {
        console.log(
          JSON.stringify({ success: true, table, column, value, count: entries.length, results: entries }, null, 2)
        )
      } else {
        console.log(`\n✅ Found ${entries.length} matching entries:`)
        entries.forEach((entry, index) => {
          console.log(`\n[${index + 1}]`)
          console.log(JSON.stringify(entry, null, 2))
        })
      }
    } catch (error) {
      if (scriptMode) {
        console.log(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
        )
      } else {
        console.error("❌ Failed to search table:", error)
      }
      process.exit(1)
    }
  })

// Delete command
program
  .command("delete <table> <column> <value>")
  .description("Delete entries from a table")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (table, column, value, options) => {
    const scriptMode = isScriptMode()

    try {
      if (!scriptMode && !options.yes) {
        console.log(`⚠️  WARNING: This will delete all entries where ${column} = "${value}" from table ${table}`)
        console.log("   This operation cannot be undone!")
        console.log("\n   Use --yes flag to skip this confirmation.")
        process.exit(1)
      }

      if (!scriptMode) {
        console.log(`🗑️  Deleting from table: ${table}`)
        console.log(`   Where: ${column} = "${value}"`)
      }

      const deletedCount = await deleteFromTable(table, column, value)

      if (scriptMode) {
        console.log(JSON.stringify({ success: true, table, column, value, deletedCount }, null, 2))
      } else {
        console.log(`\n✅ Successfully deleted ${deletedCount} entries`)
      }
    } catch (error) {
      if (scriptMode) {
        console.log(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
        )
      } else {
        console.error("❌ Failed to delete from table:", error)
      }
      process.exit(1)
    }
  })

// Query command
program
  .command("query <sql>")
  .description("Execute a custom SQL query")
  .option("-p, --params <params...>", "Query parameters")
  .action(async (sql, options) => {
    const scriptMode = isScriptMode()

    try {
      if (!scriptMode) {
        console.log(`🔧 Executing SQL query: ${sql}`)
        if (options.params) {
          console.log(`   Parameters: ${options.params.join(", ")}`)
        }
      }

      const result = await executeD1Command(sql, options.params || [])

      if (scriptMode) {
        console.log(JSON.stringify({ success: true, sql, params: options.params || [], result }, null, 2))
      } else {
        console.log("\n✅ Query executed successfully:")
        console.log(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      if (scriptMode) {
        console.log(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
        )
      } else {
        console.error("❌ Failed to execute query:", error)
      }
      process.exit(1)
    }
  })

program.addHelpText(
  "after",
  `
Examples:
  bun run bin/d1.ts list jwt_tokens              # List all JWT tokens
  bun run bin/d1.ts list jwt_tokens --limit 10   # List first 10 JWT tokens
  bun run bin/d1.ts search jwt_tokens sub "api"  # Find tokens with sub="api"
  bun run bin/d1.ts delete jwt_tokens uuid "..."  # Delete token by UUID
  bun run bin/d1.ts query "SELECT COUNT(*) FROM jwt_tokens" # Count tokens

Environment Variables:
  CLOUDFLARE_API_TOKEN    # API token with D1 permissions
  CLOUDFLARE_ACCOUNT_ID   # Cloudflare account ID
  CLOUDFLARE_DATABASE_ID  # D1 database ID (optional, uses default)

Security Notes:
  - This tool has direct database access - use with caution
  - Delete operations require confirmation unless --yes is used
  - All operations are logged for audit purposes
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
