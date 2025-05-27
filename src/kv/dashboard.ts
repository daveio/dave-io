/// <reference path="../../worker-configuration.d.ts" />

// Local type definition - removed schema validation
export interface DashboardItem {
  title: string
  subtitle: string
  linkURL?: string
  imageURL?: string
}

// KV key prefixes
export const KV_PREFIX = "dashboard:"
export const ITEMS_PREFIX = `${KV_PREFIX}demo:items`

/**
 * Get dashboard items from KV storage
 */
export async function getDashboardItems(
  env: { DATA: KVNamespace },
  dashboard: string
): Promise<DashboardItem[] | null> {
  try {
    const key = `${KV_PREFIX}${dashboard}:items`
    return await env.DATA.get<DashboardItem[]>(key, { type: "json" })
  } catch (error) {
    console.error("Error getting dashboard items", { dashboard, error })
    return null
  }
}

/**
 * Store dashboard items in KV storage
 */
export async function setDashboardItems(
  env: { DATA: KVNamespace },
  dashboard: string,
  items: DashboardItem[]
): Promise<void> {
  try {
    const key = `${KV_PREFIX}${dashboard}:items`
    await env.DATA.put(key, JSON.stringify(items))
  } catch (error) {
    console.error("Error storing dashboard items", { dashboard, error })
  }
}
