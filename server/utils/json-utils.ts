/**
 * JSON utilities for sorting object keys recursively
 * Ensures consistent API response formatting across all endpoints
 */

/**
 * Recursively sorts all object keys in a JSON structure
 * Handles nested objects, arrays, and primitive values
 * @param obj - The object to sort (can be any JSON-serializable value)
 * @returns A new object with all keys sorted recursively
 */
export function sortObjectKeysRecursively<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sortObjectKeysRecursively(item)) as T
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sorted[key] = sortObjectKeysRecursively((obj as Record<string, unknown>)[key])
    }

    return sorted as T
  }

  // For primitives (string, number, boolean) and other object types (Date, etc.)
  return obj
}

/**
 * Sorts JSON string by parsing, sorting, and re-stringifying
 * @param jsonString - The JSON string to sort
 * @returns Sorted JSON string with consistent formatting
 */
export function sortJsonString(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString)
    const sorted = sortObjectKeysRecursively(parsed)
    return JSON.stringify(sorted, null, 2)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    // If parsing fails, return original string
    return jsonString
  }
}

/**
 * Utility to prepare API response for JSON serialization with sorted keys
 * This should be used in all endpoints before returning responses
 * @param response - The response object to sort
 * @returns Response with recursively sorted keys
 */
export function prepareSortedApiResponse<T>(response: T): T {
  return sortObjectKeysRecursively(response)
}
