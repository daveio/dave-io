import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
/**
 * AI Alt Text Generation Endpoint (GET)
 * Generates descriptive alt text for images using Cloudflare AI
 */
export declare class AiAlt extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        security: {
            bearerAuth: never[];
        }[];
        request: {
            query: import("zod").ZodObject<{
                image: import("zod").ZodString;
                token: import("zod").ZodOptional<import("zod").ZodString>;
            }, "strip", import("zod").ZodTypeAny, {
                image: string;
                token?: string | undefined;
            }, {
                image: string;
                token?: string | undefined;
            }>;
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            altText: import("zod").ZodString;
                            image: import("zod").ZodString;
                            timestamp: import("zod").ZodString;
                            rateLimit: import("zod").ZodObject<{
                                remaining: import("zod").ZodNumber;
                                reset: import("zod").ZodString;
                                limit: import("zod").ZodNumber;
                            }, "strip", import("zod").ZodTypeAny, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }>;
                        }, "strip", import("zod").ZodTypeAny, {
                            timestamp: string;
                            image: string;
                            altText: string;
                            rateLimit: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            };
                        }, {
                            timestamp: string;
                            image: string;
                            altText: string;
                            rateLimit: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            };
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
                            rateLimit: import("zod").ZodOptional<import("zod").ZodObject<{
                                remaining: import("zod").ZodNumber;
                                reset: import("zod").ZodString;
                                limit: import("zod").ZodNumber;
                            }, "strip", import("zod").ZodTypeAny, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }>>;
                        }, "strip", import("zod").ZodTypeAny, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
                        }, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
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
            429: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            error: import("zod").ZodString;
                            code: import("zod").ZodOptional<import("zod").ZodString>;
                            rateLimit: import("zod").ZodOptional<import("zod").ZodObject<{
                                remaining: import("zod").ZodNumber;
                                reset: import("zod").ZodString;
                                limit: import("zod").ZodNumber;
                            }, "strip", import("zod").ZodTypeAny, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }>>;
                        }, "strip", import("zod").ZodTypeAny, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
                        }, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
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
                            rateLimit: import("zod").ZodOptional<import("zod").ZodObject<{
                                remaining: import("zod").ZodNumber;
                                reset: import("zod").ZodString;
                                limit: import("zod").ZodNumber;
                            }, "strip", import("zod").ZodTypeAny, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }, {
                                limit: number;
                                remaining: number;
                                reset: string;
                            }>>;
                        }, "strip", import("zod").ZodTypeAny, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
                        }, {
                            error: string;
                            code?: string | undefined;
                            rateLimit?: {
                                limit: number;
                                remaining: number;
                                reset: string;
                            } | undefined;
                        }>;
                    };
                };
            };
        };
    };
    private processor;
    /**
     * Handles GET requests with image URL parameter
     */
    handle(c: Context): Promise<Response>;
}
