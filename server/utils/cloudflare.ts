/// <reference types="../../worker-configuration" />

import type { H3Event } from "h3"
import { drizzle } from "drizzle-orm/d1"

/**
 * Retrieves the Cloudflare environment object from the event context.
 * This function provides access to environment variables and bindings for the current request.
 *
 * Args:
 *   event: The H3Event containing the Cloudflare environment context.
 *
 * Returns:
 *   The environment object cast as type Env.
 */
export function getEnv(event: H3Event) {
  return (event.context.cloudflare?.env || {}) as Env
}

/**
 * Returns a database client instance for the current event.
 * This function retrieves the database binding from the event's environment and initializes a Drizzle ORM client.
 *
 * Args:
 *   event: The H3Event containing the Cloudflare environment context.
 *
 * Returns:
 *   A Drizzle ORM database client instance.
 */
export function getDB(event: H3Event) {
  return drizzle(getEnv(event).DB)
}
