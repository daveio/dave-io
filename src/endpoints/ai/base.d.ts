import type { Context } from "hono";
export declare const MAX_REQUESTS_PER_HOUR = 100;
export declare const RATE_LIMIT_WINDOW: number;
export declare const MAX_IMAGE_SIZE_MB = 4;
export declare const VALID_IMAGE_EXTENSIONS: string[];
export declare const IMAGE_AI_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
/**
 * Base class for AI Alt Text endpoints with shared functionality
 */
export declare abstract class AiAltBase {
    /**
     * Generate alt text from image using Cloudflare AI
     */
    generateAltText(c: Context, imageData: Uint8Array): Promise<string>;
    /**
     * Check rate limit for the user
     */
    checkRateLimit(env: {
        DATA: KVNamespace;
    }, userId: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
    }>;
    /**
     * Create rate limit exceeded response
     */
    createRateLimitResponse(c: Context, rateLimitResult: {
        remaining: number;
        resetTime: Date;
    }): Response & import("hono").TypedResponse<{
        error: string;
        code: string;
        rateLimit: {
            remaining: number;
            reset: string;
            limit: number;
        };
    }, 429, "json">;
    /**
     * Create error response
     */
    createErrorResponse(c: Context, error: string, code: string, status?: 400 | 401 | 403 | 429 | 500, rateLimitResult?: {
        remaining: number;
        resetTime: Date;
    }): Response & import("hono").TypedResponse<{
        error: string;
        code?: string | undefined;
        rateLimit?: {
            remaining: number;
            reset: string;
            limit: number;
        } | undefined;
    }, 500 | 400 | 401 | 403 | 429, "json">;
    /**
     * Create success response with alt text
     */
    createSuccessResponse(c: Context, altText: string, imageSource: string, rateLimitResult: {
        remaining: number;
        resetTime: Date;
    }): Response & import("hono").TypedResponse<{
        altText: string;
        image: string;
        timestamp: string;
        rateLimit: {
            remaining: number;
            reset: string;
            limit: number;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">;
    /**
     * Track request in analytics
     */
    trackAnalytics(c: Context, imageSource?: string | null): void;
    /**
     * Validate image size
     */
    validateImageSize(c: Context, imageData: Uint8Array): (Response & import("hono").TypedResponse<{
        error: string;
        code?: string | undefined;
        rateLimit?: {
            remaining: number;
            reset: string;
            limit: number;
        } | undefined;
    }, 500 | 400 | 401 | 403 | 429, "json">) | null;
}
