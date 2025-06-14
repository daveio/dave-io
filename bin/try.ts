#!/usr/bin/env bun
import boxen from "boxen"
import chalk from "chalk"
import { Command } from "commander"
import {
  AIAdapter,
  type ApiResponse,
  DashboardAdapter,
  ImagesAdapter,
  InternalAdapter,
  type RequestConfig,
  TokensAdapter
} from "./endpoints"
import { createToken } from "./jwt"
import { getJWTSecret } from "./shared/cli-utils"

const program = new Command()

interface GlobalOptions {
  token?: string
  auth?: boolean
  local?: boolean
  remote?: boolean
  version?: boolean
  help?: boolean
  dryRun?: boolean
  verbose?: boolean
  quiet?: boolean
  yes?: boolean
  script?: boolean
}

async function generateTokenForScope(scope: string, options: GlobalOptions): Promise<string> {
  const secret = getJWTSecret()
  if (!secret) {
    console.error(chalk.red("❌ API_JWT_SECRET environment variable not set"))
    console.error(chalk.yellow("💡 Set API_JWT_SECRET in your environment to use --auth"))
    process.exit(1)
  }

  try {
    if (!isScriptMode(options) && !isQuiet(options)) {
      console.log(chalk.cyan(`🔐 Generating temporary token for scope: ${scope}`))
    }

    const { token } = await createToken(
      {
        sub: scope,
        description: `Temporary token for try.ts (${scope})`,
        expiresIn: "1h"
      },
      secret,
      options.dryRun
    )

    if (!isScriptMode(options) && !isQuiet(options)) {
      console.log(chalk.green("✅ Token generated successfully"))
    }

    return token
  } catch (error) {
    console.error(chalk.red("❌ Failed to generate token:"), error)
    process.exit(1)
  }
}

async function createConfig(options: GlobalOptions, scope?: string): Promise<RequestConfig> {
  const baseUrl = options.local
    ? "http://localhost:3000"
    : options.remote
      ? "https://dave.io"
      : "https://dave.io"

  let token: string | undefined

  if (options.auth && scope) {
    token = await generateTokenForScope(scope, options)
  } else {
    token = options.token || undefined
  }

  return {
    token,
    baseUrl,
    timeout: 30000,
    verbose: options.verbose || false,
    dryRun: options.dryRun || false
  }
}

function isScriptMode(options: GlobalOptions): boolean {
  return options.script || false
}

function isQuiet(options: GlobalOptions): boolean {
  return options.quiet || false
}

async function displayResult<T>(result: ApiResponse<T>, options: GlobalOptions, title?: string): Promise<void> {
  const scriptMode = isScriptMode(options)
  const quiet = isQuiet(options)

  if (scriptMode) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  if (quiet && result.ok) {
    if (result.data && typeof result.data === "object") {
      console.log(JSON.stringify(result.data, null, 2))
    } else if (result.message) {
      console.log(result.message)
    }
    return
  }

  const statusIcon = result.ok ? "✅" : "❌"
  const statusColor = result.ok ? chalk.green : chalk.red
  const boxTitle = title ? `${statusIcon} ${title}` : `${statusIcon} API Response`

  const content = []

  if (result.ok) {
    content.push(statusColor("Success: true"))
    if (result.message) {
      content.push(`Message: ${result.message}`)
    }
    if (result.data) {
      content.push(`Data: ${JSON.stringify(result.data, null, 2)}`)
    }
  } else {
    content.push(statusColor("Success: false"))
    content.push(chalk.red(`Error: ${result.error}`))
    if (result.details && options.verbose) {
      content.push(chalk.yellow(`Details: ${JSON.stringify(result.details, null, 2)}`))
    }
  }

  if (result.meta) {
    const metaLines = []
    if (result.meta.request_id) {
      metaLines.push(`Request ID: ${result.meta.request_id}`)
    }
    if (result.meta.timestamp) {
      metaLines.push(`Timestamp: ${result.meta.timestamp}`)
    }
    if (result.meta.cfRay) {
      metaLines.push(`CF-Ray: ${result.meta.cfRay}`)
    }
    if (result.meta.country) {
      metaLines.push(`Country: ${result.meta.country}`)
    }
    if (metaLines.length > 0) {
      content.push(chalk.gray(`Meta: ${metaLines.join(", ")}`))
    }
  }

  const box = boxen(content.join("\n"), {
    padding: 1,
    margin: 1,
    borderStyle: result.ok ? "round" : "double",
    borderColor: result.ok ? "green" : "red",
    title: boxTitle,
    titleAlignment: "center"
  })

  console.log(box)
}

