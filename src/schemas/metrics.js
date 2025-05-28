import { z } from "zod";
import { ErrorResponseSchema, FormatQuerySchema, RouterOSMetricsSchema, StatusCodeMetricsSchema } from "./common";
export const RedirectMetricsSchema = z.object({
    slug: z.string().describe("Redirect slug"),
    count: z.number().int().min(0).describe("Number of redirects"),
    lastAccessed: z.string().describe("ISO timestamp of last access")
});
export const MetricsResponseSchema = z.object({
    timestamp: z.string().describe("ISO timestamp when metrics were generated"),
    statusCodes: z.record(z.string(), StatusCodeMetricsSchema).describe("HTTP status code metrics"),
    statusGroups: z.record(z.string(), StatusCodeMetricsSchema).describe("Status code group metrics (4xx, 5xx)"),
    routeros: RouterOSMetricsSchema.describe("RouterOS cache metrics"),
    redirects: z.array(RedirectMetricsSchema).describe("Redirect usage metrics")
});
export const MetricsYamlResponseSchema = z.string().describe("Metrics data in YAML format");
export const MetricsPrometheusResponseSchema = z.string().describe("Metrics data in Prometheus format");
export const MetricsRouteSchema = {
    tags: ["Metrics"],
    summary: "Get API metrics",
    description: "Returns comprehensive API metrics including status codes, RouterOS cache stats, and redirect usage. Supports JSON, YAML, and Prometheus formats.",
    request: {
        query: FormatQuerySchema
    },
    responses: {
        200: {
            description: "Metrics retrieved successfully",
            content: {
                "application/json": {
                    schema: MetricsResponseSchema
                },
                "application/yaml": {
                    schema: MetricsYamlResponseSchema
                },
                "text/plain": {
                    schema: MetricsPrometheusResponseSchema
                }
            }
        },
        500: {
            description: "Failed to retrieve metrics",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
//# sourceMappingURL=metrics.js.map