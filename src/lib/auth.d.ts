import type { Context } from "hono";
export interface JWTPayload {
    sub: string;
    iat: number;
    exp?: number;
    jti: string;
    maxRequests?: number;
}
export interface AuthorizedContext extends Context {
    user: {
        id: string;
    };
    jwt: {
        uuid: string;
        sub: string;
    };
}
export declare function extractTokenFromRequest(c: Context): string | null;
export declare function verifyJWT(token: string, secret: string): Promise<JWTPayload | null>;
export declare function createJWTMiddleware(): (c: Context, next: () => Promise<void>) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    limit: number;
    used: number;
}, 429, "json">) | undefined>;
export declare function requireAuth(): (c: Context, next: () => Promise<void>) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    limit: number;
    used: number;
}, 429, "json">) | undefined>;
/**
 * Track successful token usage after request completion
 * Should be called only after the request has been successfully processed
 */
export declare function trackSuccessfulUsage(c: AuthorizedContext): Promise<void>;
/**
 * Creates a middleware that authorizes access based on JWT subject matching
 * the specified endpoint and optional subresource.
 *
 * If the JWT subject is exactly "ENDPOINT", it authorizes access to all subresources.
 * If the JWT subject is "ENDPOINT:SUBRESOURCE", it only authorizes that specific subresource.
 *
 * Usage:
 * ```
 * // In your endpoint handle method:
 * async handle(c: Context) {
 *   const authResult = await authorizeEndpoint('ai', 'alt')(c, async () => {
 *     // Your endpoint logic here
 *     return c.json({ success: true })
 *   })
 *   return authResult
 * }
 * ```
 *
 * @param endpoint The main endpoint identifier
 * @param subresource Optional subresource identifier
 * @returns A function that checks JWT authorization and runs the handler
 */
export declare function authorizeEndpoint(endpoint: string, subresource?: string): <T>(c: Context, handler: () => Promise<T>) => Promise<Response | T>;
