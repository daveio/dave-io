import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAPIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { processImageOptimisation, type OptimisedImageResult } from "~/server/utils/image-processing"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { validateBase64Image, validateImageQuality, validateImageURL } from "~/server/utils/validation"

interface OptimisationOptions {
  quality?: number
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    // Require API authentication for image optimisation
    const auth = await requireAPIAuth(event, "images")

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
      // Handle base64 image processing
      const body = await readBody(event)

      if (typeof body === "string") {
        // Raw base64 string
        imageBuffer = await validateBase64Image(body)
      } else if (body && typeof body === "object") {
        // JSON object with options
        if (!body.image) {
          throw createApiError(400, "Base64 image data is required (image field)")
        }

        imageBuffer = await validateBase64Image(body.image)
        options.quality = validateImageQuality(body.quality)
      } else {
        throw createApiError(400, "Invalid request body format")
      }

      imageSource = "uploaded-file"
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image using shared utilities
    const result = await processImageOptimisation(imageBuffer, options, env as Env)

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "images/optimise", method, 200, {
      user: auth.payload?.sub || "anonymous",
      originalSize: result.originalSize,
      optimisedSize: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
      success: true
    })

    return createApiResponse(
      {
        url: result.url,
        originalSizeBytes: result.originalSize,
        optimisedSizeBytes: result.optimisedSize,
        compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
        format: result.format,
        hash: result.hash,
        imageSource,
        timestamp: new Date().toISOString()
      },
      "Image optimised successfully"
    )
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