async function withSpinner<T>(promise: Promise<T>, text: string, options: GlobalOptions): Promise<T> {
  if (isScriptMode(options) || isQuiet(options)) {
    return promise
  }

  const ora = (await import("ora")).default
  const spinner = ora(text).start()

  try {
    const result = await promise
    spinner.succeed()
    return result
  } catch (error) {
    spinner.fail()
    throw error
  }
}

function validateToken(config: RequestConfig, endpoint: string, hasAuth: boolean): void {
  if (!config.token) {
    console.error(chalk.red("❌ No token provided for protected endpoint"))
    if (hasAuth) {
      console.error(chalk.yellow("💡 Token generation failed. Check your API_JWT_SECRET environment variable"))
    } else {
      console.error(chalk.yellow("💡 Use --auth to auto-generate a token or --token <JWT> to provide one"))
      console.error(chalk.yellow(`💡 You can create a token manually with: bun jwt create --sub "${endpoint}"`))
    }
    process.exit(1)
  }
}

program.name("try").description("Interactive API endpoint tester for dave-io-nuxt").version("1.0.0")

program
  .option("-t, --token <token>", "JWT token for authentication")
  .option("-a, --auth", "Auto-generate temporary token with required scopes")
  .option("--local", "Use local development server (http://localhost:3000)")
  .option("--remote", "Use remote server (https://dave.io) [default]")
  .option("-d, --dry-run", "Show what would be done without making actual requests")
  .option("-v, --verbose", "Maximize output (show request/response details)")
  .option("-q, --quiet", "Minimize output (show only essential data)")
  .option("-y, --yes", "Skip confirmations")
  .option("-s, --script", "Enable script mode (JSON output for interoperability)")

// AI Commands
const aiCommand = program.command("ai").description("AI-powered operations")
const aiAltCommand = aiCommand.command("alt").description("Generate alt-text for images")

aiAltCommand
  .command("url <imageUrl>")
  .description("Generate alt-text from image URL")
  .action(async (imageUrl, _options, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "ai:alt")
    validateToken(config, "ai:alt", options.auth || false)

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.generateAltTextFromUrl(imageUrl),
      `Generating alt-text for ${imageUrl}`,
      options
    )

    await displayResult(result, options, "AI Alt-Text Generation")
  })

aiAltCommand
  .command("file <filePath>")
  .description("Generate alt-text from image file")
  .action(async (filePath, _options, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "ai:alt")
    validateToken(config, "ai:alt", options.auth || false)

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.generateAltTextFromFile(filePath),
      `Generating alt-text for ${filePath}`,
      options
    )

    await displayResult(result, options, "AI Alt-Text Generation")
  })

// AI Tickets Commands
const aiTicketsCommand = aiCommand.command("tickets").description("AI-powered Linear ticket operations")

aiTicketsCommand
  .command("title")
  .description("Generate a ticket title from description and/or image")
  .option("--description <text>", "Description text to generate title from")
  .option("--image <filePath>", "Image file to analyze for title generation")
  .action(async (cmdOptions, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    if (!cmdOptions.description && !cmdOptions.image) {
      console.error(chalk.red("❌ Either --description or --image must be provided"))
      process.exit(1)
    }

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.generateTicketTitle(cmdOptions.description, cmdOptions.image),
      "Generating ticket title",
      options
    )

    await displayResult(result, options, "AI Ticket Title Generation")
  })

