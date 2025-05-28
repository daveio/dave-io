import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
export declare class TokenUsageEndpoint extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
        request: {
            params: import("zod").ZodObject<{
                uuid: import("zod").ZodString;
            }, "strip", import("zod").ZodTypeAny, {
                uuid: string;
            }, {
                uuid: string;
            }>;
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            uuid: import("zod").ZodString;
                            requestCount: import("zod").ZodNumber;
                            lastUsed: import("zod").ZodOptional<import("zod").ZodString>;
                            isRevoked: import("zod").ZodBoolean;
                        }, "strip", import("zod").ZodTypeAny, {
                            requestCount: number;
                            isRevoked: boolean;
                            uuid: string;
                            lastUsed?: string | undefined;
                        }, {
                            requestCount: number;
                            isRevoked: boolean;
                            uuid: string;
                            lastUsed?: string | undefined;
                        }>;
                    };
                };
            };
            401: {
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
            403: {
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
            404: {
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
    handle(c: Context): Promise<Response | (Response & import("hono").TypedResponse<{
        requestCount: number;
        lastUsed: string | null;
        isRevoked: boolean;
        uuid: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
export declare class TokenRevokeEndpoint extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
        request: {
            params: import("zod").ZodObject<{
                uuid: import("zod").ZodString;
            }, "strip", import("zod").ZodTypeAny, {
                uuid: string;
            }, {
                uuid: string;
            }>;
            body: {
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            revoked: import("zod").ZodBoolean;
                        }, "strip", import("zod").ZodTypeAny, {
                            revoked: boolean;
                        }, {
                            revoked: boolean;
                        }>;
                    };
                };
            };
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            uuid: import("zod").ZodString;
                            revoked: import("zod").ZodBoolean;
                            message: import("zod").ZodString;
                        }, "strip", import("zod").ZodTypeAny, {
                            revoked: boolean;
                            message: string;
                            uuid: string;
                        }, {
                            revoked: boolean;
                            message: string;
                            uuid: string;
                        }>;
                    };
                };
            };
            400: {
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
            401: {
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
            403: {
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
            404: {
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
    handle(c: Context): Promise<Response | (Response & import("hono").TypedResponse<{
        uuid: string;
        revoked: any;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
