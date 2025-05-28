import { z } from "zod";
export declare const RedirectRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    request: {
        params: z.ZodObject<{
            slug: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            slug: string;
        }, {
            slug: string;
        }>;
    };
    responses: {
        301: {
            description: string;
            headers: z.ZodObject<{
                location: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                location: string;
            }, {
                location: string;
            }>;
        };
        302: {
            description: string;
            headers: z.ZodObject<{
                location: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                location: string;
            }, {
                location: string;
            }>;
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
