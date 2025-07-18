import { BaseAdapter } from "./base"
import type { ApiResponse, RequestConfig } from "./base"

/**
 * Response format for AI social media text splitting
 */
interface SocialResponse {
  networks: Record<string, string[]>
}

/**
 * Response format for AI alt text generation
 */
interface AltTextResponse {
  alt_text: string
  confidence: number
}

/**
 * Response format for AI word alternative finding
 */
interface WordAlternativesResponse {
  suggestions: Array<{
    word: string
    confidence?: number
  }>
}

/**
 * Adapter for AI-powered operations (/api/ai/*)
 * Social operations require 'ai:social' scope or higher for authentication
 * Alt text operations require 'ai:alt' scope or higher for authentication
 * Word alternative operations require 'ai:word' scope or higher for authentication
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

  /**
   * Generate alt text for an image from a URL
   * @param imageUrl URL of the image to analyze
   * @returns AI-generated alt text and confidence score
   */
  async generateAltTextFromUrl(imageUrl: string): Promise<ApiResponse<AltTextResponse>> {
    return this.makeRequest("/api/ai/alt", {
      method: "GET",
      params: { image: imageUrl }
    })
  }

  /**
   * Generate alt text for an uploaded image file
   * @param filePath Path to the image file
   * @returns AI-generated alt text and confidence score
   */
  async generateAltTextFromFile(filePath: string): Promise<ApiResponse<AltTextResponse>> {
    const file = Bun.file(filePath)

    if (!(await file.exists())) {
      return {
        ok: false,
        error: `File not found: ${filePath}`
      }
    }

    const formData = new FormData()
    formData.append("image", file)

    return this.makeRequest("/api/ai/alt", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let the browser set it
      }
    })
  }

  /**
   * Find word alternatives for a single word
   * @param word Word to find alternatives for
   * @returns AI-generated word suggestions with confidence scores
   */
  async findWordAlternatives(word: string): Promise<ApiResponse<WordAlternativesResponse>> {
    const body = {
      mode: "single",
      word
    }

    return this.makeRequest("/api/ai/word", {
      method: "POST",
      body
    })
  }

  /**
   * Find word alternatives within a specific context
   * @param text The text context containing the word
   * @param targetWord The specific word to find alternatives for
   * @returns AI-generated word suggestions with confidence scores
   */
  async findWordAlternativesInContext(
    text: string,
    targetWord: string
  ): Promise<ApiResponse<WordAlternativesResponse>> {
    const body = {
      mode: "context",
      text,
      target_word: targetWord
    }

    return this.makeRequest("/api/ai/word", {
      method: "POST",
      body
    })
  }
}
