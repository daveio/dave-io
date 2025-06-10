import { createApiResponse, createApiError } from '~/server/utils/response'
import { extractToken, verifyJWT, hasPermission } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Extract JWT token
    const token = extractToken(event)
    if (!token) {
      throw createApiError(401, 'No authentication token provided')
    }

    // Get JWT secret from environment
    const secret = process.env.API_JWT_SECRET
    if (!secret) {
      console.error('API_JWT_SECRET environment variable not set')
      throw createApiError(500, 'Authentication service unavailable')
    }

    // Verify JWT token
    const verification = await verifyJWT(token, secret)
    if (!verification.success || !verification.payload) {
      throw createApiError(401, verification.error || 'Invalid token')
    }

    const { payload } = verification

    // Check permissions - need api:* or admin
    const permissions = payload.permissions || [payload.sub]
    if (!hasPermission(permissions, 'api')) {
      throw createApiError(403, 'Insufficient permissions', {
        required: 'api:* or admin',
        provided: permissions
      })
    }

    try {
      // Import the WASM module
      const wasmModule = await import('~/wasm/imageops/pkg')
      
      // Initialize WASM module
      await wasmModule.default()
      
      // Get basic WASM info
      const wasmInfo = wasmModule.get_wasm_info()
      const parsedInfo = JSON.parse(wasmInfo)
      
      // Create a processor instance to get runtime info
      const processor = new wasmModule.ImageProcessor()
      const runtimeInfo = processor.get_info()
      const parsedRuntimeInfo = JSON.parse(runtimeInfo)
      
      return createApiResponse({
        wasm: {
          ...parsedInfo,
          runtime: parsedRuntimeInfo,
          status: 'loaded',
          module_path: '~/wasm/imageops/pkg'
        },
        environment: {
          worker: true,
          v8: true,
          webassembly_support: typeof WebAssembly !== 'undefined',
          available_memory: process.memoryUsage ? process.memoryUsage() : null
        },
        capabilities: {
          image_formats: ['PNG', 'JPEG', 'WebP'],
          operations: [
            'load_image',
            'resize', 
            'crop',
            'rotate90',
            'adjust_brightness',
            'adjust_contrast',
            'to_webp',
            'to_jpeg', 
            'to_png',
            'get_dimensions'
          ],
          size_optimized: true,
          memory_efficient: true
        }
      }, 'WASM module loaded successfully')
    } catch (wasmError) {
      console.error('WASM loading error:', wasmError)
      throw createApiError(500, 'WASM module failed to load', {
        error: wasmError instanceof Error ? wasmError.message : String(wasmError),
        suggestions: [
          'Ensure WASM module is built: bun run wasm:build',
          'Check module path exists: wasm/imageops/pkg',
          'Verify Cloudflare Workers WASM support'
        ]
      })
    }
  } catch (error) {
    console.error('WASM endpoint error:', error)
    throw createApiError(500, 'Internal server error', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
})