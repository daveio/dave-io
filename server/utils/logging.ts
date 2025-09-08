import type { H3Event } from "h3"
import { getRequestHeader, setResponseHeader } from "h3"

/**
 * Logs the response details for an HTTP event, including status, data, and errors.
 * This function outputs a structured log message to the console for both successful and error responses.
 *
 * Args:
 *   event: The H3Event representing the HTTP request context.
 *   data: The response data to be logged.
 *   code: The HTTP status code of the response.
 *   error: An optional error message string, or null if no error occurred.
 *
 * Returns:
 *   None.
 */
export function logResponse(event: H3Event, data: unknown, code: number, error?: string | null) {
  if (!error) {
    error = null
  }
  const { method, path, headers } = event
  const logJSON = JSON.stringify({
    data,
    code,
    method,
    path,
    headers,
    error,
    requestId: getRequestId(event),
  })
  if (error) {
    console.error(logJSON)
  } else {
    console.log(logJSON)
  }
}

/**
 * Best-effort global request identifier for correlation.
 * Prefers Cloudflare's CF-Ray, then X-Request-Id, else generates one and sets response header.
 */
export function getRequestId(event: H3Event): string {
  // Prefer an ID already computed by middleware
  if (event.context?.requestId) {
    return event.context.requestId
  }

  const cfRay = getRequestHeader(event, "cf-ray")
  if (cfRay) {
    return cfRay
  }

  const existing = getRequestHeader(event, "x-request-id")
  if (existing) {
    return existing
  }

  const generated = (globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`) as string
  try {
    setResponseHeader(event, "x-request-id", generated)
  } catch {
    // ignore header set failures in non-HTTP contexts
  }
  return generated
}

type LogLevel = "debug" | "info" | "warn" | "error"

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>, event?: H3Event) {
  const base: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  }

  if (event) {
    try {
      base.method = event.method
      base.path = event.path
      // Include request correlation if available
      const cfRay = getRequestHeader(event, "cf-ray")
      if (cfRay) {
        base.cfRay = cfRay
      }
      base.requestId = getRequestId(event)
    } catch {
      // ignore
    }
  }

  if (meta && Object.keys(meta).length) {
    for (const [k, v] of Object.entries(meta)) {
      // Avoid overwriting core keys
      if (!(k in base)) {
        base[k] = v
      }
    }
  }

  return JSON.stringify(base)
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>, event?: H3Event) {
  const line = formatLog(level, message, meta, event)
  switch (level) {
    case "debug":
      console.debug(line)
      break
    case "info":
      console.log(line)
      break
    case "warn":
      console.warn(line)
      break
    case "error":
      console.error(line)
      break
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>, event?: H3Event) => emit("debug", message, meta, event),
  info: (message: string, meta?: Record<string, unknown>, event?: H3Event) => emit("info", message, meta, event),
  warn: (message: string, meta?: Record<string, unknown>, event?: H3Event) => emit("warn", message, meta, event),
  error: (message: string, meta?: Record<string, unknown>, event?: H3Event) => emit("error", message, meta, event),
}

export type Logger = typeof logger
