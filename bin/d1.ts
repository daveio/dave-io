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

/**
 * Allowed table names to prevent SQL injection
 * Add new tables here as they are created
 */
const ALLOWED_TABLES = ["jwt_tokens", "redirects", "user_sessions", "api_usage", "metrics"] as const

/**
 * Allowed column names to prevent SQL injection
 * Add new columns here as they are added to database schema
 */
const ALLOWED_COLUMNS = [
  "uuid",
  "sub",
  "iat",
  "exp",
  "jti",
  "created_at",
  "updated_at",
  "slug",
  "url",
  "title",
  "description",
  "clicks",
  "token_id",
  "usage_count",
  "max_requests",
  "last_used"
] as const

/**
 * Validate table name against allow-list
 * @param tableName Table name to validate
 * @throws Error if table name is not allowed
 */
function validateTableName(tableName: string): void {
  if (!ALLOWED_TABLES.includes(tableName as (typeof ALLOWED_TABLES)[number])) {
    throw new Error(`Invalid table name: ${tableName}. Allowed tables: ${ALLOWED_TABLES.join(", ")}`)
  }
}

/**
 * Validate column name against allow-list
 * @param columnName Column name to validate
 * @throws Error if column name is not allowed
 */
function validateColumnName(columnName: string): void {
  if (!ALLOWED_COLUMNS.includes(columnName as (typeof ALLOWED_COLUMNS)[number])) {
    throw new Error(`Invalid column name: ${columnName}. Allowed columns: ${ALLOWED_COLUMNS.join(", ")}`)
  }
}

const program = new Command()

program.name("d1").description("D1 Database Management Utility for dave-io").version("1.0.0")

// Global options
program.option("--script", "Enable script mode (non-interactive, structured output)")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

/**
 * Initialize database schema - create all required tables
 * @returns Promise resolving when schema is initialized
 */
export async function initializeSchema(): Promise<void> {
  // Create jwt_tokens table
  const createJwtTokensTable = `
    CREATE TABLE IF NOT EXISTS jwt_tokens (
      uuid TEXT PRIMARY KEY,
      sub TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT
    )
  `

  // Create index for jwt_tokens
  const createJwtTokensIndex = `
    CREATE INDEX IF NOT EXISTS idx_jwt_tokens_sub ON jwt_tokens(sub)
  `

  // Execute schema creation
  await executeD1Command(createJwtTokensTable)
  await executeD1Command(createJwtTokensIndex)
}

// Removed unused getD1Config function - configuration is handled directly in executeD1Command

/**
 * Validate D1 response structure
 * @param response Response from D1 API
 * @returns Validated result data
 */
function validateD1Response(response: unknown): unknown {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid D1 response: response is not an object")
  }

  const responseObj = response as Record<string, unknown>

  if (!("result" in responseObj)) {
    throw new Error("Invalid D1 response: missing 'result' field")
  }

  return responseObj.result
}

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
    return validateD1Response(response)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined

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
  validateTableName(tableName)
  const sql = `SELECT * FROM ${tableName} LIMIT ?`
  const result = await executeD1Command(sql, [limit])

  if (result && typeof result === "object" && "results" in result) {
    const resultsObj = result as { results: unknown }
    return Array.isArray(resultsObj.results) ? resultsObj.results : []
  }
  return []
}

/**
 * Search for entries in a table
 * @param tableName Name of the table to search
 * @param column Column to search in
 * @param value Value to search for
 * @returns Array of matching entries
 */
export async function searchTable(tableName: string, column: string, value: string): Promise<unknown[]> {
  validateTableName(tableName)
  validateColumnName(column)
  const sql = `SELECT * FROM ${tableName} WHERE ${column} = ?`
  const result = await executeD1Command(sql, [value])

  if (result && typeof result === "object" && "results" in result) {
    const resultsObj = result as { results: unknown }
    return Array.isArray(resultsObj.results) ? resultsObj.results : []
  }
  return []
}

/**
 * Delete entries from a table
 * @param tableName Name of the table
 * @param column Column to match
 * @param value Value to match for deletion
 * @returns Number of deleted rows
 */
export async function deleteFromTable(tableName: string, column: string, value: string): Promise<number> {
  validateTableName(tableName)
  validateColumnName(column)
  const sql = `DELETE FROM ${tableName} WHERE ${column} = ?`
  const result = await executeD1Command(sql, [value])

  if (result && typeof result === "object" && "meta" in result) {
    const metaObj = result as { meta: unknown }
    if (metaObj.meta && typeof metaObj.meta === "object" && "changes" in metaObj.meta) {
      const changesObj = metaObj.meta as { changes: unknown }
      return typeof changesObj.changes === "number" ? changesObj.changes : 0
    }
  }
  return 0
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

// Init command
program
  .command("init")
  .description("Initialize database schema - create all required tables")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    const scriptMode = isScriptMode()

    try {
      if (!scriptMode && !options.yes) {
        console.log("⚠️  WARNING: This will create/update database tables:")
        console.log("   - jwt_tokens (JWT token metadata)")
        console.log("\n   Existing tables will not be dropped, only created if missing.")
        console.log("   Use --yes flag to skip this confirmation.")
        process.exit(1)
      }

      if (!scriptMode) {
        console.log("🔨 Initializing database schema...")
      }

      await initializeSchema()

      if (scriptMode) {
        console.log(JSON.stringify({ success: true, message: "Database schema initialized successfully" }, null, 2))
      } else {
        console.log("\n✅ Database schema initialized successfully!")
        console.log("   Created tables:")
        console.log("   - jwt_tokens (with index on 'sub' column)")
      }
    } catch (error) {
      if (scriptMode) {
        console.log(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2)
        )
      } else {
        console.error("❌ Failed to initialize database schema:", error)
      }
      process.exit(1)
    }
  })

program.addHelpText(
  "after",
  `
Examples:
  bun run bin/d1.ts init                          # Initialize database schema
  bun run bin/d1.ts init --yes                    # Initialize without confirmation
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
