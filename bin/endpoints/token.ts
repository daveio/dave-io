import { BaseAdapter } from "./base"
import type { ApiResponse } from "./base"

/**
 * Response format for token usage information
 */
interface TokenUsageResponse {
  uuid: string
  usage: {
    total: number
    success: number
    error: number
    lastUsed?: string
    endpoints?: Record<string, number>
  }
  metadata?: {
    sub: string
    description?: string
    createdAt: string
    expiresAt?: string
  }
}

/**
 * Response format for token revocation operations
 */
interface TokenRevokeResponse {
  revoked: boolean
  timestamp: string
  uuid: string
}

/**
 * Adapter for token management operations (/api/token/*)
 * Requires 'api:token' scope or higher for authentication
 */
export class TokenAdapter extends BaseAdapter {
  /**
   * Get basic token information and metadata
   * @param uuid Token UUID to query
   * @returns Token information including usage stats
   */
  async getTokenInfo(uuid: string): Promise<ApiResponse<TokenUsageResponse>> {
    return this.makeRequest(`/api/token/${uuid}`)
  }

  /**
   * Get detailed token usage statistics
   * @param uuid Token UUID to query
   * @returns Detailed usage statistics for the token
   */
  async getTokenUsage(uuid: string): Promise<ApiResponse<TokenUsageResponse>> {
    return this.makeRequest(`/api/token/${uuid}/usage`)
  }

  /**
   * Revoke a token (mark as invalid)
   * @param uuid Token UUID to revoke
   * @param revoked Whether to revoke (true) or unrevoke (false)
   * @returns Revocation result
   */
  async revokeToken(uuid: string, revoked = true): Promise<ApiResponse<TokenRevokeResponse>> {
    return this.makeRequest(`/api/token/${uuid}/revoke`, {
      method: "POST",
      body: { revoked }
    })
  }

  /**
   * Unrevoke a previously revoked token
   * @param uuid Token UUID to unrevoke
   * @returns Unrevocation result
   */
  async unrevokeToken(uuid: string): Promise<ApiResponse<TokenRevokeResponse>> {
    return this.revokeToken(uuid, false)
  }

  /**
   * Perform dynamic operations on token endpoints
   * @param uuid Token UUID
   * @param path Dynamic path under the token endpoint
   * @returns Dynamic operation result
   */
  async dynamicTokenOperation(uuid: string, path: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/token/${uuid}/${path}`)
  }
}
