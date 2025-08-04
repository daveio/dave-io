import { createError, getHeader, getMethod, setResponseHeader } from "h3"
import { isApiError } from "../utils/response"

// Error categorization for better error logging
enum ErrorCategory {
  AUTH = "auth",
  VALIDATION = "validation",
  SERVICE = "service",
  INTERNAL = "internal",
  SECURITY = "security"
}

interface ErrorContext {
  requestId: string
  timestamp: string
  ip: string
  userAgent: string
  method: string
  url: string
  cfRay?: string
  country?: string
}

function categorizeError(error: unknown, _context: ErrorContext): ErrorCategory {
  if (isApiError(error)) {
    const { statusCode } = error
    if (statusCode === 401 || statusCode === 403) {
      return ErrorCategory.AUTH
    }
    if (statusCode >= 400 && statusCode < 500) {
      return ErrorCategory.VALIDATION
    }
    if (statusCode >= 500) {
      return ErrorCategory.INTERNAL
    }
  }

  return ErrorCategory.INTERNAL
}

function logError(error: unknown, category: ErrorCategory, context: ErrorContext) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const logEntry = {
    level: "error",
    category,
    message,
    stack,
    context,
    timestamp: context.timestamp,
    // Add additional debugging info
    error_type: error?.constructor?.name || typeof error,
    node_env: process.env.NODE_ENV
  }

  // Log categorized errors for debugging with enhanced formatting
  console.error(
    "[ERROR:%s] %s\nRequest: %s %s\nRequest ID: %s\nDetails:",
    category.toUpperCase(),
    message,
    context.method,
    context.url,
    context.requestId,
    JSON.stringify(logEntry, null, 2)
  )

  // Also log to structured format for potential log aggregation
  console.error("STRUCTURED_ERROR:", JSON.stringify(logEntry))
}

export default defineEventHandler(async (event) => {
  // Apply to both API and redirect routes
  const { url } = event.node.req
  if (!url?.startsWith("/api/") && !url?.startsWith("/go/")) {
    return
  }

  try {
    const method = getMethod(event)
    const userAgent = getHeader(event, "user-agent") || "unknown"
    const ip = getHeader(event, "cf-connecting-ip") || getHeader(event, "x-forwarded-for") || "unknown"
    const cfRay = getHeader(event, "cf-ray") || "unknown"
    const cfCountry = getHeader(event, "cf-ipcountry") || "unknown"
    const requestId = cfRay || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create error context for potential use later
    const errorContext: ErrorContext = {
      requestId,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      method,
      url,
      cfRay,
      country: cfCountry
    }

    // Add API version header for API routes
    if (url.startsWith("/api/")) {
      setHeaders(event, {
        "X-API-Version": "1.0.0"
      })
    }

    // Add security headers for all routes
    setHeaders(event, {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0", // Modern browsers don't need this, can cause issues
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Worker-Environment": "cloudflare",
      "X-Request-ID": requestId
    })

    // Remove sensitive headers
    setResponseHeader(event, "X-Powered-By", "")
    setResponseHeader(event, "Server", "")

    // Store error context for use in error handling
    event.context.errorContext = errorContext
  } catch (error: unknown) {
    const errorContext = (event.context.errorContext as ErrorContext) || {
      requestId: "unknown",
      timestamp: new Date().toISOString(),
      ip: "unknown",
      userAgent: "unknown",
      method: "unknown",
      url: url || "unknown"
    }

    const category = categorizeError(error, errorContext)
    logError(error, category, errorContext)

    // Re-throw API errors as-is
    if (isApiError(error)) {
      throw error
    }

    // Sanitize error details for production
    const isProduction = process.env.NODE_ENV === "production"
    const errorMessage = isProduction
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Unknown error"

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        error: errorMessage,
        requestId: errorContext.requestId,
        category,
        timestamp: errorContext.timestamp
      }
    })
  }
})
