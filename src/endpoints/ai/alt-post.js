import { OpenAPIRoute } from "chanfana";
import { authorizeEndpoint } from "../../lib/auth";
import { AiAltPostRouteSchema } from "../../schemas/ai";
import { ImageProcessor } from "./image-processing";
/**
 * AI Alt Text Generation Endpoint (POST)
 * Handles POST requests with base64-encoded image data
 */
export class AiAltPost extends OpenAPIRoute {
    // @ts-ignore - Schema validation working, type compatibility issue with external Zod definitions
    schema = AiAltPostRouteSchema;
    processor = new ImageProcessor();
    /**
     * Handles POST requests with base64 image data
     */
    async handle(c) {
        // Extract image data from request body directly
        let body = {};
        try {
            body = await c.req.json();
        }
        catch (error) {
            console.error("Failed to parse JSON body:", error);
            return c.json({ error: "Invalid JSON in request body", code: "INVALID_JSON" }, 400);
        }
        const image = body.image;
        // Now run through authorization and processing
        return authorizeEndpoint("ai", "alt")(c, async () => {
            if (!image) {
                return this.processor.createErrorResponse(c, "No image data provided.", "NO_IMAGE_PROVIDED");
            }
            const authContext = c;
            const userId = authContext.user.id;
            // Check rate limit before processing
            const rateLimitResult = await this.processor.checkRateLimit(c.env, userId);
            if (!rateLimitResult.allowed) {
                return this.processor.createRateLimitResponse(c, rateLimitResult);
            }
            // Process the base64 image
            const imageData = this.processor.processBase64Image(c, image);
            // If the result is a Response (error), return it
            if (imageData instanceof Response) {
                return imageData;
            }
            try {
                // Process the image using Cloudflare AI
                const altText = await this.processor.generateAltText(c, imageData);
                // Track success in analytics
                this.processor.trackAnalytics(c, null);
                // Return successful response
                return this.processor.createSuccessResponse(c, altText, "base64", rateLimitResult);
            }
            catch (error) {
                console.error("Error generating alt text:", error);
                return this.processor.createErrorResponse(c, "Failed to generate alt text", "AI_PROCESSING_ERROR", 500, rateLimitResult);
            }
        });
    }
}
//# sourceMappingURL=alt-post.js.map