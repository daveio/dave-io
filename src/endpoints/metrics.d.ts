import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
export declare class Metrics extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        request: {
            query: import("zod").ZodObject<{
                format: import("zod").ZodOptional<import("zod").ZodEnum<["json", "yaml", "prometheus"]>>;
            }, "strip", import("zod").ZodTypeAny, {
                format?: "json" | "yaml" | "prometheus" | undefined;
            }, {
                format?: "json" | "yaml" | "prometheus" | undefined;
            }>;
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            timestamp: import("zod").ZodString;
                            statusCodes: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
                                count: import("zod").ZodNumber;
                                lastSeen: import("zod").ZodString;
                            }, "strip", import("zod").ZodTypeAny, {
                                count: number;
                                lastSeen: string;
                            }, {
                                count: number;
                                lastSeen: string;
                            }>>;
                            statusGroups: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
                                count: import("zod").ZodNumber;
                                lastSeen: import("zod").ZodString;
                            }, "strip", import("zod").ZodTypeAny, {
                                count: number;
                                lastSeen: string;
                            }, {
                                count: number;
                                lastSeen: string;
                            }>>;
                            routeros: import("zod").ZodObject<{
                                cacheHits: import("zod").ZodNumber;
                                cacheMisses: import("zod").ZodNumber;
                                cacheResets: import("zod").ZodNumber;
                                lastAccessed: import("zod").ZodString;
                                lastRefresh: import("zod").ZodString;
                                refreshCount: import("zod").ZodNumber;
                                lastReset: import("zod").ZodString;
                                resetCount: import("zod").ZodNumber;
                            }, "strip", import("zod").ZodTypeAny, {
                                cacheHits: number;
                                cacheMisses: number;
                                cacheResets: number;
                                lastAccessed: string;
                                lastRefresh: string;
                                refreshCount: number;
                                lastReset: string;
                                resetCount: number;
                            }, {
                                cacheHits: number;
                                cacheMisses: number;
                                cacheResets: number;
                                lastAccessed: string;
                                lastRefresh: string;
                                refreshCount: number;
                                lastReset: string;
                                resetCount: number;
                            }>;
                            redirects: import("zod").ZodArray<import("zod").ZodObject<{
                                slug: import("zod").ZodString;
                                count: import("zod").ZodNumber;
                                lastAccessed: import("zod").ZodString;
                            }, "strip", import("zod").ZodTypeAny, {
                                slug: string;
                                count: number;
                                lastAccessed: string;
                            }, {
                                slug: string;
                                count: number;
                                lastAccessed: string;
                            }>, "many">;
                        }, "strip", import("zod").ZodTypeAny, {
                            timestamp: string;
                            statusCodes: Record<string, {
                                count: number;
                                lastSeen: string;
                            }>;
                            statusGroups: Record<string, {
                                count: number;
                                lastSeen: string;
                            }>;
                            routeros: {
                                cacheHits: number;
                                cacheMisses: number;
                                cacheResets: number;
                                lastAccessed: string;
                                lastRefresh: string;
                                refreshCount: number;
                                lastReset: string;
                                resetCount: number;
                            };
                            redirects: {
                                slug: string;
                                count: number;
                                lastAccessed: string;
                            }[];
                        }, {
                            timestamp: string;
                            statusCodes: Record<string, {
                                count: number;
                                lastSeen: string;
                            }>;
                            statusGroups: Record<string, {
                                count: number;
                                lastSeen: string;
                            }>;
                            routeros: {
                                cacheHits: number;
                                cacheMisses: number;
                                cacheResets: number;
                                lastAccessed: string;
                                lastRefresh: string;
                                refreshCount: number;
                                lastReset: string;
                                resetCount: number;
                            };
                            redirects: {
                                slug: string;
                                count: number;
                                lastAccessed: string;
                            }[];
                        }>;
                    };
                    "application/yaml": {
                        schema: import("zod").ZodString;
                    };
                    "text/plain": {
                        schema: import("zod").ZodString;
                    };
                };
            };
            500: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            error: import("zod").ZodString;
                            code: import("zod").ZodOptional<import("zod").ZodString>;
                            timestamp: import("zod").ZodOptional<import("zod").ZodString>;
                        }, "strip", import("zod").ZodTypeAny, {
                            error: string;
                            code?: string | undefined;
                            timestamp?: string | undefined;
                        }, {
                            error: string;
                            code?: string | undefined;
                            timestamp?: string | undefined;
                        }>;
                    };
                };
            };
        };
    };
    /**
     * Get all metrics data from KV
     */
    private getMetricsData;
    /**
     * Format metrics data as Prometheus format
     */
    private formatPrometheusMetrics;
    /**
     * Process the metrics request
     */
    handle(c: Context<{
        Bindings: {
            DATA: KVNamespace;
        };
    }>): Promise<Response>;
}
