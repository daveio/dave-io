import { z } from "zod";
export declare const RouterOSScriptResponseSchema: z.ZodObject<{
    script: z.ZodString;
    provider: z.ZodString;
    lastUpdated: z.ZodString;
    ipv4Count: z.ZodNumber;
    ipv6Count: z.ZodNumber;
    cacheStatus: z.ZodEnum<["hit", "miss", "generated"]>;
}, "strip", z.ZodTypeAny, {
    lastUpdated: string;
    script: string;
    provider: string;
    ipv4Count: number;
    ipv6Count: number;
    cacheStatus: "hit" | "miss" | "generated";
}, {
    lastUpdated: string;
    script: string;
    provider: string;
    ipv4Count: number;
    ipv6Count: number;
    cacheStatus: "hit" | "miss" | "generated";
}>;
export declare const RouterOSCacheStatusResponseSchema: z.ZodObject<{
    status: z.ZodString;
    lastUpdated: z.ZodString;
    lastError: z.ZodOptional<z.ZodString>;
    lastAttempt: z.ZodString;
    updateInProgress: z.ZodBoolean;
    metrics: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    status: string;
    lastUpdated: string;
    updateInProgress: boolean;
    lastAttempt: string;
    metrics: {
        cacheHits: number;
        cacheMisses: number;
        cacheResets: number;
        lastAccessed: string;
        lastRefresh: string;
        refreshCount: number;
        lastReset: string;
        resetCount: number;
    };
    lastError?: string | undefined;
}, {
    status: string;
    lastUpdated: string;
    updateInProgress: boolean;
    lastAttempt: string;
    metrics: {
        cacheHits: number;
        cacheMisses: number;
        cacheResets: number;
        lastAccessed: string;
        lastRefresh: string;
        refreshCount: number;
        lastReset: string;
        resetCount: number;
    };
    lastError?: string | undefined;
}>;
export declare const RouterOSResetResponseSchema: z.ZodObject<{
    message: z.ZodString;
    timestamp: z.ZodString;
    clearedItems: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    message: string;
    clearedItems: string[];
}, {
    timestamp: string;
    message: string;
    clearedItems: string[];
}>;
export declare const RouterOSPutIORouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    responses: {
        200: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        script: z.ZodString;
                        provider: z.ZodString;
                        lastUpdated: z.ZodString;
                        ipv4Count: z.ZodNumber;
                        ipv6Count: z.ZodNumber;
                        cacheStatus: z.ZodEnum<["hit", "miss", "generated"]>;
                    }, "strip", z.ZodTypeAny, {
                        lastUpdated: string;
                        script: string;
                        provider: string;
                        ipv4Count: number;
                        ipv6Count: number;
                        cacheStatus: "hit" | "miss" | "generated";
                    }, {
                        lastUpdated: string;
                        script: string;
                        provider: string;
                        ipv4Count: number;
                        ipv6Count: number;
                        cacheStatus: "hit" | "miss" | "generated";
                    }>;
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
export declare const RouterOSCacheRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    responses: {
        200: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        status: z.ZodString;
                        lastUpdated: z.ZodString;
                        lastError: z.ZodOptional<z.ZodString>;
                        lastAttempt: z.ZodString;
                        updateInProgress: z.ZodBoolean;
                        metrics: z.ZodObject<{
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
                    }, "strip", z.ZodTypeAny, {
                        status: string;
                        lastUpdated: string;
                        updateInProgress: boolean;
                        lastAttempt: string;
                        metrics: {
                            cacheHits: number;
                            cacheMisses: number;
                            cacheResets: number;
                            lastAccessed: string;
                            lastRefresh: string;
                            refreshCount: number;
                            lastReset: string;
                            resetCount: number;
                        };
                        lastError?: string | undefined;
                    }, {
                        status: string;
                        lastUpdated: string;
                        updateInProgress: boolean;
                        lastAttempt: string;
                        metrics: {
                            cacheHits: number;
                            cacheMisses: number;
                            cacheResets: number;
                            lastAccessed: string;
                            lastRefresh: string;
                            refreshCount: number;
                            lastReset: string;
                            resetCount: number;
                        };
                        lastError?: string | undefined;
                    }>;
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
export declare const RouterOSResetRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    responses: {
        200: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        message: z.ZodString;
                        timestamp: z.ZodString;
                        clearedItems: z.ZodArray<z.ZodString, "many">;
                    }, "strip", z.ZodTypeAny, {
                        timestamp: string;
                        message: string;
                        clearedItems: string[];
                    }, {
                        timestamp: string;
                        message: string;
                        clearedItems: string[];
                    }>;
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
