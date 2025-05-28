export interface RouterOSCacheData {
    ipv4Ranges: string[];
    ipv6Ranges: string[];
    lastUpdated: string | null;
    lastError: string | null;
    updateInProgress?: boolean;
}
export interface RouterOSCacheMetadata {
    lastUpdated: string | null;
    lastError: string | null;
    lastAttempt: string | null;
    updateInProgress: boolean;
}
export interface RipePrefix {
    prefix: string;
}
export interface RipeData {
    data: {
        prefixes: RipePrefix[];
    };
}
export interface BGPViewPrefix {
    prefix: string;
    ip: string;
    cidr: number;
    routed: boolean;
}
export interface BGPViewData {
    data: {
        ipv4_prefixes: BGPViewPrefix[];
        ipv6_prefixes: BGPViewPrefix[];
    };
}
export declare const KV_CACHE_IPV4 = "routeros:putio:ipv4";
export declare const KV_CACHE_IPV6 = "routeros:putio:ipv6";
export declare const KV_CACHE_SCRIPT = "routeros:putio:script";
export declare const KV_PUTIO_METADATA_PREFIX = "routeros:putio:metadata";
export declare const KV_PUTIO_METADATA_LAST_UPDATED = "routeros:putio:metadata:last-updated";
export declare const KV_PUTIO_METADATA_LAST_ERROR = "routeros:putio:metadata:last-error";
export declare const KV_PUTIO_METADATA_LAST_ATTEMPT = "routeros:putio:metadata:last-attempt";
export declare const KV_PUTIO_METADATA_UPDATE_IN_PROGRESS = "routeros:putio:metadata:update-in-progress";
export declare const KV_METRICS_PREFIX = "metrics:routeros";
export declare const KV_METRICS_LAST_REFRESH = "metrics:routeros:last-refresh";
export declare const KV_METRICS_REFRESH_COUNT = "metrics:routeros:refresh-count";
export declare const KV_METRICS_CACHE_RESETS = "metrics:routeros:cache-resets";
export declare const KV_METRICS_CACHE_HITS = "metrics:routeros:cache-hits";
export declare const KV_METRICS_CACHE_MISSES = "metrics:routeros:cache-misses";
export declare const KV_METRICS_LAST_ACCESSED = "metrics:routeros:last-accessed";
export declare const KV_METRICS_LAST_RESET = "metrics:routeros:last-reset";
export declare const KV_METRICS_RESET_COUNT = "metrics:routeros:reset-count";
/**
 * Get cache data from KV
 */
export declare function getCacheData(env: {
    DATA: KVNamespace;
}): Promise<RouterOSCacheData>;
/**
 * Check if cache needs to be refreshed
 */
export declare function shouldRefreshCache(cacheData: RouterOSCacheData): boolean;
/**
 * Check if cache is stale (> TTL)
 */
export declare function isCacheStale(cacheData: RouterOSCacheData): boolean;
/**
 * Get provider-specific cache status information
 */
export declare function getCacheStatus(env: {
    DATA: KVNamespace;
}): Promise<RouterOSCacheMetadata>;
/**
 * Get shared metrics across all RouterOS endpoints
 */
export declare function getSharedMetadata(env: {
    DATA: KVNamespace;
}): Promise<Record<string, unknown>>;
/**
 * Update shared metrics using individual keys
 */
export declare function updateSharedMetadata(env: {
    DATA: KVNamespace;
}, metrics: Record<string, unknown>, expirationTtl?: number): Promise<void>;
/**
 * Generate RouterOS script from cached data
 */
export declare function generateScript(cacheData: RouterOSCacheData): string;
/**
 * Refresh the IP range cache
 */
export declare function refreshCache(env: {
    DATA: KVNamespace;
    ANALYTICS?: AnalyticsEngineDataset;
}): Promise<void>;
/**
 * Get the RouterOS script, refreshing the cache if necessary
 */
export declare function getScript(env: {
    DATA: KVNamespace;
    ANALYTICS: AnalyticsEngineDataset;
}): Promise<string>;
/**
 * Reset the cache (clear all data)
 */
export declare function resetCache(env: {
    DATA: KVNamespace;
    ANALYTICS: AnalyticsEngineDataset;
}): Promise<void>;
