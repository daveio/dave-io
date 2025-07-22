// Environment-specific functionality - no re-exports to avoid duplicate imports

import { createApiError } from "./response"

/**
 * Environment configuration for controlling fallback behavior
 */
interface EnvironmentConfig {
  /** Whether to allow mock data in development mode */
  allowMockData: boolean
  /** Whether to enable graceful degradation when services are unavailable */
  gracefulDegradation: boolean
  /** Current environment mode */
  environment: "development" | "production" | "test"
}

/**
 * Get environment configuration based on runtime context
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // In production, be strict about service availability
  const isProduction = process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_ENVIRONMENT === "production"

  const isTest = process.env.NODE_ENV === "test"

  return {
    allowMockData: !isProduction && !isTest,
    gracefulDegradation: !isProduction,
    environment: isProduction ? "production" : isTest ? "test" : "development"
  }
}

/**
 * Environment variable helpers
 */
export function getEnvironmentVariable(name: string, required = false): string | undefined {
  const value = process.env[name]

  if (required && !value) {
    throw createApiError(503, `Required environment variable ${name} is not set`)
  }

  return value
}

/**
 * Check if we're running in a development environment
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().environment === "development"
}

/**
 * Check if we're running in a production environment
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().environment === "production"
}
