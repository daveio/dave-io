import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { processImageWithCloudflareImages } from "~/server/utils/cloudflare-images"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { parseImageUpload, validateImageQuality, validateImageURL } from "~/server/utils/validation"

interface OptimisationOptions {
  quality?: number
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    const env = getCloudflareEnv(event)

    let imageBuffer: Buffer
    let imageSource: string
    const options: OptimisationOptions = {}

    if (method === "GET") {
      // Handle URL-based image processing
      const query = getQuery(event)
      const imageUrl = query.url as string

      if (!imageUrl) {
        throw createApiError(400, "Image URL is required (url parameter)")
      }

      // Parse optimisation options from query parameters
      options.quality = validateImageQuality(query.quality)

      const arrayBuffer = await validateImageURL(imageUrl)
      imageBuffer = Buffer.from(arrayBuffer)
      imageSource = imageUrl
    } else if (method === "POST") {
      const parsed = await parseImageUpload(event, { includeQuality: true })
      imageBuffer = parsed.buffer
      imageSource = parsed.source
      options.quality = parsed.quality
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image using Cloudflare Images
    const result = await processImageWithCloudflareImages(imageBuffer, options, env as Env)

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "images/optimise", method, 200, {
      originalSize: result.originalSize,
      optimisedSize: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
      success: true
    })

    return createApiResponse({
      result: {
        url: result.url,
        originalSizeBytes: result.originalSize,
        optimisedSizeBytes: result.optimisedSize,
        compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
        format: result.format,
        hash: result.hash,
        imageSource,
        timestamp: new Date().toISOString()
      },
      message: "Image optimised successfully",
      error: null
    })
  } catch (error: unknown) {
    console.error("Image optimisation error:", error)

    // Record failed request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "images/optimise", method, statusCode, {
      user: "unknown",
      originalSize: 0,
      optimisedSize: 0,
      compressionRatio: 0,
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Image optimisation failed")
  }
})
