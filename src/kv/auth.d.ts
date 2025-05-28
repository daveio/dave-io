/**
 * KV operations for JWT authentication, usage tracking, and revocation
 */
export interface TokenUsageData {
    requestCount: number;
    lastUsed: string;
}
/**
 * Get current usage count for a token UUID
 */
export declare function getTokenUsageCount(env: Env, uuid: string): Promise<number>;
/**
 * Increment usage count for a token UUID
 */
export declare function incrementTokenUsage(env: Env, uuid: string): Promise<number>;
/**
 * Check if a token is revoked
 */
export declare function isTokenRevoked(env: Env, uuid: string): Promise<boolean>;
/**
 * Revoke a token
 */
export declare function revokeToken(env: Env, uuid: string): Promise<void>;
/**
 * Un-revoke a token (restore access)
 */
export declare function unrevokeToken(env: Env, uuid: string): Promise<void>;
/**
 * Get complete token usage information
 */
export declare function getTokenUsage(env: Env, uuid: string): Promise<{
    requestCount: number;
    lastUsed: string | null;
    isRevoked: boolean;
}>;
/**
 * Track token metrics for monitoring
 */
export declare function trackTokenMetrics(env: Env, uuid: string, event: string): Promise<void>;
