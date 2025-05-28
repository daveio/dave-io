import { trackRequestAnalytics } from "../../lib/analytics";
// Constants for rate limits and validations
export const MAX_REQUESTS_PER_HOUR = 100;
export const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
export const MAX_IMAGE_SIZE_MB = 4;
export const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
export const IMAGE_AI_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
/**
 * Base class for AI Alt Text endpoints with shared functionality
 */
export class AiAltBase {
    /**
     * Generate alt text from image using Cloudflare AI
     */
    async generateAltText(c, imageData) {
        try {
            // Prepare input for the AI model
            const input = {
                image: Array.from(imageData),
                prompt: "Generate detailed alt text describing this image for accessibility purposes. Be concise but descriptive."
            };
            // Call the Cloudflare AI model
            const result = (await c.env.AI.run(IMAGE_AI_MODEL, input));
            return result.description;
        }
        catch (error) {
            console.error("AI model inference error:", error);
            throw new Error("Failed to generate alt text from image");
        }
    }
    /**
     * Check rate limit for the user
     */
    async checkRateLimit(env, userId) {
        const now = Date.now();
        const rateKey = `ratelimit:ai:alt:${userId}`;
        // Get current usage
        const usage = (await env.DATA.get(rateKey, "json"));
        if (!usage || usage.resetTime < now) {
            // First request or window has expired, create new window
            const newResetTime = now + RATE_LIMIT_WINDOW;
            await env.DATA.put(rateKey, JSON.stringify({
                count: 1,
                resetTime: newResetTime
            }));
            return {
                allowed: true,
                remaining: MAX_REQUESTS_PER_HOUR - 1,
                resetTime: new Date(newResetTime)
            };
        }
        // Check if user has exceeded their limit
        if (usage.count >= MAX_REQUESTS_PER_HOUR) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(usage.resetTime)
            };
        }
        // Increment usage count
        await env.DATA.put(rateKey, JSON.stringify({
            count: usage.count + 1,
            resetTime: usage.resetTime
        }));
        return {
            allowed: true,
            remaining: MAX_REQUESTS_PER_HOUR - usage.count - 1,
            resetTime: new Date(usage.resetTime)
        };
    }
    /**
     * Create rate limit exceeded response
     */
    createRateLimitResponse(c, rateLimitResult) {
        return c.json({
            error: "Rate limit exceeded",
            code: "RATE_LIMIT_EXCEEDED",
            rateLimit: {
                remaining: rateLimitResult.remaining,
                reset: rateLimitResult.resetTime.toISOString(),
                limit: MAX_REQUESTS_PER_HOUR
            }
        }, 429);
    }
    /**
     * Create error response
     */
    createErrorResponse(c, error, code, status = 400, rateLimitResult) {
        const responseObj = {
            error,
            code
        };
        if (rateLimitResult) {
            responseObj.rateLimit = {
                remaining: rateLimitResult.remaining,
                reset: rateLimitResult.resetTime.toISOString(),
                limit: MAX_REQUESTS_PER_HOUR
            };
        }
        return c.json(responseObj, status);
    }
    /**
     * Create success response with alt text
     */
    createSuccessResponse(c, altText, imageSource, rateLimitResult) {
        return c.json({
            altText,
            image: imageSource,
            timestamp: new Date().toISOString(),
            rateLimit: {
                remaining: rateLimitResult.remaining - 1,
                reset: rateLimitResult.resetTime.toISOString(),
                limit: MAX_REQUESTS_PER_HOUR
            }
        });
    }
    /**
     * Track request in analytics
     */
    trackAnalytics(c, imageSource = null) {
        const analyticsData = {
            timestamp: Date.now(),
            path: c.req.path,
            method: c.req.method,
            status: 200,
            responseTime: 0,
            userAgent: c.req.header("user-agent"),
            queryParams: imageSource ? `image=${imageSource}` : ""
        };
        trackRequestAnalytics(c.env, analyticsData);
    }
    /**
     * Validate image size
     */
    validateImageSize(c, imageData) {
        if (imageData.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            return this.createErrorResponse(c, `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`, "IMAGE_TOO_LARGE");
        }
        return null;
    }
}
//# sourceMappingURL=base.js.map