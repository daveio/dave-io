import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
export declare class Auth extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        request: {
            query: import("zod").ZodObject<{
                token: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strip", import("zod").ZodTypeAny, {
                token?: string | undefined;
            }, {
                token?: string | undefined;
            }>;
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            message: import("zod").ZodString;
                            jwt: import("zod").ZodObject<{
                                subject: import("zod").ZodString;
                                subjectParts: import("zod").ZodArray<import("zod").ZodString, "many">;
                                issuedAt: import("zod").ZodNumber;
                                expiresAt: import("zod").ZodOptional<import("zod").ZodNumber>;
                                timeToExpiry: import("zod").ZodOptional<import("zod").ZodNumber>;
                                isExpired: import("zod").ZodBoolean;
                            }, "strip", import("zod").ZodTypeAny, {
                                subject: string;
                                subjectParts: string[];
                                issuedAt: number;
                                isExpired: boolean;
                                expiresAt?: number | undefined;
                                timeToExpiry?: number | undefined;
                            }, {
                                subject: string;
                                subjectParts: string[];
                                issuedAt: number;
                                isExpired: boolean;
                                expiresAt?: number | undefined;
                                timeToExpiry?: number | undefined;
                            }>;
                            user: import("zod").ZodObject<{
                                id: import("zod").ZodString;
                            }, "strip", import("zod").ZodTypeAny, {
                                id: string;
                            }, {
                                id: string;
                            }>;
                            timestamp: import("zod").ZodString;
                        }, "strip", import("zod").ZodTypeAny, {
                            timestamp: string;
                            message: string;
                            jwt: {
                                subject: string;
                                subjectParts: string[];
                                issuedAt: number;
                                isExpired: boolean;
                                expiresAt?: number | undefined;
                                timeToExpiry?: number | undefined;
                            };
                            user: {
                                id: string;
                            };
                        }, {
                            timestamp: string;
                            message: string;
                            jwt: {
                                subject: string;
                                subjectParts: string[];
                                issuedAt: number;
                                isExpired: boolean;
                                expiresAt?: number | undefined;
                                timeToExpiry?: number | undefined;
                            };
                            user: {
                                id: string;
                            };
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
        error: string;
    }, 500, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 401, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        jwt: {
            subject: string;
            subjectParts: string[];
            issuedAt: number;
            expiresAt: number | undefined;
            timeToExpiry: number | null;
            isExpired: false;
        };
        user: {
            id: string;
        };
        timestamp: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
}
