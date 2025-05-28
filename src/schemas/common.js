import { z } from "zod";
// Common response schemas
export const ErrorResponseSchema = z.object({
    error: z.string().describe("Error message"),
    code: z.string().optional().describe("Error code for programmatic handling"),
    timestamp: z.string().optional().describe("ISO timestamp when error occurred")
});
export const SuccessResponseSchema = z.object({
    message: z.string().describe("Success message"),
    timestamp: z.string().describe("ISO timestamp when response was generated")
});
// Common parameter schemas
export const SlugParamSchema = z.object({
    slug: z.string().min(1).describe("URL slug identifier")
});
export const UuidParamSchema = z.object({
    uuid: z.string().uuid().describe("UUID identifier")
});
// Common query parameter schemas
export const FormatQuerySchema = z.object({
    format: z.enum(["json", "yaml", "prometheus"]).optional().describe("Response format")
});
// Rate limit information schema
export const RateLimitSchema = z.object({
    remaining: z.number().int().min(0).describe("Remaining requests in current window"),
    reset: z.string().describe("ISO timestamp when rate limit resets"),
    limit: z.number().int().positive().describe("Total requests allowed per window")
});
// JWT/Auth related schemas
export const JWTDetailsSchema = z.object({
    subject: z.string().describe("JWT subject claim"),
    subjectParts: z.array(z.string()).describe("Subject split by colons for hierarchical permissions"),
    issuedAt: z.number().int().describe("JWT issued at timestamp"),
    expiresAt: z.number().int().optional().describe("JWT expiration timestamp"),
    timeToExpiry: z.number().int().optional().describe("Time to expiry in seconds"),
    isExpired: z.boolean().describe("Whether the JWT is expired")
});
export const UserSchema = z.object({
    id: z.string().describe("User identifier from JWT subject")
});
// Analytics and metrics schemas
export const StatusCodeMetricsSchema = z.object({
    count: z.number().int().min(0).describe("Number of occurrences"),
    lastSeen: z.string().describe("ISO timestamp of last occurrence")
});
export const RouterOSMetricsSchema = z.object({
    cacheHits: z.number().int().min(0).describe("Number of cache hits"),
    cacheMisses: z.number().int().min(0).describe("Number of cache misses"),
    cacheResets: z.number().int().min(0).describe("Number of cache resets"),
    lastAccessed: z.string().describe("ISO timestamp of last access"),
    lastRefresh: z.string().describe("ISO timestamp of last refresh"),
    refreshCount: z.number().int().min(0).describe("Number of refreshes"),
    lastReset: z.string().describe("ISO timestamp of last reset"),
    resetCount: z.number().int().min(0).describe("Number of resets")
});
// Common headers
export const CommonHeaders = {
    authorization: z.string().optional().describe("Bearer token for authentication"),
    "content-type": z.string().optional().describe("Request content type")
};
//# sourceMappingURL=common.js.map