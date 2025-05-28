import { z } from "zod";
import { ErrorResponseSchema, RouterOSMetricsSchema } from "./common";
export const RouterOSScriptResponseSchema = z.object({
    script: z.string().describe("Generated RouterOS script"),
    provider: z.string().describe("Provider name (e.g., 'put.io')"),
    lastUpdated: z.string().describe("ISO timestamp of last script generation"),
    ipv4Count: z.number().int().min(0).describe("Number of IPv4 ranges"),
    ipv6Count: z.number().int().min(0).describe("Number of IPv6 ranges"),
    cacheStatus: z.enum(["hit", "miss", "generated"]).describe("Cache status")
});
export const RouterOSCacheStatusResponseSchema = z.object({
    status: z.string().describe("Cache status description"),
    lastUpdated: z.string().describe("ISO timestamp of last cache update"),
    lastError: z.string().optional().describe("Last error message if any"),
    lastAttempt: z.string().describe("ISO timestamp of last attempt"),
    updateInProgress: z.boolean().describe("Whether an update is currently in progress"),
    metrics: RouterOSMetricsSchema.describe("Cache metrics")
});
export const RouterOSResetResponseSchema = z.object({
    message: z.string().describe("Reset confirmation message"),
    timestamp: z.string().describe("ISO timestamp when reset was performed"),
    clearedItems: z.array(z.string()).describe("List of cleared cache items")
});
export const RouterOSPutIORouteSchema = {
    tags: ["RouterOS"],
    summary: "Generate RouterOS script for put.io IP ranges",
    description: "Generates a RouterOS script to configure firewall rules for put.io IP ranges. Uses cached data when available.",
    responses: {
        200: {
            description: "RouterOS script generated successfully",
            content: {
                "application/json": {
                    schema: RouterOSScriptResponseSchema
                }
            }
        },
        500: {
            description: "Failed to generate script",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
export const RouterOSCacheRouteSchema = {
    tags: ["RouterOS"],
    summary: "Get RouterOS cache status",
    description: "Returns the current status of the RouterOS cache including metrics and last update information",
    responses: {
        200: {
            description: "Cache status retrieved successfully",
            content: {
                "application/json": {
                    schema: RouterOSCacheStatusResponseSchema
                }
            }
        },
        500: {
            description: "Failed to retrieve cache status",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
export const RouterOSResetRouteSchema = {
    tags: ["RouterOS"],
    summary: "Reset RouterOS cache",
    description: "Clears all cached RouterOS data, forcing fresh data retrieval on next request",
    responses: {
        200: {
            description: "Cache reset successfully",
            content: {
                "application/json": {
                    schema: RouterOSResetResponseSchema
                }
            }
        },
        500: {
            description: "Failed to reset cache",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
//# sourceMappingURL=routeros.js.map