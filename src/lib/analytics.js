/// <reference path="../../worker-configuration.d.ts" />
/**
 * Module for handling analytics tracking with Analytics Engine
 */
/**
 * Track detailed request analytics
 */
export function trackRequestAnalytics(env, analytics) {
    try {
        const { path, method, status, responseTime, userAgent, referer, queryParams, errorMessage } = analytics;
        // Create data point with all available info
        env.ANALYTICS.writeDataPoint({
            blobs: [method, path, userAgent || "unknown", referer || "none", queryParams || "none", errorMessage || "none"],
            doubles: [responseTime, status],
            indexes: ["request_analytics"]
        });
    }
    catch (error) {
        console.error("Error tracking request analytics", error);
    }
}
//# sourceMappingURL=analytics.js.map