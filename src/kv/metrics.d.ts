/**
 * Module for handling metrics tracking in KV storage
 */
export declare const METRICS_PREFIX = "metrics:";
export declare const STATUS_PREFIX = "metrics:status:";
export declare const GROUP_PREFIX = "metrics:group:";
/**
 * Increment a status code counter
 */
export declare function incrementStatusCodeCount(env: {
    DATA: KVNamespace;
}, statusCode: number): Promise<void>;
/**
 * Get status code count
 */
export declare function getStatusCodeCount(env: {
    DATA: KVNamespace;
}, statusCode: number): Promise<number>;
/**
 * Get status group count
 */
export declare function getStatusGroupCount(env: {
    DATA: KVNamespace;
}, group: string): Promise<number>;
