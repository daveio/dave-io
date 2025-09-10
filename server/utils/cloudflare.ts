/// <reference types="../../worker-configuration" />

import type { H3Event } from "h3"
import { drizzle } from "drizzle-orm/d1"

/**
 * Retrieves the Cloudflare environment from the given event.
 * Throws an error if the environment is not found in the event context.
 *
 * Args:
 *   event: The H3Event containing the Cloudflare environment context.
 *
 * Returns:
 *   The Cloudflare environment object extracted from the event.
 *
 * Raises:
 *   Error: If the environment is not found in the event context.
 */
export function getEnv(event: H3Event) {
  const env = (event.context.cloudflare?.env || null) as Env

  if (!env) {
    throw new Error("Environment not found in event context")
  }

  return env
}

/**
 * Returns a database connection for the given event.
 * Retrieves the environment from the event and initializes a Drizzle ORM database instance.
 *
 * Args:
 *   event: The H3Event containing the Cloudflare environment context.
 *
 * Returns:
 *   A Drizzle ORM database instance connected to the environment's DB.
 *
 * Raises:
 *   Error: If the environment or database is not found in the event context.
 */
export function getDB(event: H3Event) {
  const env = getEnv(event)

  if (!env.DB) {
    throw new Error("Database not found in environment")
  }

  return drizzle(env.DB)
}
