# Go Reader WASM Integration Guide

## Overview

This guide outlines how to integrate the Go Reader WASM module into the existing next-dave-io Nuxt.js application running on Cloudflare Workers. The integration provides a web page readability proxy with Catppuccin Mocha theming at the `/api/reader/{url}` endpoint.

## Current Architecture Analysis

### Existing Codebase Structure

The next-dave-io application is a Nuxt.js 3 application with the following key characteristics:

- **Runtime**: Cloudflare Workers (nitro preset: "cloudflare_module")
- **Framework**: Nuxt.js 3.17.5 with TypeScript
- **API Structure**: File-based routing in `server/api/` and `server/routes/`
- **WASM Support**: Already enabled via `nitro.experimental.wasm: true`
- **Validation**: Zod schemas for API requests/responses
- **Metrics**: Comprehensive KV-based metrics system
- **Authentication**: JWT-based auth with middleware
- **CORS**: Configured for API endpoints

### Current API Endpoints

```
/api/internal/health        - Health check
/api/internal/metrics       - System metrics  
/api/internal/auth          - Authentication
/api/ai/alt                 - AI alt text generation
/api/dashboard/[name]       - Dashboard data
/api/tokens/[uuid]          - Token management
/go/[slug]                  - URL redirects
```

## Integration Strategy

### Option 1: Native API Integration (Recommended)

Mount the Go Reader at `/api/reader/{url}` to maintain consistency with existing API structure.

#### Implementation Steps

1. **Add WASM Build Process**
   ```bash
   # Add to package.json scripts
   "build:wasm": "GOOS=js GOARCH=wasm go build -o public/reader.wasm wasm.go",
   "build": "bun run build:wasm && bun run types && bun run nuxt build"
   ```

2. **Create Reader API Endpoint**
   ```typescript
   // server/api/reader/[...path].get.ts
   import { readFileSync } from 'node:fs'
   import { join } from 'node:path'
   
   export default defineEventHandler(async (event) => {
     const path = getRouterParam(event, 'path')
     const url = Array.isArray(path) ? path.join('/') : path
     
     if (!url) {
       throw createError({
         statusCode: 400,
         statusMessage: 'URL parameter required'
       })
     }
     
     // Load and instantiate WASM module
     const wasmPath = join(process.cwd(), 'public/reader.wasm')
     const wasmBuffer = readFileSync(wasmPath)
     const wasmModule = await WebAssembly.instantiate(wasmBuffer)
     
     // Process URL through WASM
     const result = await processURLWithWASM(wasmModule, url)
     
     // Return HTML response
     setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
     return result
   })
   ```

3. **WASM Module Integration**
   ```typescript
   // server/utils/reader-wasm.ts
   interface GoWASM {
     exports: {
       processURL: (url: string) => string
       memory: WebAssembly.Memory
     }
   }
   
   export async function processURLWithWASM(module: WebAssembly.Module, url: string): Promise<string> {
     const instance = await WebAssembly.instantiate(module) as GoWASM
     return instance.exports.processURL(url)
   }
   ```

4. **Add Reader Schema**
   ```typescript
   // server/utils/schemas.ts
   export const ReaderRequestSchema = z.object({
     url: z.string().url().max(2048)
   })
   
   export const ReaderResponseSchema = z.object({
     success: z.literal(true),
     content: z.string(),
     metadata: z.object({
       title: z.string(),
       author: z.string().optional(),
       publishDate: z.string().optional(),
       description: z.string().optional()
     }).optional(),
     timestamp: z.string()
   })
   ```

5. **Update Nuxt Configuration**
   ```typescript
   // nuxt.config.ts additions
   nitro: {
     preset: "cloudflare_module",
     experimental: {
       wasm: true
     },
     routeRules: {
       "/api/reader/**": {
         cors: true,
         headers: {
           "Cache-Control": "public, max-age=3600",
           "Content-Type": "text/html; charset=utf-8"
         }
       }
     }
   }
   ```

### Option 2: Separate Route Mount

If API namespace conflicts arise, mount at `/reader/{url}` instead.

#### Implementation

1. **Create Reader Route**
   ```typescript
   // server/routes/reader/[...path].get.ts
   export default defineEventHandler(async (event) => {
     // Same implementation as Option 1
   })
   ```

2. **Update Route Rules**
   ```typescript
   // nuxt.config.ts
   routeRules: {
     "/reader/**": {
       cors: true,
       headers: {
         "Cache-Control": "public, max-age=3600",
         "Content-Type": "text/html; charset=utf-8"
       }
     }
   }
   ```

## WASM Module Considerations

### Memory Management

```typescript
// Implement proper cleanup
export class WASMReaderManager {
  private module: WebAssembly.Module | null = null
  private instance: WebAssembly.Instance | null = null
  
  async initialize() {
    const wasmBuffer = await this.loadWASM()
    this.module = await WebAssembly.compile(wasmBuffer)
  }
  
  async processURL(url: string): Promise<string> {
    if (!this.module) await this.initialize()
    
    this.instance = await WebAssembly.instantiate(this.module)
    try {
      return this.callGoFunction('processURL', url)
    } finally {
      this.cleanup()
    }
  }
  
  private cleanup() {
    this.instance = null
  }
}
```

### Error Handling

```typescript
export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()
    const url = validateReaderURL(event)
    
    const content = await wasmManager.processURL(url)
    
    // Log successful request
    logRequest(event, 'reader', 'GET', 200, {
      target: url,
      responseTime: `${Date.now() - startTime}ms`
    })
    
    return content
  } catch (error) {
    const statusCode = getErrorStatusCode(error)
    logRequest(event, 'reader', 'GET', statusCode, {
      error: error.message
    })
    
    throw createApiError(statusCode, error.message)
  }
})
```

