import { getHeader, readBody } from "h3"
import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { processImageWithCloudflareImages } from "~/server/utils/cloudflare-images"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { ImageOptimisationQuerySchema, ImageOptimisationRequestSchema } from "~/server/utils/schemas"
import { parseImageUpload, validateImageURL } from "~/server/utils/validation"

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
      // Handle URL-based image processing with Zod validation
      const query = getQuery(event)
      const validatedQuery = ImageOptimisationQuerySchema.parse(query)

      const arrayBuffer = await validateImageURL(validatedQuery.url)
      imageBuffer = Buffer.from(arrayBuffer)
      imageSource = validatedQuery.url
      options.quality = validatedQuery.quality
    } else if (method === "POST") {
      // For POST, we still use parseImageUpload since it handles multipart forms
      // but we can validate JSON requests with Zod
      const contentType = getHeader(event, "content-type") || ""

      if (!contentType.toLowerCase().includes("multipart/form-data")) {
        // JSON request - use Zod validation
        const body = await readBody(event)
        const validatedBody = ImageOptimisationRequestSchema.parse(body)

        // Use existing parseImageUpload with validated body data
        const parsed = await parseImageUpload(event, { includeQuality: true })
        imageBuffer = parsed.buffer
        imageSource = parsed.source
        options.quality = validatedBody.quality || parsed.quality
      } else {
        // Multipart form - use existing parseImageUpload
        const parsed = await parseImageUpload(event, { includeQuality: true })
        imageBuffer = parsed.buffer
        imageSource = parsed.source
        options.quality = parsed.quality
      }
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image using Cloudflare Images
    const result = await processImageWithCloudflareImages(imageBuffer, options, env as Env)

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, "image/optimise", method, 200, {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, "image/optimise", method, statusCode, {
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
