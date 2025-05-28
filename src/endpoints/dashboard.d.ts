import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
export interface DashboardItem {
    title: string;
    subtitle: string;
    linkURL?: string;
    imageURL?: string;
}
export declare class Dashboard extends OpenAPIRoute {
    schema: {
        tags: string[];
        summary: string;
        description: string;
        request: {
            params: import("zod").ZodObject<{
                name: import("zod").ZodEnum<["demo", "hn"]>;
            }, "strip", import("zod").ZodTypeAny, {
                name: "demo" | "hn";
            }, {
                name: "demo" | "hn";
            }>;
        };
        responses: {
            200: {
                description: string;
                content: {
                    "application/json": {
                        schema: import("zod").ZodObject<{
                            name: import("zod").ZodString;
                            items: import("zod").ZodArray<import("zod").ZodObject<{
                                title: import("zod").ZodString;
                                link: import("zod").ZodOptional<import("zod").ZodString>;
                                description: import("zod").ZodOptional<import("zod").ZodString>;
                                timestamp: import("zod").ZodOptional<import("zod").ZodString>;
                            }, "strip", import("zod").ZodTypeAny, {
                                title: string;
                                timestamp?: string | undefined;
                                description?: string | undefined;
                                link?: string | undefined;
                            }, {
                                title: string;
                                timestamp?: string | undefined;
                                description?: string | undefined;
                                link?: string | undefined;
                            }>, "many">;
                            lastUpdated: import("zod").ZodString;
                            count: import("zod").ZodNumber;
                        }, "strip", import("zod").ZodTypeAny, {
                            items: {
                                title: string;
                                timestamp?: string | undefined;
                                description?: string | undefined;
                                link?: string | undefined;
                            }[];
                            count: number;
                            name: string;
                            lastUpdated: string;
                        }, {
                            items: {
                                title: string;
                                timestamp?: string | undefined;
                                description?: string | undefined;
                                link?: string | undefined;
                            }[];
                            count: number;
                            name: string;
                            lastUpdated: string;
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
    /**
     * Create a standardized dashboard response
     */
    private createDashboardResponse;
    /**
     * Create a standardized error item for display
     */
    private createErrorItem;
    handle(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        dashboard: string;
        error: string | null;
        items: {
            title: string;
            subtitle: string;
            linkURL?: string | undefined;
            imageURL?: string | undefined;
        }[];
        timestamp: number;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
