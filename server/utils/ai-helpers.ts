import OpenAI from "openai"
import type { CloudflareEnv } from "./cloudflare"
import { createApiError } from "./response"

/**
 * Creates an OpenRouter client configured with AI Gateway
 * @param env - Cloudflare environment bindings
 * @returns Configured OpenAI client for OpenRouter
 * @throws {Error} If required environment variables are missing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOpenRouterClient(env: any): Promise<OpenAI> {
  if (!env?.OPENROUTER_API_KEY) {
    throw createApiError(503, "OpenRouter API key not available")
  }

  if (!env?.CLOUDFLARE_ACCOUNT_ID) {
    throw createApiError(503, "Cloudflare account ID not available")
  }

  // Get secrets from Secrets Store
  let apiKey: string
  let cfApiToken: string = ""

  try {
    apiKey = await env.OPENROUTER_API_KEY.get()
  } catch (error) {
    console.error("Failed to retrieve OPENROUTER_API_KEY from Secrets Store:", error)
    throw createApiError(503, "Failed to retrieve OpenRouter API key")
  }

  if (env.CLOUDFLARE_API_TOKEN) {
    try {
      cfApiToken = await env.CLOUDFLARE_API_TOKEN.get()
    } catch (error) {
      console.error("Failed to retrieve CLOUDFLARE_API_TOKEN from Secrets Store:", error)
      // Continue without the token - it's optional
    }
  }

  return new OpenAI({
    apiKey,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/ai-dave-io/openrouter`,
    defaultHeaders: {
      "cf-aig-authorization": cfApiToken,
      "HTTP-Referer": "https://dave.io",
      "X-Title": "dave.io"
    }
  })
}

/**
 * OpenRouter model type for Claude 4 Sonnet
 */
export type OpenRouterModel = string

/**
 * Reads the AI model name from KV for a specific endpoint with fallback
 * @param env - Cloudflare environment bindings
 * @param endpointName - Name of the endpoint (e.g., "social", "alt", "word")
 * @returns Model name string or default fallback
 */
export async function getAIModelFromKV(env: CloudflareEnv, endpointName: string): Promise<string> {
  const DEFAULT_MODEL = "anthropic/claude-sonnet-4"

  if (!env?.KV) {
    console.warn("KV not available for endpoint", endpointName, ", using default model:", DEFAULT_MODEL)
    return DEFAULT_MODEL
  }

  try {
    const kvKey = `ai:model:${endpointName}`
    const modelName = await env.KV.get(kvKey)

    if (!modelName) {
      console.warn("No model configured in KV for key", kvKey, ", using default:", DEFAULT_MODEL)
      return DEFAULT_MODEL
    }

    console.log("Using AI model for", endpointName, ":", modelName)
    return modelName
  } catch (error) {
    console.error("Failed to read AI model from KV for endpoint", endpointName, ":", error)
    console.warn("Using default model:", DEFAULT_MODEL)
    return DEFAULT_MODEL
  }
}

/**
 * Sends a message to AI with optional image attachment via OpenRouter
 * @param openai - Configured OpenAI client
 * @param systemPrompt - System prompt for the AI
 * @param userMessage - User message content
 * @param model - OpenRouter model to use (defaults to "anthropic/claude-sonnet-4")
 * @param imageData - Optional image data (base64 encoded)
 * @param imageType - Optional image type (e.g., "image/jpeg")
 * @returns AI's response content
 * @throws {Error} If the request fails
 */
export async function sendAIMessage(
  openai: OpenAI,
  systemPrompt: string,
  userMessage: string,
  model?: OpenRouterModel,
  imageData?: string,
  imageType?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageContent: Array<any> = []

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
      type: "image_url",
      image_url: {
        url: `data:${imageType};base64,${imageData}`
      }
    })
  }

  const completion = await openai.chat.completions.create({
    model: model ?? "anthropic/claude-sonnet-4",
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: imageData ? messageContent : userMessage
      }
    ]
  })

  // Extract text content from response
  const textContent = completion.choices[0]?.message?.content
  if (!textContent) {
    throw new Error("No text content in AI response")
  }

  return textContent
}

/**
 * Parses AI's response, stripping markdown and extracting JSON
 * @param textContent - Raw text content from AI's response
 * @returns Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAIResponse<T = any>(textContent: string): T {
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
    console.error("Failed to parse AI response as JSON:", cleanedContent)
    console.error("Original response:", textContent)
    throw new Error("Invalid JSON response from AI")
  }
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

  // Check size (5MB limit for Claude via OpenRouter)
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

/**
 * Validates image data and converts to base64 if needed, with optimization support
 * @param imageData - Raw image data (Buffer, Uint8Array, or string)
 * @param env - Cloudflare environment bindings (required for optimization when needed)
 * @param _contentType - Image content type
 * @returns Object with base64 data and validated content type
 * @throws {Error} If image is invalid or too large
 */
export async function validateAndPrepareImageWithOptimization(
  imageData: Buffer | Uint8Array | string,
  env: CloudflareEnv,
  _contentType?: string
): Promise<{
  base64Data: string
  mimeType: string
}> {
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

  // Validate and potentially optimize size
  const { validateImageSizeWithOptimization } = await import("./image-helpers")
  const optimizedBuffer = await validateImageSizeWithOptimization(buffer, env)

  // After optimization, the output is always WebP
  // The optimization function always outputs WebP format
  let mimeType = "image/webp"

  // Verify the optimized buffer is actually WebP
  if (optimizedBuffer.length >= 12 && optimizedBuffer.subarray(8, 12).toString() === "WEBP") {
    mimeType = "image/webp"
  } else if (optimizedBuffer[0] === 0xff && optimizedBuffer[1] === 0xd8) {
    // Fallback detection in case optimization didn't work as expected
    mimeType = "image/jpeg"
  } else if (optimizedBuffer[0] === 0x89 && optimizedBuffer[1] === 0x50) {
    mimeType = "image/png"
  } else if (optimizedBuffer[0] === 0x47 && optimizedBuffer[1] === 0x49) {
    mimeType = "image/gif"
  } else {
    mimeType = "image/webp" // Default to WebP since that's what we expect
  }

  return {
    base64Data: optimizedBuffer.toString("base64"),
    mimeType
  }
}
