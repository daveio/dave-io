export interface Redirect {
    slug: string;
    url: string;
}
export interface ClickData {
    count: number;
    lastAccessed: string | null;
}
export declare const KV_PREFIX = "redirect:";
export declare const METRICS_PREFIX = "metrics:redirect:";
/**
 * Get a redirect by slug
 */
export declare function getRedirect(env: {
    DATA: KVNamespace;
}, slug: string): Promise<Redirect | null>;
/**
 * Store a redirect
 */
export declare function setRedirect(env: {
    DATA: KVNamespace;
}, redirect: Redirect): Promise<boolean>;
/**
 * Delete a redirect
 */
export declare function deleteRedirect(env: {
    DATA: KVNamespace;
}, slug: string): Promise<boolean>;
/**
 * List all redirects
 */
export declare function listRedirects(env: {
    DATA: KVNamespace;
}): Promise<Redirect[]>;
/**
 * Track redirect click
 */
export declare function trackRedirectClick(env: {
    DATA: KVNamespace;
    ANALYTICS?: AnalyticsEngineDataset;
}, slug: string): Promise<void>;
/**
 * Get click data for a redirect
 */
export declare function getRedirectStats(env: {
    DATA: KVNamespace;
}, slug: string): Promise<ClickData | null>;
/**
 * Get all redirect stats
 */
export declare function getAllRedirectStats(env: {
    DATA: KVNamespace;
}): Promise<Record<string, ClickData>>;