aiTicketsCommand
  .command("description <title>")
  .description("Generate a ticket description from title")
  .action(async (title, _cmdOptions, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.generateTicketDescription(title),
      `Generating description for "${title}"`,
      options
    )

    await displayResult(result, options, "AI Ticket Description Generation")
  })

aiTicketsCommand
  .command("enrich <title>")
  .description("Enrich a ticket description with additional context")
  .option("--description <text>", "Existing description to enrich")
  .option("--image <filePath>", "Image file for additional context")
  .action(async (title, cmdOptions, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    if (!cmdOptions.description && !cmdOptions.image) {
      console.error(chalk.red("❌ Either --description or --image must be provided in addition to title"))
      process.exit(1)
    }

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.enrichTicketDescription(title, cmdOptions.description, cmdOptions.image),
      `Enriching description for "${title}"`,
      options
    )

    await displayResult(result, options, "AI Ticket Description Enrichment")
  })

// Images Commands
const imagesCommand = program.command("images").description("Image optimisation operations")
const imagesOptimiseCommand = imagesCommand.command("optimise").description("Optimise images for web")

imagesOptimiseCommand
  .command("url <imageUrl>")
  .description("Optimise image from URL")
  .option("-q, --quality <number>", "Image quality (0-100)", (value) => Number.parseInt(value), 80)
  .action(async (imageUrl, cmdOptions, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    const adapter = new ImagesAdapter(config)
    const result = await withSpinner(
      adapter.optimiseFromUrl(imageUrl, cmdOptions.quality),
      `Optimising image ${imageUrl}`,
      options
    )

    await displayResult(result, options, "Image Optimisation")
  })

imagesOptimiseCommand
  .command("file <filePath>")
  .description("Optimise image from file")
  .option("-q, --quality <number>", "Image quality (0-100)", (value) => Number.parseInt(value), 80)
  .action(async (filePath, cmdOptions, command) => {
    const options = command.parent?.parent?.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    const adapter = new ImagesAdapter(config)
    const result = await withSpinner(
      adapter.optimiseFromFile(filePath, cmdOptions.quality),
      `Optimising image ${filePath}`,
      options
    )

    await displayResult(result, options, "Image Optimisation")
  })

// Tokens Commands
const tokensCommand = program.command("tokens").description("Token management operations")

tokensCommand
  .command("info <uuid>")
  .description("Get token information")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "api:tokens")
    validateToken(config, "api:tokens", options.auth || false)

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.getTokenInfo(uuid), `Getting token info for ${uuid}`, options)

    await displayResult(result, options, "Token Info")
  })

tokensCommand
  .command("usage <uuid>")
  .description("Get token usage statistics")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "api:tokens")
    validateToken(config, "api:tokens", options.auth || false)

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.getTokenUsage(uuid), `Getting token usage for ${uuid}`, options)

    await displayResult(result, options, "Token Usage")
  })

tokensCommand
  .command("revoke <uuid>")
  .description("Revoke a token")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "api:tokens")
    validateToken(config, "api:tokens", options.auth || false)

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.revokeToken(uuid), `Revoking token ${uuid}`, options)

    await displayResult(result, options, "Token Revocation")
  })

tokensCommand
  .command("unrevoke <uuid>")
  .description("Unrevoke a token")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "api:tokens")
    validateToken(config, "api:tokens", options.auth || false)

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.unrevokeToken(uuid), `Unrevoking token ${uuid}`, options)

    await displayResult(result, options, "Token Unrevocation")
  })

tokensCommand
  .command("operation <uuid> <path>")
  .description("Perform dynamic operation on token endpoint")
  .action(async (uuid, path, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "api:tokens")
    validateToken(config, "api:tokens", options.auth || false)

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(
      adapter.dynamicTokenOperation(uuid, path),
      `Performing operation ${path} on token ${uuid}`,
      options
    )

    await displayResult(result, options, "Token Operation")
  })

// Ping Command (top-level)
program
  .command("ping")
  .description("Ping the server and get comprehensive status including auth and headers")
  .action(async (_options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options)

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.ping(), "Getting comprehensive server status", options)

    await displayResult(result, options, "Server Status")
  })

