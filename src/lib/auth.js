import jwt from "jsonwebtoken";
export function extractTokenFromRequest(c) {
    // Try Authorization header first
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    // Try query parameter as fallback
    const tokenParam = c.req.query("token");
    if (tokenParam) {
        return tokenParam;
    }
    return null;
}
export async function verifyJWT(token, secret) {
    try {
        const rawPayload = jwt.verify(token, secret);
        // Basic type assertion - removed schema validation
        return rawPayload;
    }
    catch (error) {
        console.error("JWT verification failed:", error);
        return null;
    }
}
export function createJWTMiddleware() {
    return async (c, next) => {
        const jwtSecret = c.env.API_JWT_SECRET;
        if (!jwtSecret) {
            console.error("API_JWT_SECRET environment variable not set");
            return c.json({ error: "Authentication not configured" }, 500);
        }
        const token = extractTokenFromRequest(c);
        if (!token) {
            return c.json({ error: "Authentication required" }, 401);
        }
        const payload = await verifyJWT(token, jwtSecret);
        if (!payload) {
            return c.json({ error: "Invalid token" }, 401);
        }
        // Check expiration (if exp is provided)
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return c.json({ error: "Token expired" }, 401);
        }
        try {
            // Import KV functions dynamically to avoid circular dependencies
            const { getTokenUsageCount, isTokenRevoked, trackTokenMetrics } = await import("../kv/auth");
            // Check if token is revoked
            const revoked = await isTokenRevoked(c.env, payload.jti);
            if (revoked) {
                await trackTokenMetrics(c.env, payload.jti, "revoked_access_attempt");
                return c.json({ error: "Token has been revoked" }, 401);
            }
            // Check request limits (if maxRequests is set)
            if (payload.maxRequests) {
                const currentUsage = await getTokenUsageCount(c.env, payload.jti);
                if (currentUsage >= payload.maxRequests) {
                    await trackTokenMetrics(c.env, payload.jti, "limit_exceeded");
                    return c.json({
                        error: "Request limit exceeded",
                        limit: payload.maxRequests,
                        used: currentUsage
                    }, 429);
                }
            }
            // Set user context with JWT info for later usage tracking
            ;
            c.user = {
                id: payload.sub
            };
            c.jwt = {
                uuid: payload.jti,
                sub: payload.sub
            };
            await next();
        }
        catch (error) {
            console.error("Error in JWT middleware KV operations:", error);
            return c.json({ error: "Authentication processing failed" }, 500);
        }
    };
}
export function requireAuth() {
    return createJWTMiddleware();
}
/**
 * Track successful token usage after request completion
 * Should be called only after the request has been successfully processed
 */
export async function trackSuccessfulUsage(c) {
    try {
        const { incrementTokenUsage, trackTokenMetrics } = await import("../kv/auth");
        await incrementTokenUsage(c.env, c.jwt.uuid);
        await trackTokenMetrics(c.env, c.jwt.uuid, "successful_auth");
    }
    catch (error) {
        console.error("Failed to track token usage:", error);
        // Don't throw - this shouldn't fail the request
    }
}
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
export function authorizeEndpoint(endpoint, subresource) {
    return async (c, handler) => {
        const authMiddleware = requireAuth();
        let authError = null;
        let result;
        try {
            // Run the standard JWT auth middleware first
            const authResult = await authMiddleware(c, async () => {
                // If we get here, JWT is valid and user is authenticated
                // Now check if the subject in the JWT matches our endpoint requirements
                const authorizedC = c;
                const subject = authorizedC.user.id;
                const fullResourcePattern = subresource ? `${endpoint}:${subresource}` : endpoint;
                // Authorize if:
                // 1. Subject matches exactly the endpoint (grants access to all subresources)
                // 2. Subject matches exactly the endpoint:subresource pattern
                if (subject === endpoint || subject === fullResourcePattern) {
                    result = await handler();
                    // Track usage only after successful completion
                    await trackSuccessfulUsage(authorizedC);
                }
                else {
                    // Set authorization failure error
                    authError = c.json({ error: "Not authorized for this resource" }, 403);
                }
            });
            // If the auth middleware returned a Response (auth failure), return it
            if (authResult instanceof Response) {
                return authResult;
            }
            // If we have an authorization error, return it
            if (authError) {
                return authError;
            }
            // Return the successful result
            return result;
        }
        catch (error) {
            console.error("Authorization error:", error);
            return c.json({ error: "Authorization processing failed" }, 500);
        }
    };
}
//# sourceMappingURL=auth.js.map