## Deployment Process

### Build Pipeline

1. **Update Build Scripts**
   ```json
   {
     "scripts": {
       "build:go": "go mod tidy",
       "build:wasm": "GOOS=js GOARCH=wasm go build -o public/reader.wasm wasm.go",
       "build": "bun run build:go && bun run build:wasm && bun run types && bun run nuxt build"
     }
   }
   ```

2. **Wrangler Configuration**
   ```jsonc
   // wrangler.jsonc additions
   {
     "compatibility_flags": ["nodejs_compat", "nodejs_compat_populate_process_env"],
     "build": {
       "command": "bun run build"
     }
   }
   ```

### Asset Management

- **WASM File**: Bundle in `public/` directory for Worker access
- **Size Optimization**: Use Go build flags for smaller WASM output
- **Caching**: Leverage Cloudflare's edge caching for WASM module

## Security Considerations

### Input Validation

```typescript
function validateReaderURL(event: H3Event): string {
  const path = getRouterParam(event, 'path')
  const url = Array.isArray(path) ? path.join('/') : path
  
  if (!url) {
    throw createApiError(400, 'URL parameter required')
  }
  
  // Fix Go path handling (single slash)
  const normalizedURL = url.startsWith('https:/') && !url.startsWith('https://') 
    ? url.replace('https:/', 'https://') 
    : url
  
  const validated = ReaderRequestSchema.parse({ url: normalizedURL })
  return validated.url
}
```

### Rate Limiting

```typescript
// Integrate with existing metrics system
export default defineEventHandler(async (event) => {
  const cfInfo = getCloudflareRequestInfo(event)
  
  // Check rate limits
  await checkRateLimit(cfInfo.ip, 'reader', 100) // 100 requests per hour
  
  // Process request...
  
  // Update metrics
  await updateReaderMetrics(cfInfo.ip, 200)
})
```

## Monitoring & Metrics

### Integration with Existing KV Metrics

```typescript
// server/utils/reader-metrics.ts
export async function updateReaderMetrics(
  ip: string, 
  statusCode: number, 
  processingTime: number
) {
  const kv = getKVNamespace()
  
  // Update metrics using the flat key/value approach
  await Promise.all([
    updateResourceMetrics(kv, 'reader', statusCode),
    updateVisitorMetrics(kv, 'reader', ip),
    updateTimeMetrics(kv, 'reader', processingTime)
  ])
}
```

### Health Checks

```typescript
// server/api/internal/reader-health.get.ts
export default defineEventHandler(async (event) => {
  const healthData = {
    status: "ok" as const,
    wasm_loaded: await checkWASMAvailability(),
    memory_usage: getWASMMemoryUsage(),
    timestamp: new Date().toISOString()
  }
  
  return createApiResponse(healthData, "Reader service is healthy")
})
```

## Testing Strategy

### Unit Tests

```typescript
// test/reader.test.ts
describe('Reader API', () => {
  test('processes valid URL', async () => {
    const response = await $fetch('/api/reader/https:/example.com')
    expect(response).toContain('<!DOCTYPE html>')
  })
  
  test('handles invalid URL', async () => {
    await expect($fetch('/api/reader/invalid')).rejects.toThrow()
  })
})
```

### Integration Tests

```typescript
// test/wasm-integration.test.ts
describe('WASM Integration', () => {
  test('loads WASM module successfully', async () => {
    const manager = new WASMReaderManager()
    await expect(manager.initialize()).resolves.not.toThrow()
  })
})
```

## Performance Optimizations

### WASM Module Caching

```typescript
// Cache compiled WASM module globally
let cachedWASMModule: WebAssembly.Module | null = null

export async function getWASMModule(): Promise<WebAssembly.Module> {
  if (!cachedWASMModule) {
    const wasmBuffer = await loadWASMBuffer()
    cachedWASMModule = await WebAssembly.compile(wasmBuffer)
  }
  return cachedWASMModule
}
```

### Response Caching

```typescript
// Implement content caching
export default defineEventHandler(async (event) => {
  const url = validateReaderURL(event)
  const cacheKey = `reader:${hashURL(url)}`
  
  // Check cache first
  const cached = await getFromCache(cacheKey)
  if (cached) {
    setHeader(event, 'X-Cache', 'HIT')
    return cached
  }
  
  // Process and cache result
  const content = await processURL(url)
  await setCache(cacheKey, content, 3600) // 1 hour TTL
  
  setHeader(event, 'X-Cache', 'MISS')
  return content
})
```

## Migration Path

### Phase 1: Basic Integration
1. Add WASM build to deployment pipeline
2. Create basic `/api/reader/{url}` endpoint
3. Implement input validation and error handling

### Phase 2: Performance & Monitoring
1. Add metrics integration
2. Implement caching strategy
3. Add health checks and monitoring

### Phase 3: Production Optimization
1. Optimize WASM module size
2. Implement advanced rate limiting
3. Add comprehensive logging and alerting

## Conclusion

The Go Reader WASM integration fits naturally into the existing next-dave-io architecture. The Nuxt.js framework's built-in WASM support, combined with the established API patterns and metrics system, provides a solid foundation for a production-ready implementation.

The recommended approach is Option 1 (native API integration) as it maintains consistency with the existing API structure while leveraging all existing infrastructure components like authentication, metrics, and error handling.