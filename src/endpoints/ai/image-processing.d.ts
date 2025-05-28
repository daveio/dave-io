import type { Context } from "hono";
import { AiAltBase } from "./base";
/**
 * Utility class for image processing operations
 */
export declare class ImageProcessor extends AiAltBase {
    /**
     * Process image URL and return image data or error response
     */
    processImageFromUrl(c: Context, imageUrl: string): Promise<Uint8Array | Response>;
    /**
     * Process base64 image data and return image data or error response
     */
    processBase64Image(c: Context, imageDataUrl: string): Uint8Array | Response;
}
