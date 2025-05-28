import { z } from "zod";
export declare const RedirectMetricsSchema: z.ZodObject<{
    slug: z.ZodString;
    count: z.ZodNumber;
    lastAccessed: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
    count: number;
    lastAccessed: string;
}, {
    slug: string;
    count: number;
    lastAccessed: string;
}>;
export declare const MetricsResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    statusCodes: z.ZodRecord<z.ZodString, z.ZodObject<{
        count: z.ZodNumber;
        lastSeen: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        count: number;
        lastSeen: string;
    }, {
        count: number;
        lastSeen: string;
    }>>;
    statusGroups: z.ZodRecord<z.ZodString, z.ZodObject<{
        count: z.ZodNumber;
        lastSeen: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        count: number;
        lastSeen: string;
    }, {
        count: number;
        lastSeen: string;
    }>>;
    routeros: z.ZodObject<{
        cacheHits: z.ZodNumber;
        cacheMisses: z.ZodNumber;
        cacheResets: z.ZodNumber;
        lastAccessed: z.ZodString;
        lastRefresh: z.ZodString;
        refreshCount: z.ZodNumber;
        lastReset: z.ZodString;
        resetCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
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
    redirects: z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        count: z.ZodNumber;
        lastAccessed: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        count: number;
        lastAccessed: string;
    }, {
        slug: string;
        count: number;
        lastAccessed: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
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
export declare const MetricsYamlResponseSchema: z.ZodString;
export declare const MetricsPrometheusResponseSchema: z.ZodString;
export declare const MetricsRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    request: {
        query: z.ZodObject<{
            format: z.ZodOptional<z.ZodEnum<["json", "yaml", "prometheus"]>>;
        }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        timestamp: z.ZodString;
                        statusCodes: z.ZodRecord<z.ZodString, z.ZodObject<{
                            count: z.ZodNumber;
                            lastSeen: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            count: number;
                            lastSeen: string;
                        }, {
                            count: number;
                            lastSeen: string;
                        }>>;
                        statusGroups: z.ZodRecord<z.ZodString, z.ZodObject<{
                            count: z.ZodNumber;
                            lastSeen: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            count: number;
                            lastSeen: string;
                        }, {
                            count: number;
                            lastSeen: string;
                        }>>;
                        routeros: z.ZodObject<{
                            cacheHits: z.ZodNumber;
                            cacheMisses: z.ZodNumber;
                            cacheResets: z.ZodNumber;
                            lastAccessed: z.ZodString;
                            lastRefresh: z.ZodString;
                            refreshCount: z.ZodNumber;
                            lastReset: z.ZodString;
                            resetCount: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
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
                        redirects: z.ZodArray<z.ZodObject<{
                            slug: z.ZodString;
                            count: z.ZodNumber;
                            lastAccessed: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            slug: string;
                            count: number;
                            lastAccessed: string;
                        }, {
                            slug: string;
                            count: number;
                            lastAccessed: string;
                        }>, "many">;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodString;
                };
                "text/plain": {
                    schema: z.ZodString;
                };
            };
        };
        500: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        timestamp: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
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
