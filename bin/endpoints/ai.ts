import { BaseAdapter } from "./base"
import type { ApiResponse, RequestConfig } from "./base"

/**
 * Response format for AI social media text splitting
 */
interface SocialResponse {
  networks: Record<string, string[]>
}

/**
 * Adapter for AI-powered operations (/api/ai/*)
 * Social operations require 'ai:social' scope or higher for authentication
 */
export class AIAdapter extends BaseAdapter {
  constructor(config: RequestConfig = { baseUrl: "http://localhost:3000" }) {
    super(config)
  }

  /**
   * Split text into social media posts for multiple networks
   * @param input Text to split into social media posts
   * @param networks Array of networks to split for (bluesky, mastodon, threads, x)
   * @param options Optional configuration for splitting
   * @param options.markdown Enable markdown formatting for Mastodon
   * @param options.strategies Array of splitting strategies to use
   * @returns AI-split text for each network
   */
  async splitTextForSocial(
    input: string,
    networks: string[],
    options?: {
      markdown?: boolean
      strategies?: string[]
    }
  ): Promise<ApiResponse<SocialResponse>> {
    const body = {
      input,
      networks,
      ...options
    }

    return this.makeRequest("/api/ai/social", {
      method: "POST",
      body
    })
  }
}
