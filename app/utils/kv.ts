import { createStorage } from "unstorage"
import localStorageDriver from "unstorage/drivers/localstorage"

export const kv = createStorage({
  driver: localStorageDriver({ base: "rdio:" }),
})

/**
 * Sets a value in the key-value store with an optional TTL.
 * The value is automatically serialized to JSON.
 * @param key The key to store the value under.
 * @param value The value to store. Can be any JSON-serializable type.
 * @param ttl Optional. Time-to-live in seconds.
 */
export async function setKV<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value)
    await kv.setItem(key, serializedValue, { ttl })
  } catch {
    // KV errors are not logged in production - fail silently for client-side storage
  }
}

/**
 * Gets a value from the key-value store.
 * The value is automatically deserialized from JSON.
 * @param key The key of the value to retrieve.
 * @returns The deserialized value, or null if the key is not found or an error occurs.
 */
export async function getKV<T>(key: string): Promise<T | null> {
  try {
    const storedValue = await kv.getItem<string>(key)
    if (storedValue === null || storedValue === undefined) {
      return null
    }
    return JSON.parse(storedValue) as T
  } catch {
    // KV errors are not logged in production - return null for client-side storage failures
    return null
  }
}
