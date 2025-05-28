/**
 * Module for handling analytics tracking with Analytics Engine
 */
export interface RequestAnalytics {
    timestamp: number;
    path: string;
    method: string;
    status: number;
    responseTime: number;
    ip?: string;
    userAgent?: string;
    referer?: string;
    queryParams?: string;
    errorMessage?: string;
}
/**
 * Track detailed request analytics
 */
export declare function trackRequestAnalytics(env: {
    ANALYTICS: AnalyticsEngineDataset;
}, analytics: RequestAnalytics): void;
