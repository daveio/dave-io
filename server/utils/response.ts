import type { H3Event } from "h3"
import { createError, sendRedirect } from "h3"
import { getCloudflareRequestInfo } from "./cloudflare"
import { prepareSortedApiResponse } from "./json-utils"
import type { ApiErrorResponse, ApiSuccessResponse } from "./schemas"

export interface ApiResponse<T = unknown> {
  ok: boolean
  result?: T
  message?: string
  error?: string
  status?: { message?: string }
  meta?: {
    total?: number
    page?: number
    per_page?: number
    total_pages?: number
    request_id?: string
  }
  timestamp: string
}

export interface ApiResponseOptions<T> {
  result: T
  message?: string | null
  error?: string | null
  meta?: ApiResponse<T>["meta"]
  redirect?: string | null
  code?: number
}

export function createApiResponse<T>(options: ApiResponseOptions<T>): ApiSuccessResponse | ApiErrorResponse {
  // Handle redirects
  if (options.redirect) {
    // For redirects, we need to use h3's built-in redirect capabilities
    // But we need to construct a proper response object first
    const responseObj: ApiSuccessResponse = prepareSortedApiResponse({
      ok: true,
      result: {} as T, // Empty result for redirects
      error: null,
      status: { message: `Redirecting to ${options.redirect}` },
      timestamp: new Date().toISOString()
    });

    // Then throw an error with the redirect status code
    // This is how H3 expects redirects to be handled
    throw createError({
      statusCode: options.code || 302,
      statusMessage: `Redirect to ${options.redirect}`,
      data: responseObj
    })
  }
  const timestamp = new Date().toISOString()

  const { result, message, error, meta, redirect, code } = options

  // If there's an error message, return an error response
  if (error) {
    const response: ApiErrorResponse = {
      ok: false,
      error,
      status: message ? { message } : null,
      timestamp
    }

    if (meta) {
      response.meta = meta
    }

    // Handle custom status code for errors
    if (code) {
      throw createError({
        statusCode: code,
        statusMessage: error,
        data: prepareSortedApiResponse(response)
      })
    }

    // Default error response with 500 status code
    throw createError({
      statusCode: 500,
      statusMessage: error,
      data: prepareSortedApiResponse(response)
    })
  } else {
    // Success response
    const response: ApiSuccessResponse = {
      ok: true,
      result: result ?? {}, // Ensure result is never undefined
      error: null,
      status: message ? { message } : null,
      timestamp
    }

    if (message) {
      response.message = message
    }

    if (meta) {
      response.meta = meta
    }

    // Handle custom status code for success
    if (code) {
      throw createError({
        statusCode: code,
        statusMessage: message || "OK",
        data: prepareSortedApiResponse(response)
      })
    }

    return prepareSortedApiResponse(response)
  }
}

export function createApiError(statusCode: number, message: string, details?: unknown): never {
  const errorData: ApiErrorResponse = {
    ok: false,
    error: message,
    status: null,
    details: process.env.NODE_ENV === "development" ? details : undefined,
    meta: {
      request_id: generateRequestId()
    },
    timestamp: new Date().toISOString()
  }

  throw createError({
    statusCode,
    statusMessage: message,
    data: prepareSortedApiResponse(errorData)
  })
}

export function validateInput(
  input: unknown,
  schema: Record<
    string,
    { required?: boolean; type?: "string" | "number" | "boolean" | "object"; maxLength?: number; pattern?: RegExp }
  >
): boolean {
  // Basic validation - in production, use a proper validation library like Zod
  if (!input || typeof input !== "object") {
    return false
  }

  const inputObj = input as Record<string, unknown>
  for (const [key, rules] of Object.entries(schema)) {
    const value = inputObj[key]
    if (rules.required && (value === undefined || value === null || value === "")) {
      return false
    }
    if (value && rules.type) {
      const valueType = typeof value
      if (valueType !== rules.type) {
        return false
      }
    }
    if (value && rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
      return false
    }
    if (value && rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
      return false
    }
  }

  return true
}

export function sanitizeInput(input: unknown): string {
  let stringValue: string
  const seen = new WeakSet()

  if (input === null) {
    stringValue = "null"
  } else if (input === undefined) {
    stringValue = "undefined"
  } else if (typeof input === "string") {
    stringValue = input
  } else if (typeof input === "number" || typeof input === "boolean") {
    stringValue = String(input)
  } else if (typeof input === "object") {
    try {
      stringValue = JSON.stringify(input)
    } catch {
      // Handle circular references
      try {
        stringValue = JSON.stringify(input, (_key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return "[Circular]"
            }
            seen.add(value)
          }
          return value
        })
      } catch {
        stringValue = "[Object]"
      }
    }
  } else {
    stringValue = String(input)
  }

  // Sanitize HTML characters
  const sanitized = stringValue
    .replace(/[<>"'&]/g, (char) => {
      switch (char) {
        case "<":
          return "&lt;"
        case ">":
          return "&gt;"
        case '"':
          return "&quot;"
        case "'":
          return "&#x27;"
        case "&":
          return "&amp;"
        default:
          return char
      }
    })
    .trim()

  // Truncate if too long
  if (sanitized.length > 1000) {
    return `${sanitized.slice(0, 997)}...`
  }

  return sanitized
}

function generateRequestId(): string {
  // Use crypto.randomUUID if available in Worker runtime, fallback to timestamp+random
  try {
    return `req_${crypto.randomUUID()}`
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
}

// Type guard for API errors
export function isApiError(error: unknown): error is { statusCode: number; message?: string } {
  return typeof error === "object" && error !== null && "statusCode" in error
}

/**
 * Standardized request logging for all endpoints
 * Format: [ENDPOINT] method | status | IP | Country | Ray | UA | extras
 */
export function logRequest(
  event: H3Event,
  endpoint: string,
  method: string,
  statusCode: number,
  extras?: Record<string, unknown>
): void {
  const cfInfo = getCloudflareRequestInfo(event)
  const extrasStr = extras
    ? ` | ${Object.entries(extras)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ")}`
    : ""

  console.log(
    `[${endpoint.toUpperCase()}] ${method} | ${statusCode} | IP: ${cfInfo.ip} | Country: ${cfInfo.country} | Ray: ${cfInfo.ray} | UA: ${cfInfo.userAgent.substring(0, 50)}${cfInfo.userAgent.length > 50 ? "..." : ""}${extrasStr}`
  )
}
