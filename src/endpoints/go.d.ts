import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
export declare class Go extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        request: {
            params: z.ZodObject<{
                slug: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                slug: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                slug: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>;
        };
        responses: {
            "302": {
                description: string;
            };
            "404": {
                description: string;
            };
        };
    };
    handle(c: Context): Promise<Response>;
}
