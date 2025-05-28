import { z } from "zod";
export declare const AuthSuccessResponseSchema: z.ZodObject<{
    message: z.ZodString;
    jwt: z.ZodObject<{
        subject: z.ZodString;
        subjectParts: z.ZodArray<z.ZodString, "many">;
        issuedAt: z.ZodNumber;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        timeToExpiry: z.ZodOptional<z.ZodNumber>;
        isExpired: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
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
    user: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
export declare const AuthQuerySchema: z.ZodObject<{
    token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    token?: string | undefined;
}, {
    token?: string | undefined;
}>;
export declare const AuthRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    request: {
        query: z.ZodObject<{
            token: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        message: z.ZodString;
                        jwt: z.ZodObject<{
                            subject: z.ZodString;
                            subjectParts: z.ZodArray<z.ZodString, "many">;
                            issuedAt: z.ZodNumber;
                            expiresAt: z.ZodOptional<z.ZodNumber>;
                            timeToExpiry: z.ZodOptional<z.ZodNumber>;
                            isExpired: z.ZodBoolean;
                        }, "strip", z.ZodTypeAny, {
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
                        user: z.ZodObject<{
                            id: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            id: string;
                        }, {
                            id: string;
                        }>;
                        timestamp: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
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