// Dashboard Commands
const dashboardCommand = program.command("dashboard").description("Dashboard data operations")

dashboardCommand
  .command("<name>")
  .description("Get dashboard data by name")
  .action(async (name, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = await createConfig(options, "dashboard")
    validateToken(config, "dashboard", options.auth || false)

    const adapter = new DashboardAdapter(config)
    const result = await withSpinner(adapter.getDashboardData(name), `Getting dashboard data for ${name}`, options)

    await displayResult(result, options, "Dashboard Data")
  })

// Help text
program.addHelpText(
  "after",
  `
${chalk.bold("Command Structure:")}
  ${chalk.cyan("bun try")} ${chalk.yellow("<category>")} ${chalk.green("[subcategory]")} ${chalk.blue("[variant]")} ${chalk.magenta("<arguments>")} ${chalk.gray("[options]")}

${chalk.bold("Available Commands:")}

${chalk.cyan("AI Operations:")}
  bun try ai alt url <imageUrl>          Generate alt-text from image URL
  bun try ai alt file <filePath>         Generate alt-text from local image file
  bun try ai tickets title --description "text" [--image file.png]    Generate ticket title
  bun try ai tickets description "title"          Generate ticket description from title
  bun try ai tickets enrich "title" --description "text" [--image file.png]    Enrich ticket description

${chalk.cyan("Image Optimisation:")}
  bun try images optimise url <imageUrl> [--quality N]    Optimise image from URL
  bun try images optimise file <filePath> [--quality N]   Optimise local image file

${chalk.cyan("System Status:")}
  bun try ping                           Get comprehensive server status (health, auth, headers)

${chalk.cyan("Token Management:")}
  bun try tokens info <uuid>             Get token information
  bun try tokens usage <uuid>            Get token usage statistics
  bun try tokens revoke <uuid>           Revoke a token
  bun try tokens unrevoke <uuid>         Unrevoke a token
  bun try tokens operation <uuid> <path> Perform custom token operation

${chalk.cyan("Dashboard Data:")}
  bun try dashboard <name>               Get dashboard data by name

${chalk.bold("Examples:")}
  ${chalk.cyan("# Public endpoints (no authentication)")}
  bun try ping
  bun try images optimise file "./image.png" --quality 75
  bun try images optimise url "https://example.com/image.jpg"

  ${chalk.cyan("# Authenticated endpoints (requires token)")}
  bun try --auth ai alt url "https://example.com/image.jpg"     # Auto-generate token
  bun try --token "eyJ..." ai alt file "./image.png"           # Use provided token
  bun try --auth dashboard hacker-news                         # Auto-generate token

  ${chalk.cyan("# AI Tickets (public, no authentication)")}
  bun try ai tickets title --description "Fix the login bug"
  bun try ai tickets title --image "./screenshot.png"
  bun try ai tickets description "Fix login authentication"
  bun try ai tickets enrich "Fix login" --description "Users can't log in" --image "./error.png"

  ${chalk.cyan("# Environment selection")}
  bun try --local ping                   # Local development
  bun try --remote ping                  # Remote production [default]

  ${chalk.cyan("# Output control")}
  bun try --script ping                  # JSON output for scripting
  bun try --quiet ping                   # Minimal output
  bun try --verbose ping                 # Detailed output
  bun try --dry-run ai alt url "..."     # Show what would be done

${chalk.bold("Authentication Options:")}
  ${chalk.yellow("-t, --token <JWT>")}   Use specific JWT token for authentication
  ${chalk.yellow("-a, --auth")}          Auto-generate temporary token with required scopes

${chalk.bold("Environment Variables:")}
  ${chalk.yellow("API_JWT_SECRET")}      JWT secret for authentication (required for --auth)

${chalk.bold("Manual Token Creation:")}
  ${chalk.green("bun jwt create --sub 'ai:alt' --description 'AI testing'")}
  ${chalk.green("bun jwt create --sub 'api:tokens' --description 'Token management'")}
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { createConfig, generateTokenForScope, validateToken }
