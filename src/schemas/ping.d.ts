import { z } from "zod";
export declare const PingResponseSchema: z.ZodObject<{
    service: z.ZodString;
    response: z.ZodString;
}, "strip", z.ZodTypeAny, {
    service: string;
    response: string;
}, {
    service: string;
    response: string;
}>;
export declare const PingRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    responses: {
        200: {
            description: string;
            content: {
                "application/json": {
                    schema: z.ZodObject<{
                        service: z.ZodString;
                        response: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        service: string;
                        response: string;
                    }, {
                        service: string;
                        response: string;
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
