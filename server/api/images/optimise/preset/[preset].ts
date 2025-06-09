import { recordAPIErrorMetrics, recordAPIMetrics } from "~/server/middleware/metrics"
import { requireAPIAuth } from "~/server/utils/auth-helpers"
import { getCloudflareEnv } from "~/server/utils/cloudflare"
import { PRESETS, processPresetOptimisation } from "~/server/utils/image-presets"
import { createApiError, createApiResponse, isApiError, logRequest } from "~/server/utils/response"
import { validateBase64Image, validateImageURL } from "~/server/utils/validation"

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  try {
    // Require API authentication for image optimisation
    const auth = await requireAPIAuth(event, "images")

    const env = getCloudflareEnv(event)

    // Get preset from route parameter
    const presetName = getRouterParam(event, "preset")

    if (!presetName) {
      throw createApiError(400, "Preset parameter is required")
    }

    const preset = PRESETS[presetName]
    if (!preset) {
      const availablePresets = Object.keys(PRESETS).join(", ")
      throw createApiError(400, `Unknown preset '${presetName}'. Available presets: ${availablePresets}`)
    }

    let imageBuffer: Buffer
    let imageSource: string

    if (method === "GET") {
      // Handle URL-based image processing
      const query = getQuery(event)
      const imageUrl = query.url as string

      if (!imageUrl) {
        throw createApiError(400, "Image URL is required (url parameter)")
      }

      const arrayBuffer = await validateImageURL(imageUrl)
      imageBuffer = Buffer.from(arrayBuffer)
      imageSource = imageUrl
    } else if (method === "POST") {
      // Handle base64 image processing
      const body = await readBody(event)

      if (typeof body === "string") {
        // Raw base64 string
        imageBuffer = await validateBase64Image(body)
      } else if (body && typeof body === "object" && body.image) {
        // JSON object with image field
        imageBuffer = await validateBase64Image(body.image)
      } else {
        throw createApiError(400, "Base64 image data is required")
      }

      imageSource = "uploaded-file"
    } else {
      throw createApiError(405, `Method ${method} not allowed`)
    }

    // Process the image with the preset using shared utilities
    const result = await processPresetOptimisation(imageBuffer, presetName, env as Env)

    // Verify the result meets preset requirements
    if (result.optimisedSize > preset.maxSizeBytes) {
      console.warn(
        `Warning: Optimised image (${result.optimisedSize} bytes) exceeds preset limit (${preset.maxSizeBytes} bytes)`
      )
    }

    // Record successful request
    recordAPIMetrics(event, 200)

    // Log successful request
    logRequest(event, `images/optimise/preset/${presetName}`, method, 200, {
      user: auth.payload?.sub || "anonymous",
      originalSize: result.originalSize,
      optimisedSize: result.optimisedSize,
      compressionRatio: Math.round((1 - result.optimisedSize / result.originalSize) * 100),
      quality: result.quality,
      preset: presetName,
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
        quality: result.quality,
        preset: {
          name: presetName,
          description: preset.description,
          maxSizeBytes: preset.maxSizeBytes
        },
        imageSource,
        timestamp: new Date().toISOString()
      },
      `Image optimised with '${presetName}' preset successfully`
    )
  } catch (error: unknown) {
    console.error(`Preset optimisation error (${getRouterParam(event, "preset")}):`, error)

    // Record failed request
    recordAPIErrorMetrics(event, error)

    // Log error request
    // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for error handling
    const statusCode = isApiError(error) ? (error as any).statusCode || 500 : 500
    logRequest(event, `images/optimise/preset/${getRouterParam(event, "preset")}`, method, statusCode, {
      user: "unknown",
      originalSize: 0,
      optimisedSize: 0,
      compressionRatio: 0,
      quality: 0,
      preset: getRouterParam(event, "preset") || "unknown",
      success: false
    })

    // Re-throw API errors
    if (isApiError(error)) {
      throw error
    }

    throw createApiError(500, "Preset image optimisation failed")
  }
})