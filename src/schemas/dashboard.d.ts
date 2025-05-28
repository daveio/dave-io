import { z } from "zod";
export declare const DashboardParamSchema: z.ZodObject<{
    name: z.ZodEnum<["demo", "hn"]>;
}, "strip", z.ZodTypeAny, {
    name: "demo" | "hn";
}, {
    name: "demo" | "hn";
}>;
export declare const DashboardItemSchema: z.ZodObject<{
    title: z.ZodString;
    link: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    timestamp?: string | undefined;
    description?: string | undefined;
    link?: string | undefined;
}, {
    title: string;
    timestamp?: string | undefined;
    description?: string | undefined;
    link?: string | undefined;
}>;
export declare const DashboardResponseSchema: z.ZodObject<{
    name: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        link: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    lastUpdated: z.ZodString;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
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
export declare const DashboardRouteSchema: {
    tags: string[];
    summary: string;
    description: string;
    request: {
        params: z.ZodObject<{
            name: z.ZodEnum<["demo", "hn"]>;
        }, "strip", z.ZodTypeAny, {
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
                    schema: z.ZodObject<{
                        name: z.ZodString;
                        items: z.ZodArray<z.ZodObject<{
                            title: z.ZodString;
                            link: z.ZodOptional<z.ZodString>;
                            description: z.ZodOptional<z.ZodString>;
                            timestamp: z.ZodOptional<z.ZodString>;
                        }, "strip", z.ZodTypeAny, {
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
                        lastUpdated: z.ZodString;
                        count: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
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
