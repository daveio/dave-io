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
import { getJWTSecret } from "./shared/cli-utils"

const program = new Command()

interface GlobalOptions {
  token?: string
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

function createConfig(options: GlobalOptions): RequestConfig {
  const baseUrl = options.local
    ? "http://localhost:3000"
    : options.remote
      ? "https://next.dave.io"
      : "https://next.dave.io"

  return {
    token: options.token || getJWTSecret() || undefined,
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

  if (quiet && result.success) {
    if (result.data && typeof result.data === "object") {
      console.log(JSON.stringify(result.data, null, 2))
    } else if (result.message) {
      console.log(result.message)
    }
    return
  }

  const statusIcon = result.success ? "✅" : "❌"
  const statusColor = result.success ? chalk.green : chalk.red
  const boxTitle = title ? `${statusIcon} ${title}` : `${statusIcon} API Response`

  const content = []

  if (result.success) {
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
    borderStyle: result.success ? "round" : "double",
    borderColor: result.success ? "green" : "red",
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

function validateToken(config: RequestConfig, endpoint: string): void {
  if (!config.token) {
    console.error(chalk.red("❌ No token provided. Set API_JWT_SECRET environment variable or use --token option"))
    console.error(chalk.yellow(`💡 You can create a token with: bun jwt create --sub "${endpoint}"`))
    process.exit(1)
  }
}

program.name("try").description("Interactive API endpoint tester for dave-io-nuxt").version("1.0.0")

program
  .option("-t, --token <token>", "JWT token for authentication")
  .option("--local", "Use local development server (http://localhost:3000)")
  .option("--remote", "Use remote server (https://next.dave.io) [default]")
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
    const config = createConfig(options)
    validateToken(config, "ai:alt")

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
    const config = createConfig(options)
    validateToken(config, "ai:alt")

    const adapter = new AIAdapter(config)
    const result = await withSpinner(
      adapter.generateAltTextFromFile(filePath),
      `Generating alt-text for ${filePath}`,
      options
    )

    await displayResult(result, options, "AI Alt-Text Generation")
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
    const config = createConfig(options)

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
    const config = createConfig(options)

    const adapter = new ImagesAdapter(config)
    const result = await withSpinner(
      adapter.optimiseFromFile(filePath, cmdOptions.quality),
      `Optimising image ${filePath}`,
      options
    )

    await displayResult(result, options, "Image Optimisation")
  })

// Internal Commands
const internalCommand = program.command("internal").description("Internal system operations")

internalCommand
  .command("health")
  .description("Check system health")
  .action(async (_options, command) => {
    const options = command.parent?.parent?.opts() as GlobalOptions
    const config = createConfig(options)

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.health(), "Checking system health", options)

    await displayResult(result, options, "Health Check")
  })

internalCommand
  .command("ping")
  .description("Ping the server")
  .action(async (_options, command) => {
    const options = command.parent?.parent?.opts() as GlobalOptions
    const config = createConfig(options)

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.ping(), "Pinging server", options)

    await displayResult(result, options, "Ping")
  })

internalCommand
  .command("worker")
  .description("Get worker runtime information")
  .action(async (_options, command) => {
    const options = command.parent?.parent?.opts() as GlobalOptions
    const config = createConfig(options)

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.worker(), "Getting worker info", options)

    await displayResult(result, options, "Worker Info")
  })

internalCommand
  .command("headers")
  .description("Debug request headers")
  .action(async (_options, command) => {
    const options = command.parent?.parent?.opts() as GlobalOptions
    const config = createConfig(options)

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.headers(), "Getting headers", options)

    await displayResult(result, options, "Headers Debug")
  })

internalCommand
  .command("auth")
  .description("Validate JWT token")
  .action(async (_options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "any")

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.auth(), "Validating token", options)

    await displayResult(result, options, "Token Validation")
  })

internalCommand
  .command("metrics")
  .description("Get API metrics")
  .option("-f, --format <format>", "Output format (json|yaml|prometheus)", "json")
  .action(async (cmdOptions, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:metrics")

    const adapter = new InternalAdapter(config)
    const result = await withSpinner(adapter.metrics(cmdOptions.format), "Getting metrics", options)

    await displayResult(result, options, "API Metrics")
  })

// Tokens Commands
const tokensCommand = program.command("tokens").description("Token management operations")

tokensCommand
  .command("info <uuid>")
  .description("Get token information")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:tokens")

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.getTokenInfo(uuid), `Getting token info for ${uuid}`, options)

    await displayResult(result, options, "Token Info")
  })

