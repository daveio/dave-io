import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
export declare class Ping extends OpenAPIRoute {
    schema: {
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
        };
    };
    handle(c: Context): Promise<Response & import("hono").TypedResponse<{
        service: string;
        response: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
}
