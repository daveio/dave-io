import { BaseAdapter } from "./base"
import type { ApiResponse, RequestConfig } from "./base"

/**
 * Response format for AI alt-text generation
 */
interface AltTextResponse {
  altText: string
  confidence?: number
  processingTime?: number
}

/**
 * Response format for AI ticket title generation
 */
interface TicketTitleResponse {
  title: string
}

/**
 * Response format for AI ticket description generation
 */
interface TicketDescriptionResponse {
  description: string
}

/**
 * Response format for AI ticket enrichment
 */
interface TicketEnrichResponse {
  description: string
}

/**
 * Response format for AI social media text splitting
 */
interface SocialResponse {
  networks: Record<string, string[]>
}

/**
 * Adapter for AI-powered operations (/api/ai/*)
 * Alt-text operations require 'ai:alt' scope or higher for authentication
 * Social operations require 'ai:social' scope or higher for authentication
 * Ticket operations are public (no authentication required)
 */
export class AIAdapter extends BaseAdapter {
  constructor(config: RequestConfig = { baseUrl: "http://localhost:3000" }) {
    super(config)
  }

  /**
   * Convert a file to base64 encoding
   * @param filePath Path to the file
   * @returns Base64 encoded file content
   */
  private async fileToBase64(filePath: string): Promise<string> {
    try {
      // Use Node.js fs module to read the file
      const fs = await import("node:fs/promises")
      const data = await fs.readFile(filePath)
      return Buffer.from(data).toString("base64")
    } catch (error) {
      console.error("Error reading file:", filePath, error)
      throw new Error(`Failed to read file at ${filePath}`)
    }
  }

  /**
   * Generate alt-text description from an image URL
   * @param imageUrl URL of the image to analyze
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromUrl(imageUrl: string): Promise<ApiResponse<AltTextResponse>> {
    return this.uploadImageFromUrl("/api/ai/alt", imageUrl) as Promise<ApiResponse<AltTextResponse>>
  }

  /**
   * Generate alt-text description from a local image file
   * @param filePath Path to the local image file
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromFile(filePath: string): Promise<ApiResponse<AltTextResponse>> {
    return this.uploadFile("/api/ai/alt", filePath) as Promise<ApiResponse<AltTextResponse>>
  }

  /**
   * Generate alt-text description from base64 encoded image data
   * @param base64Data Base64 encoded image data (without data URL prefix)
   * @returns AI-generated alt-text description
   */
  async generateAltTextFromBase64(base64Data: string): Promise<ApiResponse<AltTextResponse>> {
    return this.makeRequest("/api/ai/alt", {
      method: "POST",
      body: { image: base64Data }
    })
  }

  /**
   * Generate a title for a Linear ticket from description and/or image
   * @param description Optional description text
   * @param imageFilePath Optional path to image file
   * @returns AI-generated ticket title
   */
  async generateTicketTitle(description?: string, imageFilePath?: string): Promise<ApiResponse<TicketTitleResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {}

    if (description) {
      body.description = description
    }

    if (imageFilePath) {
      const imageData = await this.fileToBase64(imageFilePath)
      const filename = imageFilePath.split("/").pop() || "image"
      body.image = {
        data: imageData,
        filename
      }
    }

    return this.makeRequest("/api/ai/ticket/title", {
      method: "POST",
      body
    })
  }

  /**
   * Generate a description for a Linear ticket from title
   * @param title The ticket title
   * @returns AI-generated ticket description
   */
  async generateTicketDescription(title: string): Promise<ApiResponse<TicketDescriptionResponse>> {
    return this.makeRequest("/api/ai/ticket/description", {
      method: "POST",
      body: { title }
    })
  }

  /**
   * Enrich a Linear ticket description with additional context
   * @param title The ticket title
   * @param description Optional existing description
   * @param imageFilePath Optional path to image file for additional context
   * @returns AI-enriched ticket description
   */
  async enrichTicketDescription(
    title: string,
    description?: string,
    imageFilePath?: string
  ): Promise<ApiResponse<TicketEnrichResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = { title }

    if (description) {
      body.description = description
    }

    if (imageFilePath) {
      const imageData = await this.fileToBase64(imageFilePath)
      const filename = imageFilePath.split("/").pop() || "image"
      body.image = {
        data: imageData,
        filename
      }
    }

    return this.makeRequest("/api/ai/ticket/enrich", {
      method: "POST",
      body
    })
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
