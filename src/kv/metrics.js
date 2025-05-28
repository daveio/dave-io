/// <reference path="../../worker-configuration.d.ts" />
/**
 * Module for handling metrics tracking in KV storage
 */
// KV key prefixes
export const METRICS_PREFIX = "metrics:";
export const STATUS_PREFIX = `${METRICS_PREFIX}status:`;
export const GROUP_PREFIX = `${METRICS_PREFIX}group:`;
/**
 * Increment a status code counter
 */
export async function incrementStatusCodeCount(env, statusCode) {
    try {
        const key = `${STATUS_PREFIX}${statusCode}`;
        // Get current count
        let count = 0;
        const currentCount = await env.DATA.get(key);
        if (currentCount) {
            count = Number.parseInt(currentCount, 10);
            // Check if count is NaN
            if (Number.isNaN(count)) {
                count = 0;
            }
        }
        // Increment and store
        count++;
        await env.DATA.put(key, count.toString());
        // Also track by group (4xx, 5xx)
        await incrementStatusGroupCount(env, statusCode);
    }
    catch (error) {
        console.error("Error incrementing status code count", { statusCode, error });
    }
}
/**
 * Increment a status code group counter (4xx, 5xx)
 */
async function incrementStatusGroupCount(env, statusCode) {
    try {
        // Determine group
        let group = null;
        if (statusCode >= 400 && statusCode < 500) {
            group = "4xx";
        }
        else if (statusCode >= 500 && statusCode < 600) {
            group = "5xx";
        }
        if (!group) {
            return; // Not a 4xx or 5xx status
        }
        const key = `${GROUP_PREFIX}${group}`;
        // Get current count
        let count = 0;
        const currentCount = await env.DATA.get(key);
        if (currentCount) {
            count = Number.parseInt(currentCount, 10);
            // Check if count is NaN
            if (Number.isNaN(count)) {
                count = 0;
            }
        }
        // Increment and store
        count++;
        await env.DATA.put(key, count.toString());
    }
    catch (error) {
        console.error("Error incrementing status group count", { statusCode, error });
    }
}
/**
 * Get status code count
 */
export async function getStatusCodeCount(env, statusCode) {
    try {
        const key = `${STATUS_PREFIX}${statusCode}`;
        const count = await env.DATA.get(key);
        return count ? Number.parseInt(count, 10) : 0;
    }
    catch (error) {
        console.error("Error getting status code count", { statusCode, error });
        return 0;
    }
}
/**
 * Get status group count
 */
export async function getStatusGroupCount(env, group) {
    try {
        const key = `${GROUP_PREFIX}${group}`;
        const count = await env.DATA.get(key);
        return count ? Number.parseInt(count, 10) : 0;
    }
    catch (error) {
        console.error("Error getting status group count", { group, error });
        return 0;
    }
}
//# sourceMappingURL=metrics.js.map