tokensCommand
  .command("usage <uuid>")
  .description("Get token usage statistics")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:tokens")

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.getTokenUsage(uuid), `Getting token usage for ${uuid}`, options)

    await displayResult(result, options, "Token Usage")
  })

tokensCommand
  .command("revoke <uuid>")
  .description("Revoke a token")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:tokens")

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.revokeToken(uuid), `Revoking token ${uuid}`, options)

    await displayResult(result, options, "Token Revocation")
  })

tokensCommand
  .command("unrevoke <uuid>")
  .description("Unrevoke a token")
  .action(async (uuid, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:tokens")

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(adapter.unrevokeToken(uuid), `Unrevoking token ${uuid}`, options)

    await displayResult(result, options, "Token Unrevocation")
  })

tokensCommand
  .command("operation <uuid> <path>")
  .description("Perform dynamic operation on token endpoint")
  .action(async (uuid, path, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "api:tokens")

    const adapter = new TokensAdapter(config)
    const result = await withSpinner(
      adapter.dynamicTokenOperation(uuid, path),
      `Performing operation ${path} on token ${uuid}`,
      options
    )

    await displayResult(result, options, "Token Operation")
  })

// Dashboard Commands
const dashboardCommand = program.command("dashboard").description("Dashboard data operations")

dashboardCommand
  .command("<name>")
  .description("Get dashboard data by name")
  .action(async (name, _options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "dashboard")

    const adapter = new DashboardAdapter(config)
    const result = await withSpinner(adapter.getDashboardData(name), `Getting dashboard data for ${name}`, options)

    await displayResult(result, options, "Dashboard Data")
  })

dashboardCommand
  .command("live")
  .description("Get live dashboard updates")
  .action(async (_options, command) => {
    const options = command.parent?.opts() as GlobalOptions
    const config = createConfig(options)
    validateToken(config, "dashboard")

    const adapter = new DashboardAdapter(config)
    const result = await withSpinner(adapter.getLiveDashboard(), "Getting live dashboard data", options)

    await displayResult(result, options, "Live Dashboard")
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

${chalk.cyan("Image Optimisation:")}
  bun try images optimise url <imageUrl> [--quality N]    Optimise image from URL
  bun try images optimise file <filePath> [--quality N]   Optimise local image file

${chalk.cyan("Internal System:")}
  bun try internal health                Check system health status
  bun try internal ping                  Ping the server
  bun try internal worker                Get worker runtime information
  bun try internal headers               Debug request headers
  bun try internal auth                  Validate JWT token
  bun try internal metrics [--format]   Get API metrics (json|yaml|prometheus)

${chalk.cyan("Token Management:")}
  bun try tokens info <uuid>             Get token information
  bun try tokens usage <uuid>            Get token usage statistics
  bun try tokens revoke <uuid>           Revoke a token
  bun try tokens unrevoke <uuid>         Unrevoke a token
  bun try tokens operation <uuid> <path> Perform custom token operation

${chalk.cyan("Dashboard Data:")}
  bun try dashboard <name>               Get dashboard data by name
  bun try dashboard live                 Get live dashboard updates

${chalk.bold("Examples:")}
  ${chalk.cyan("# Public endpoints (no authentication)")}
  bun try internal health
  bun try internal ping
  bun try internal worker
  bun try images optimise file "./image.png" --quality 75
  bun try images optimise url "https://example.com/image.jpg"

  ${chalk.cyan("# Authenticated endpoints (requires token)")}
  bun try --token "eyJ..." internal auth
  bun try internal metrics
  bun try ai alt url "https://example.com/image.jpg"
  bun try ai alt file "./image.png"
  bun try dashboard hacker-news

  ${chalk.cyan("# Environment selection")}
  bun try --local internal health        # Local development
  bun try --remote internal health       # Remote production [default]

  ${chalk.cyan("# Output control")}
  bun try --script internal health       # JSON output for scripting
  bun try --quiet internal health        # Minimal output
  bun try --verbose internal health      # Detailed output
  bun try --dry-run ai alt url "..."     # Show what would be done

${chalk.bold("Environment Variables:")}
  ${chalk.yellow("API_JWT_SECRET")}      JWT secret for authentication

${chalk.bold("Token Creation:")}
  ${chalk.green("bun jwt create --sub 'ai:alt' --description 'AI testing'")}
  ${chalk.green("bun jwt create --sub 'api:metrics' --description 'Metrics access'")}
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { createConfig }
