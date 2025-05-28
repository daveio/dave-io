export interface DashboardItem {
    title: string;
    subtitle: string;
    linkURL?: string;
    imageURL?: string;
}
export declare const KV_PREFIX = "dashboard:";
export declare const ITEMS_PREFIX = "dashboard:demo:items";
/**
 * Get dashboard items from KV storage
 */
export declare function getDashboardItems(env: {
    DATA: KVNamespace;
}, dashboard: string): Promise<DashboardItem[] | null>;
/**
 * Store dashboard items in KV storage
 */
export declare function setDashboardItems(env: {
    DATA: KVNamespace;
}, dashboard: string, items: DashboardItem[]): Promise<void>;
