/**
 * Shared CLI utilities and constants for CLI tools
 */

/**
 * Get current timestamp in format YYYY-MM-DD-HHmmss
 */
export function getTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
}

/**
 * Helper function to try parsing JSON and handle integers properly
 */
export function tryParseJson(value: string): unknown {
  // Handle pure integers first (before general JSON parsing)
  if (/^-?\d+$/.test(value)) {
    const num = Number.parseInt(value, 10)
    if (!Number.isNaN(num) && Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
      return num
    }
  }

  // Handle floats
  if (/^-?\d+\.\d+$/.test(value)) {
    const num = Number.parseFloat(value)
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return num
    }
  }

  const jsonPatterns = [
    /^{.*}$/, // Object: {...}
    /^\[.*\]$/, // Array: [...]
    /^(true|false)$/, // Boolean: true or false
    /^null$/ // null
  ]

  const looksLikeJson = jsonPatterns.some((pattern) => pattern.test(value))

  if (looksLikeJson) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

/**
 * Check if a key matches any of the configured patterns
 */
export function keyMatchesPatterns(key: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(key))
}

/**
 * Common environment variable helpers
 */
export function getJWTSecret(): string | null {
  return process.env.API_JWT_SECRET || null
}

/**
 * Duration parsing utilities
 */
export function parseCompoundDuration(duration: string): number | undefined {
  const units: Record<string, number> = {
    w: 604800000, // week
    d: 86400000, // day
    h: 3600000, // hour
    m: 60000, // minute
    s: 1000 // second
  }

  let total = 0
  const remaining = duration.toLowerCase()
  const regex = /(\d+)([wdhms])/g
  let match: RegExpExecArray | null
  let hasMatches = false

  match = regex.exec(remaining)
  while (match !== null) {
    hasMatches = true
    const value = Number.parseInt(match[1] || "0")
    const unit = match[2] || ""
    if (unit && units[unit as keyof typeof units]) {
      total += value * (units[unit as keyof typeof units] || 0)
    }
    match = regex.exec(remaining)
  }

  return hasMatches ? total : undefined
}

/**
 * Parse expiration duration for JWT tokens
 */
export function parseExpiration(expiresIn: string): number {
  let milliseconds: number | undefined
  try {
    milliseconds = parseCompoundDuration(expiresIn)
  } catch {
    milliseconds = undefined
  }

  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    milliseconds = parseCompoundDuration(expiresIn)
  }

  if (typeof milliseconds !== "number" || milliseconds <= 0) {
    console.error(`❌ Invalid expiration format: ${expiresIn}`)
    process.exit(1)
  }
  return Math.floor(milliseconds / 1000)
}
