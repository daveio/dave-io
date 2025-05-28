import { z } from "zod";
export declare const TokenUsageResponseSchema: z.ZodObject<{
    uuid: z.ZodString;
    requestCount: z.ZodNumber;
    lastUsed: z.ZodOptional<z.ZodString>;
    isRevoked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
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
export declare const TokenRevokeRequestSchema: z.ZodObject<{
    revoked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    revoked: boolean;
}, {
    revoked: boolean;
}>;
export declare const TokenRevokeResponseSchema: z.ZodObject<{
    uuid: z.ZodString;
    revoked: z.ZodBoolean;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    revoked: boolean;
    message: string;
    uuid: string;
}, {
    revoked: boolean;
    message: string;
    uuid: string;
}>;
export declare const TokenUsageRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    security: {
        bearerAuth: never[];
    }[];
    request: {
        params: z.ZodObject<{
            uuid: z.ZodString;
        }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        uuid: z.ZodString;
                        requestCount: z.ZodNumber;
                        lastUsed: z.ZodOptional<z.ZodString>;
                        isRevoked: z.ZodBoolean;
                    }, "strip", z.ZodTypeAny, {
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
        404: {
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
export declare const TokenRevokeRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    security: {
        bearerAuth: never[];
    }[];
    request: {
        params: z.ZodObject<{
            uuid: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            uuid: string;
        }, {
            uuid: string;
        }>;
        body: {
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        revoked: z.ZodBoolean;
                    }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        uuid: z.ZodString;
                        revoked: z.ZodBoolean;
                        message: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
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
        404: {
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
