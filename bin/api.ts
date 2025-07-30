#!/usr/bin/env bun
import { Command } from "commander"
import { getJWTSecret } from "./shared/cli-utils"

const program = new Command()

interface TestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  response?: unknown
  error?: string
  duration: number
}

interface TestSuite {
  name: string
  results: TestResult[]
  passed: number
  failed: number
  duration: number
}

class APITester {
  private baseUrl: string
  public tokens: Map<string, string> = new Map()
  private secret: string
  private scriptMode: boolean
  private isLocal: boolean

  constructor(baseUrl = "https://dave.io", secret?: string, scriptMode = false) {
    this.baseUrl = baseUrl.replace(/\/$/, "") // Remove trailing slash
    this.secret = secret || getJWTSecret() || "dev-secret-change-in-production"
    this.scriptMode = scriptMode
    this.isLocal = baseUrl.includes("localhost")
  }

  // Initialize KV data for local testing
  async initializeKVData(dryRun = false) {
    if (!this.scriptMode) {
      console.log(`🔧 Initializing KV data for testing${dryRun ? " [DRY RUN]" : ""}...`)
    }

    if (dryRun) {
      if (!this.scriptMode) {
        console.log("📋 Would run KV import with data/kv/_init.yaml")
      }
      return
    }

    try {
      const { spawn } = await import("bun")

      // Use kv CLI to import initial data with appropriate flag
      const kvArgs = ["bun", "run", "bin/kv.ts", "import", "data/kv/_init.yaml", "--wipe", "--yes"]
      if (this.isLocal) {
        kvArgs.push("--local")
      }

      const process = spawn(kvArgs, {
        stdout: "pipe",
        stderr: "pipe"
      })

      const result = await process.exited

      if (result !== 0) {
        if (!this.scriptMode) {
          console.warn("⚠️ Failed to initialize KV data - tests may fail")
        }
      } else if (!this.scriptMode) {
        console.log("✅ KV data initialized successfully")
      }
    } catch (error) {
      if (!this.scriptMode) {
        console.warn("⚠️ Failed to initialize KV data:", error)
      }
    }
  }

  // Generate JWT tokens for testing using bin/jwt.ts with --script mode
  async generateTokens(dryRun = false) {
    if (!this.scriptMode) {
      console.log(`🔐 Generating test tokens${dryRun ? " [DRY RUN]" : ""}...`)
    }

    // Token configurations
    const tokenConfigs = [
      { key: "admin", sub: "*", description: "Test admin token with full permissions" },
      { key: "ai", sub: "ai:alt", description: "Test AI token" },
      { key: "limited", sub: "api", description: "Test limited token" }
    ]

    if (dryRun) {
      if (!this.scriptMode) {
        console.log(`📋 Would generate ${tokenConfigs.length} JWT tokens:`)
        for (const config of tokenConfigs) {
          console.log(`   - ${config.key}: ${config.sub} (${config.description})`)
        }
      }
      return
    }

    try {
      // Generate tokens using jwt CLI with --script mode
      for (const config of tokenConfigs) {
        const { spawn } = await import("bun")

        const jwtArgs = [
          "bun",
          "run",
          "bin/jwt.ts",
          "create",
          "--script",
          "--sub",
          config.sub,
          "--description",
          config.description,
          "--expiry",
          "1h",
          "--secret",
          this.secret
        ]

        // Add local/remote flag for KV operations
        if (this.isLocal) {
          jwtArgs.push("--local")
        }

        const process = spawn(jwtArgs, {
          stdout: "pipe",
          stderr: "pipe"
        })

        const output = await new Response(process.stdout).text()
        const result = await process.exited

        if (result !== 0) {
          throw new Error(`Failed to generate ${config.key} token`)
        }

        const tokenData = JSON.parse(output)
        if (!tokenData.success || !tokenData.token) {
          throw new Error(`Invalid token response for ${config.key}`)
        }

        this.tokens.set(config.key, tokenData.token)
      }

      if (!this.scriptMode) {
        console.log("✅ Generated tokens for: admin, ai, limited")
        console.log("🔗 Token URLs for manual testing:")
        console.log(
          `   AI: ${this.baseUrl}/api/ai/alt?token=${this.tokens.get("ai")}&url=https://example.com/image.jpg`
        )
      }
    } catch (error) {
      if (!this.scriptMode) {
        console.error("❌ Failed to generate tokens:", error)
      }
      throw error
    }
  }

