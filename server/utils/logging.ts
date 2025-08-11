import type { H3Event } from "h3"
import { getHeaders, getHeader } from "h3"
import type { AuthResult } from "./auth"
import type { CloudflareRequestInfo } from "./cloudflare"
import { getCloudflareRequestInfo } from "./cloudflare"

/**
 * Log levels for structured logging
 * Aligned with Cloudflare Workers standard log levels
 */
export type LogLevel = "error" | "warn" | "log" | "debug"

/**
 * Common context data available in all endpoints from H3Event
 */
export interface EndpointContext {
  /** Request information */
  request: {
    /** HTTP method */
    method: string
    /** Request path */
    path: string
    /** Full URL */
    url: string
    /** HTTP version */
    httpVersion: string
    /** User agent string */
    userAgent: string
    /** Request headers */
    headers: Record<string, string | undefined>
  }
  /** Cloudflare-specific information */
  cloudflare: CloudflareRequestInfo
  /** Authentication information if available */
  auth?: {
    /** Whether authentication was successful */
    authenticated: boolean
    /** Subject/user ID from JWT */
    subject?: string
    /** JWT token ID for revocation */
    tokenId?: string
    /** Token permissions */
    permissions?: string[]
    /** Token issued at */
    issuedAt?: Date
    /** Token expiration */
    expiresAt?: Date
  }
  /** Error context if middleware set it */
  errorContext?: {
    requestId: string
    timestamp: string
    cfRay: string
  }
  /** Request ID for tracing */
  requestId: string
  /** Request timestamp */
  timestamp: string
}

/**
 * Structured log entry format
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel
  /** Log message */
  message: string
  /** Common endpoint context */
  context: EndpointContext
  /** Custom data specific to the log entry */
  data?: Record<string, unknown>
  /** Error details if applicable */
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

/**
 * Extract common context from H3 event and optional auth result
 * @param event - H3 event object
 * @param auth - Optional authentication result from auth helpers
 * @returns Complete endpoint context
 */
export function extractEndpointContext(event: H3Event, auth?: AuthResult): EndpointContext {
  const headers = getHeaders(event)
  const cfInfo = getCloudflareRequestInfo(event)

  // Get request ID from header or generate one
  const requestId =
    headers["x-request-id"] ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event.context as any).errorContext?.requestId ||
    crypto.randomUUID()

  const context: EndpointContext = {
    request: {
      method: event.method || event.node.req.method || "GET",
      path: event.path || event.node.req.url || "/",
      url: event.node.req.url || "/",
      httpVersion: event.node.req.httpVersion || "1.1",
      userAgent: getHeader(event, "user-agent") || "unknown",
      headers
    },
    cloudflare: cfInfo,
    requestId,
    timestamp: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorContext: (event.context as any).errorContext
  }

  // Add auth information if provided
  if (auth) {
    context.auth = {
      authenticated: auth.success,
      subject: auth.payload?.sub || auth.sub,
      tokenId: auth.payload?.jti,
      permissions: auth.payload?.permissions,
      issuedAt: auth.payload?.iat ? new Date(auth.payload.iat * 1000) : undefined,
      expiresAt: auth.payload?.exp ? new Date(auth.payload.exp * 1000) : undefined
    }
  }

  return context
}

/**
 * Log structured JSON to the appropriate console method
 * @param level - Log level (error, warn, log, debug)
 * @param message - Log message
 * @param context - Common endpoint context from the event
 * @param data - Optional custom data specific to this log entry
 * @param error - Optional error object for error logging
 * @throws Never throws - handles all errors internally
 *
 * @example
 * ```typescript
 * // In an endpoint after auth
 * const auth = await requireAPIAuth(event, "token")
 * const context = extractEndpointContext(event, auth)
 *
 * // Log info
 * log("log", "Token validated", context, {
 *   tokenUuid: uuid,
 *   operation: "get_usage"
 * })
 *
 * // Log error
 * log("error", "Database query failed", context,
 *   { query: "SELECT * FROM users" },
 *   error
 * )
 * ```
 */
export function log(
  level: LogLevel,
  message: string,
  context: EndpointContext,
  data?: Record<string, unknown>,
  error?: Error | unknown
): void {
  try {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      data
    }

    // Add error details if provided
    if (error) {
      if (error instanceof Error) {
        logEntry.error = {
          message: error.message,
          stack: error.stack,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: (error as any).code
        }
      } else {
        logEntry.error = {
          message: String(error)
        }
      }
    }

    // Output as structured JSON
    const logMessage = JSON.stringify(logEntry)

    // Route to appropriate console method
    // Using Cloudflare Workers standard console methods
    switch (level) {
      case "error":
        console.error(logMessage)
        break
      case "warn":
        console.warn(logMessage)
        break
      case "log":
        console.log(logMessage)
        break
      case "debug":
        // Debug logs use console.log in Workers environment
        console.log(logMessage)
        break
      default:
        console.log(logMessage)
    }
  } catch (logError) {
    // Fallback to basic logging if structured logging fails
    console.error("Failed to create structured log:", logError)
    console.error("Original message:", message)
    if (error) {
      console.error("Original error:", error)
    }
  }
}

/**
 * Create a logger instance bound to a specific context
 * @param context - Endpoint context to bind to all log calls
 * @returns Logger instance with bound context
 *
 * @example
 * ```typescript
 * const auth = await requireAPIAuth(event, "token")
 * const logger = createLogger(extractEndpointContext(event, auth))
 * logger.log("Processing request", { step: "validation" })
 * logger.error("Request failed", { reason: "invalid_token" }, error)
 * ```
 */
export function createLogger(context: EndpointContext) {
  return {
    error: (message: string, data?: Record<string, unknown>, error?: Error | unknown) =>
      log("error", message, context, data, error),
    warn: (message: string, data?: Record<string, unknown>) => log("warn", message, context, data),
    log: (message: string, data?: Record<string, unknown>) => log("log", message, context, data),
    debug: (message: string, data?: Record<string, unknown>) => log("debug", message, context, data),
    // Aliases for backwards compatibility
    info: (message: string, data?: Record<string, unknown>) => log("log", message, context, data),
    trace: (message: string, data?: Record<string, unknown>) => log("debug", message, context, data)
  }
}
