import Anthropic from "@anthropic-ai/sdk"
import { createApiError } from "./response"

/**
 * Creates an Anthropic client configured with AI Gateway
 * @param env - Cloudflare environment bindings
 * @returns Configured Anthropic client
 * @throws {Error} If required environment variables are missing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAnthropicClient(env: any): Anthropic {
  if (!env?.ANTHROPIC_API_KEY) {
    throw createApiError(503, "Anthropic API key not available")
  }

  if (!env?.CLOUDFLARE_ACCOUNT_ID) {
    throw createApiError(503, "Cloudflare account ID not available")
  }

  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/ai-dave-io/anthropic`,
    defaultHeaders: {
      "cf-aig-authorization": env.AI_GATEWAY_TOKEN || ""
    }
  })
}

/**
 * Parses Claude's response, stripping markdown and extracting JSON
 * @param textContent - Raw text content from Claude's response
 * @returns Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseClaudeResponse<T = any>(textContent: string): T {
  // Strip out Markdown code blocks and other non-JSON data
  let cleanedContent = textContent.trim()

  // Remove markdown code blocks (```json...``` or ```...```)
  cleanedContent = cleanedContent.replace(/```(?:json)?[\r\n]?([\s\S]*?)[\r\n]?```/g, "$1")

  // Remove any remaining markdown or extra whitespace
  cleanedContent = cleanedContent.trim()

  // If there are multiple JSON objects, try to find the first valid one
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanedContent = jsonMatch[0]
  }

  // Parse the JSON response
  try {
    return JSON.parse(cleanedContent) as T
  } catch {
    console.error("Failed to parse Claude response as JSON:", cleanedContent)
    console.error("Original response:", textContent)
    throw new Error("Invalid JSON response from Claude")
  }
}
export type ClaudeModel =
  | "claude-4-opus-20250514"
  | "claude-4-sonnet-20250514"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240307"

export function resolveClaudeVersion(version?: number, variant?: "haiku" | "sonnet" | "opus"): ClaudeModel {
  switch (variant ?? "sonnet") {
    case "opus":
      switch (version) {
        case 4:
          return "claude-4-opus-20250514"
        case 3:
          return "claude-3-opus-20240229"
        default:
          return "claude-4-opus-20250514"
      }
    case "sonnet":
      switch (version) {
        case 4:
          return "claude-4-sonnet-20250514"
        case 3:
          return "claude-3-7-sonnet-20250219"
        case 3.0:
          return "claude-3-sonnet-20240229"
        case 3.5:
          return "claude-3-5-sonnet-20241022"
        case 3.7:
          return "claude-3-7-sonnet-20250219"
        default:
          return "claude-4-sonnet-20250514"
      }
    case "haiku":
      switch (version) {
        case 3:
          return "claude-3-5-haiku-20241022"
        case 3.0:
          return "claude-3-haiku-20240307"
        case 3.5:
          return "claude-3-5-haiku-20241022"
        default:
          return "claude-3-5-haiku-20241022"
      }
    default:
      switch (version) {
        case 4:
          return "claude-4-sonnet-20250514"
        case 3:
          return "claude-3-7-sonnet-20250219"
        case 3.0:
          return "claude-3-sonnet-20240229"
        case 3.5:
          return "claude-3-5-sonnet-20241022"
        case 3.7:
          return "claude-3-7-sonnet-20250219"
        default:
          return "claude-4-sonnet-20250514"
      }
  }
}

export type ClaudeVariant = "haiku" | "sonnet" | "opus"

/**
 * Sends a message to Claude with optional image attachment
 * @param anthropic - Configured Anthropic client
 * @param systemPrompt - System prompt for Claude
 * @param userMessage - User message content
 * @param version - Optional Claude version (e.g., 3, 3.5, 4)
 * @param variant - Optional Claude variant ("haiku", "sonnet", "opus")
 * @param imageData - Optional image data (base64 encoded)
 * @param imageType - Optional image type (e.g., "image/jpeg")
 * @returns Claude's response content
 * @throws {Error} If the request fails
 */
export async function sendClaudeMessage(
  anthropic: Anthropic,
  systemPrompt: string,
  userMessage: string,
  version?: number,
  variant?: ClaudeVariant,
  imageData?: string,
  imageType?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageContent: Array<any> = []

  const claudeModel = resolveClaudeVersion(version, variant)

  // Add text content
  if (userMessage) {
    messageContent.push({
      type: "text",
      text: userMessage
    })
  }

  // Add image if provided
  if (imageData && imageType) {
    messageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageType,
        data: imageData
      }
    })
  }

  const result = await anthropic.messages.create({
    model: claudeModel,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: messageContent.length === 1 && !imageData ? userMessage : messageContent
      }
    ]
  })

  // Extract text content from Claude's response
  const textContent = result.content.find((block) => block.type === "text")?.text
  if (!textContent) {
    throw new Error("No text content in Claude response")
  }

  return textContent
}

/**
 * Validates image data and converts to base64 if needed
 * @param imageData - Raw image data (Buffer, Uint8Array, or string)
 * @param contentType - Image content type
 * @returns Object with base64 data and validated content type
 * @throws {Error} If image is invalid or too large
 */
export function validateAndPrepareImage(
  imageData: Buffer | Uint8Array | string,
  contentType?: string
): {
  base64Data: string
  mimeType: string
} {
  // Convert to Buffer if needed
  let buffer: Buffer
  if (typeof imageData === "string") {
    // Assume base64 if string
    buffer = Buffer.from(imageData, "base64")
  } else if (imageData instanceof Uint8Array) {
    buffer = Buffer.from(imageData)
  } else {
    buffer = imageData
  }

  // Check size (5MB limit for Claude)
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (buffer.length > MAX_SIZE) {
    throw createApiError(413, `Image size ${buffer.length} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes`)
  }

  // Determine MIME type
  let mimeType = contentType || "image/jpeg"

  // Basic MIME type validation for images
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    // Try to detect from buffer if not provided or invalid
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      mimeType = "image/jpeg"
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mimeType = "image/png"
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      mimeType = "image/gif"
    } else {
      mimeType = "image/jpeg" // Default fallback
    }
  }

  return {
    base64Data: buffer.toString("base64"),
    mimeType
  }
}
