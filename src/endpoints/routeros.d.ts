import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
export declare class RouterOSPutIO extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            script: import("zod").ZodString;
                            provider: import("zod").ZodString;
                            lastUpdated: import("zod").ZodString;
                            ipv4Count: import("zod").ZodNumber;
                            ipv6Count: import("zod").ZodNumber;
                            cacheStatus: import("zod").ZodEnum<["hit", "miss", "generated"]>;
                        }, "strip", import("zod").ZodTypeAny, {
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
    handle(c: Context): Promise<(Response & import("hono").TypedResponse<string, import("hono/utils/http-status").ContentfulStatusCode, "text">) | (Response & import("hono").TypedResponse<{
        error: string;
        message: string;
    }, 500, "json">)>;
}
export declare class RouterOSCache extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            status: import("zod").ZodString;
                            lastUpdated: import("zod").ZodString;
                            lastError: import("zod").ZodOptional<import("zod").ZodString>;
                            lastAttempt: import("zod").ZodString;
                            updateInProgress: import("zod").ZodBoolean;
                            metrics: import("zod").ZodObject<{
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
                        }, "strip", import("zod").ZodTypeAny, {
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
    handle(c: Context): Promise<(Response & import("hono").TypedResponse<{
        putio: {
            ipv4Count: number;
            ipv6Count: number;
            lastUpdated: string | null;
            lastError: string | null;
            lastAttempt: string | null;
            updateInProgress: boolean;
        };
        shared: {
            [x: string]: never;
        };
        providers: string[];
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
        message: string;
    }, 500, "json">)>;
}
export declare class RouterOSReset extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            message: import("zod").ZodString;
                            timestamp: import("zod").ZodString;
                            clearedItems: import("zod").ZodArray<import("zod").ZodString, "many">;
                        }, "strip", import("zod").ZodTypeAny, {
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
    handle(c: Context): Promise<(Response & import("hono").TypedResponse<{
        success: true;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
        message: string;
    }, 500, "json">)>;
}
