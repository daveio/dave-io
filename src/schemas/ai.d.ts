import { z } from "zod";
export declare const AiAltGetQuerySchema: z.ZodObject<{
    image: z.ZodString;
    token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    image: string;
    token?: string | undefined;
}, {
    image: string;
    token?: string | undefined;
}>;
export declare const AiAltPostRequestSchema: z.ZodObject<{
    image: z.ZodString;
}, "strip", z.ZodTypeAny, {
    image: string;
}, {
    image: string;
}>;
export declare const AiAltSuccessResponseSchema: z.ZodObject<{
    altText: z.ZodString;
    image: z.ZodString;
    timestamp: z.ZodString;
    rateLimit: z.ZodObject<{
        remaining: z.ZodNumber;
        reset: z.ZodString;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        remaining: number;
        reset: string;
    }, {
        limit: number;
        remaining: number;
        reset: string;
    }>;
}, "strip", z.ZodTypeAny, {
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
export declare const AiAltErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        remaining: z.ZodNumber;
        reset: z.ZodString;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        remaining: number;
        reset: string;
    }, {
        limit: number;
        remaining: number;
        reset: string;
    }>>;
}, "strip", z.ZodTypeAny, {
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
export declare const AiAltGetRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    security: {
        bearerAuth: never[];
    }[];
    request: {
        query: z.ZodObject<{
            image: z.ZodString;
            token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        altText: z.ZodString;
                        image: z.ZodString;
                        timestamp: z.ZodString;
                        rateLimit: z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
        403: {
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
        429: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
export declare const AiAltPostRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    security: {
        bearerAuth: never[];
    }[];
    request: {
        body: {
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        image: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        image: string;
                    }, {
                        image: string;
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
                    schema: z.ZodObject<{
                        altText: z.ZodString;
                        image: z.ZodString;
                        timestamp: z.ZodString;
                        rateLimit: z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
        403: {
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
        413: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
        429: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        error: z.ZodString;
                        code: z.ZodOptional<z.ZodString>;
                        rateLimit: z.ZodOptional<z.ZodObject<{
                            remaining: z.ZodNumber;
                            reset: z.ZodString;
                            limit: z.ZodNumber;
                        }, "strip", z.ZodTypeAny, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }, {
                            limit: number;
                            remaining: number;
                            reset: string;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
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