  // Make HTTP request with optional auth
  async makeRequest(
    endpoint: string,
    method = "GET",
    token?: string,
    body?: unknown,
    headers: Record<string, string> = {},
    expectedStatus?: number | number[]
  ): Promise<TestResult> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${endpoint}`

    try {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers
      }

      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }

      const requestInit: RequestInit = {
        method,
        headers: requestHeaders,
        redirect: "manual" // Don't follow redirects automatically
      }

      if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        requestInit.body = JSON.stringify(body)
      }

      const response = await fetch(url, requestInit)
      const duration = Date.now() - startTime

      let responseData: unknown
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/json")) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      // Determine success based on expected status codes or default to response.ok
      let success: boolean
      if (expectedStatus !== undefined) {
        const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
        success = expectedStatuses.includes(response.status)
      } else {
        success = response.ok
      }

      return {
        endpoint,
        method,
        status: response.status,
        success,
        response: responseData,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        endpoint,
        method,
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      }
    }
  }

  // Test AI endpoints
  async testAI(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n🤖 Testing AI Endpoints...")
    }

    // Test AI alt-text without auth (should return 401)
    results.push(await this.makeRequest("/api/ai/alt", "GET", undefined, undefined, {}, 401))

    // Test AI alt-text GET with url parameter (should return 200 or 400)
    results.push(
      await this.makeRequest(
        "/api/ai/alt?url=https://example.com/image.jpg",
        "GET",
        this.tokens.get("ai"),
        undefined,
        {},
        [200, 400]
      )
    )

    // Test AI alt-text POST with URL in body (should return 200 or 400)
    results.push(
      await this.makeRequest(
        "/api/ai/alt",
        "POST",
        this.tokens.get("ai"),
        {
          url: "https://example.com/test.png"
        },
        {},
        [200, 400]
      )
    )

    // Test AI alt-text with invalid URL (should return 400)
    results.push(
      await this.makeRequest("/api/ai/alt?url=invalid-url", "GET", this.tokens.get("ai"), undefined, {}, 400)
    )

    // Test AI alt-text with wrong permission token (should return 401)
    results.push(
      await this.makeRequest(
        "/api/ai/alt?url=https://example.com/image.jpg",
        "GET",
        this.tokens.get("limited"),
        undefined,
        {},
        401
      )
    )

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "AI Endpoints",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Test redirect endpoints
  async testRedirects(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n🔗 Testing Redirect Endpoints...")
    }

    // Test Mastodon redirect (should return 302 redirect)
    results.push(await this.makeRequest("/go/mastodon", "GET", undefined, undefined, {}, [302, 301, 307, 308]))

    // Test public key redirect (should return 302 redirect)
    results.push(await this.makeRequest("/go/key", "GET", undefined, undefined, {}, [302, 301, 307, 308]))

    // Test wat redirect (should return 302 redirect)
    results.push(await this.makeRequest("/go/wat", "GET", undefined, undefined, {}, [302, 301, 307, 308]))

    // Test invalid redirect slug (should return 404)
    results.push(await this.makeRequest("/go/xxinvalidxx", "GET", undefined, undefined, {}, 404))

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Redirects",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Test token management endpoints
  async testTokens(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n🎫 Testing Token Management Endpoints...")
    }

    const testUuid = "550e8400-e29b-41d4-a716-446655440000"

    // Test token usage without auth (should return 401)
    results.push(await this.makeRequest(`/api/token/${testUuid}`, "GET", undefined, undefined, {}, 401))

    // Test token usage with valid auth (should return 404 since token likely doesn't exist)
    results.push(await this.makeRequest(`/api/token/${testUuid}`, "GET", this.tokens.get("admin"), undefined, {}, 404))

    // Test token revocation (should return 404 since token likely doesn't exist)
    results.push(
      await this.makeRequest(
        `/api/token/${testUuid}/revoke`,
        "GET",
        this.tokens.get("admin"),
        undefined,
        {},
        [200, 404]
      )
    )

    // Test invalid UUID format (should return 400)
    results.push(await this.makeRequest("/api/token/invalid-uuid", "GET", this.tokens.get("admin"), undefined, {}, 400))

    // Test malformed UUID (should return 400)
    results.push(
      await this.makeRequest(
        "/api/token/11111111-2222-3333-4444-555555555555",
        "GET",
        this.tokens.get("admin"),
        undefined,
        {},
        400
      )
    )

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Token Management",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Test health endpoint
  async testHealth(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n❤️ Testing Health Endpoint...")
    }

    const pingResult = await this.makeRequest("/api/ping")

    // Validate ping response structure
    if (pingResult.success && pingResult.response && typeof pingResult.response === "object") {
      const response = pingResult.response as any

      // Check for expected structure
      const hasValidStructure =
        response.result && response.result.pingData && Array.isArray(response.result.pingData.redirects)

      if (!hasValidStructure) {
        pingResult.success = false
        pingResult.error = "Missing redirects field in ping response"
      }
    }

    results.push(pingResult)

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Health",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Test ping endpoint (merged from health, ping, worker)
  async testInternal(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n🔧 Testing Ping Endpoint...")
    }

    // Test ping endpoint (should be public and provide all system info)
    const pingResult = await this.makeRequest("/api/ping")

    // Validate ping response structure and redirects field
    if (pingResult.success && pingResult.response && typeof pingResult.response === "object") {
      const response = pingResult.response as any

      // Check for expected structure with redirects field
      const hasValidStructure =
        response.result && response.result.pingData && Array.isArray(response.result.pingData.redirects)

      if (!hasValidStructure) {
        pingResult.success = false
        pingResult.error = "Missing or invalid redirects field in ping response"
      } else if (!this.scriptMode) {
        // Log redirects count for validation
        console.log(`   ✅ Found ${response.result.pingData.redirects.length} redirects in ping response`)
      }
    }

    results.push(pingResult)

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Internal",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Print test results
  printResults(suites: TestSuite[]) {
    let totalPassed = 0
    let totalFailed = 0
    let totalDuration = 0

    for (const suite of suites) {
      totalPassed += suite.passed
      totalFailed += suite.failed
      totalDuration += suite.duration
    }

    const success = totalFailed === 0

    if (this.scriptMode) {
      // Script mode: output structured JSON
      const output = {
        success,
        summary: {
          totalTests: totalPassed + totalFailed,
          passed: totalPassed,
          failed: totalFailed,
          duration: totalDuration
        },
        suites: suites.map((suite) => ({
          name: suite.name,
          passed: suite.passed,
          failed: suite.failed,
          duration: suite.duration,
          results: suite.results
        }))
      }
      console.log(JSON.stringify(output, null, 2))
    } else {
      // Interactive mode: human-friendly output
      console.log(`\n${"=".repeat(80)}`)
      console.log("🧪 API TEST RESULTS")
      console.log("=".repeat(80))

      for (const suite of suites) {
        const status = suite.failed === 0 ? "✅" : "❌"
        console.log(`\n${status} ${suite.name}: ${suite.passed}/${suite.results.length} passed (${suite.duration}ms)`)

        if (suite.failed > 0) {
          for (const result of suite.results) {
            if (!result.success) {
              console.log(
                `   ❌ ${result.method} ${result.endpoint} - ${result.status || "ERR"} (${result.duration}ms)`
              )
              if (result.error) {
                console.log(`      Error: ${result.error}`)
              }
            }
          }
        }
      }

      console.log(`\n${"-".repeat(80)}`)
      console.log(`📊 SUMMARY: ${totalPassed}/${totalPassed + totalFailed} tests passed (${totalDuration}ms total)`)

      if (totalFailed === 0) {
        console.log("🎉 All tests passed!")
      } else {
        console.log(`😞 ${totalFailed} tests failed`)
      }
      console.log("=".repeat(80))
    }

    return success
  }

  // Test dashboard endpoints
  async testDashboard(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n📊 Testing Dashboard Endpoints...")
    }

    // Test dashboard endpoints (should return 200 if they exist, 404 if they don't)
    results.push(
      await this.makeRequest("/api/dashboard/demo", "GET", this.tokens.get("admin"), undefined, {}, [200, 404])
    )
    results.push(
      await this.makeRequest("/api/dashboard/hacker-news", "GET", this.tokens.get("admin"), undefined, {}, [200, 404])
    )
    results.push(
      await this.makeRequest("/api/dashboard/hackernews", "GET", this.tokens.get("admin"), undefined, {}, [200, 404])
    )
    results.push(
      await this.makeRequest("/api/dashboard/nonexistent", "GET", this.tokens.get("admin"), undefined, {}, 404)
    )

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Dashboard",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Test enhanced token management
  async testTokenManagement(): Promise<TestSuite> {
    const results: TestResult[] = []
    const startTime = Date.now()

    if (!this.scriptMode) {
      console.log("\n🎫 Testing Enhanced Token Management...")
    }

    const testUuid = "550e8400-e29b-41d4-a716-446655440000"

    // Test token usage endpoint (admin token should have permission, but token doesn't exist)
    results.push(
      await this.makeRequest(`/api/token/${testUuid}/usage`, "GET", this.tokens.get("admin"), undefined, {}, 404)
    )

    // Test token revocation endpoint (admin token should have permission and succeed)
    results.push(
      await this.makeRequest(
        `/api/token/${testUuid}/revoke`,
        "POST",
        this.tokens.get("admin"),
        {
          revoked: true
        },
        {},
        200
      )
    )

    // Test invalid UUID (should return 400 for invalid UUID format)
    results.push(
      await this.makeRequest("/api/token/invalid-uuid/usage", "GET", this.tokens.get("admin"), undefined, {}, 400)
    )

    const passed = results.filter((r) => r.success).length
    const failed = results.length - passed

    return {
      name: "Enhanced Token Management",
      results,
      passed,
      failed,
      duration: Date.now() - startTime
    }
  }

  // Run all tests
  async runAllTests(dryRun = false): Promise<boolean> {
    if (!this.scriptMode) {
      console.log(`🚀 Starting API Test Suite${dryRun ? " [DRY RUN]" : ""}`)
      console.log(`📍 Testing against: ${this.baseUrl}`)
    }

    if (dryRun) {
      if (!this.scriptMode) {
        console.log("📋 Would execute the following test suites:")
        console.log("   - Health endpoint")
        console.log("   - Internal endpoints")
        console.log("   - Dashboard")
        console.log("   - AI endpoints")
        console.log("   - Redirects")
        console.log("   - Token management")
        console.log("   - Enhanced token management")
      }
      return true
    }

    // Initialize KV data for local testing
    if (this.isLocal) {
      await this.initializeKVData()
    }

    await this.generateTokens()

    const suites: TestSuite[] = []

    try {
      suites.push(await this.testHealth())
      suites.push(await this.testInternal())
      suites.push(await this.testDashboard())
      suites.push(await this.testAI())
      suites.push(await this.testRedirects())
      suites.push(await this.testTokens())
      suites.push(await this.testTokenManagement())
    } catch (error) {
      console.error("❌ Test suite failed:", error)
      return false
    }

    return this.printResults(suites)
  }
}

// CLI interface
program.name("api").description("HTTP API Test Suite for dave-io-nuxt").version("1.0.0")

// Global script mode option
program.option("--script", "Enable script mode (non-interactive, structured output)")

// Check if script mode is enabled
function isScriptMode(): boolean {
  return program.opts().script || false
}

program
  .option("-u, --url <url>", "Base URL for API testing")
  .option("-s, --secret <secret>", "JWT secret for token generation")
  .option("-t, --token <token>", "Use existing token instead of generating new ones")
  .option("--local", "Test against local development server (http://localhost:3000)")
  .option("--remote", "Test against remote production server (https://dave.io) [default]")
  .option("--ai-only", "Test only AI endpoints")
  .option("--redirects-only", "Test only redirect endpoints")
  .option("--tokens-only", "Test only token management endpoints")
  .option("--health-only", "Test only health endpoint")
  .option("--internal-only", "Test only internal endpoints")
  .option("--dashboard-only", "Test only dashboard endpoints")
  .option("-d, --dry-run", "Show what would be tested without making actual requests")
  .action(async (options) => {
    const scriptMode = isScriptMode()

    // Determine the test URL
    let testUrl = options.url
    if (!testUrl) {
      if (options.local) {
        testUrl = "http://localhost:3000"
      } else {
        // Default to remote (--remote is default)
        testUrl = "https://dave.io"
      }
    }

    const tester = new APITester(testUrl, options.secret, scriptMode)

    if (options.token) {
      // Use provided token for all tests
      tester.tokens.set("admin", options.token)
      tester.tokens.set("ai", options.token)
      tester.tokens.set("limited", options.token)
    }

    let success = false

    try {
      if (options.aiOnly) {
        if (!options.token && !options.dryRun) {
          await tester.generateTokens(options.dryRun)
        }
        const suite = options.dryRun
          ? { name: "AI Endpoints", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testAI()
        success = tester.printResults([suite])
      } else if (options.redirectsOnly) {
        const suite = options.dryRun
          ? { name: "Redirects", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testRedirects()
        success = tester.printResults([suite])
      } else if (options.tokensOnly) {
        if (!options.token && !options.dryRun) {
          await tester.generateTokens(options.dryRun)
        }
        const suite = options.dryRun
          ? { name: "Token Management", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testTokens()
        success = tester.printResults([suite])
      } else if (options.healthOnly) {
        const suite = options.dryRun
          ? { name: "Health", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testHealth()
        success = tester.printResults([suite])
      } else if (options.internalOnly) {
        const suite = options.dryRun
          ? { name: "Internal", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testInternal()
        success = tester.printResults([suite])
      } else if (options.dashboardOnly) {
        if (!options.token && !options.dryRun) {
          await tester.generateTokens(options.dryRun)
        }
        const suite = options.dryRun
          ? { name: "Dashboard", results: [], passed: 0, failed: 0, duration: 0 }
          : await tester.testDashboard()
        success = tester.printResults([suite])
      } else {
        success = await tester.runAllTests(options.dryRun)
      }
    } catch (error) {
      if (scriptMode) {
        const output = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
        console.log(JSON.stringify(output, null, 2))
      } else {
        console.error("❌ Test execution failed:", error)
      }
      process.exit(1)
    }

    process.exit(success ? 0 : 1)
  })

program.addHelpText(
  "after",
  `
Examples:
  bun run test:api                          # Run all tests against dave.io (remote)
  bun run test:api --local                  # Test against localhost:3000
  bun run test:api --url https://custom.io # Test against custom URL
  bun run test:api --ai-only                # Test only AI endpoints
  bun run test:api --token "eyJhbGci..."    # Use existing token
  bun run test:api --secret "my-secret"     # Use custom JWT secret
  bun run test:api --dry-run                # Show what would be tested without running

Environment Variables:
  API_JWT_SECRET                            # Default JWT secret for token generation

Notes:
  - Tests will generate temporary JWT tokens for testing different permissions
  - Ping endpoint tests don't require authentication
  - Redirect tests check for proper redirect responses (3xx status codes)
  - Failed tests will show detailed error information
`
)

async function main(): Promise<void> {
  await program.parseAsync()
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { APITester }
