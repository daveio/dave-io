# Code Review Recommendations

<!-- trunk-ignore-all(trunk-toolbox/todo) -->

## Executive Summary

This Nuxt 4 project demonstrates solid modern web development practices with Cloudflare Workers deployment, TypeScript, and proper security configurations. However, there are opportunities to improve performance, remove unused dependencies, and better leverage Nuxt 4's capabilities.

## Critical Issues (Priority 1)

### 1. Remove Unused Pinia Store

**Issue**: `@pinia/nuxt` is installed but no stores are implemented.

```bash
bun remove @pinia/nuxt
```

Remove from `nuxt.config.ts` modules array.

### 2. Fix Redundant Color Mode Configuration

**Issue**: Color mode is set both in config and runtime.

```diff
# app/app.vue
- const colorMode = useColorMode()
- if (import.meta.client) {
-   colorMode.preference = "dark"
- }
```

### 3. Remove Empty Lifecycle Hooks

**Issue**: Empty `onMounted` in `app/pages/index.vue:223-225`

```diff
- onMounted(() => {
-   // Page mounted
- })
```

## Performance Optimizations (Priority 2)

### 4. Optimize Font Loading

**Issue**: Three font families loaded, only one used.

```typescript
// nuxt.config.ts
fonts: {
  families: [
    { name: "Victor Mono", provider: "bunny" },
    // Remove unused: Sixtyfour Convergence, Sono
  ],
}
```

### 5. Add Route Rules for Static Pages

**Issue**: No ISR/prerendering configured.

```typescript
// nuxt.config.ts
nitro: {
  routeRules: {
    '/': { prerender: true },
    '/gender': { isr: 3600 },
    '/api': { prerender: true },
    '/todo': { ssr: false }, // Client-only interactive page
    // Keep existing API rules
  }
}
```

### 6. Implement Proper Data Fetching Keys

**Issue**: No explicit keys for `useFetch` calls.

```typescript
// Example fix:
const { data } = await useFetch("/api/data", {
  key: "unique-data-key",
  getCachedData(key) {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  }
})
```

## Code Quality Improvements (Priority 3)

### 7. Standardize API Response Patterns

**Issue**: Custom response wrapper instead of H3 utilities.
**Recommendation**: Use standard H3 response utilities:

```typescript
// Instead of custom ok/error functions
export default defineEventHandler(async (event) => {
  try {
    return { data: result }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})
```

### 8. Optimize Tailwind CSS Classes

**Issue**: Mix of Tailwind v4 and custom classes.
**Recommendation**: Use Tailwind utilities directly:

```diff
- .font-header { font-family: "Sixtyfour Convergence", sans-serif; }
+ Use: font-['Sixtyfour_Convergence'] directly in templates
```

### 9. Add Error Boundaries

**Issue**: No error handling UI.

```vue
<!-- app/error.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-red mb-4">{{ error.statusCode }}</h1>
      <p class="text-subtext1">{{ error.statusMessage }}</p>
      <NuxtLink to="/" class="mt-4 inline-block text-blue hover:text-sapphire"> Return Home </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps(["error"])
</script>
```

## Module Audit (Priority 4)

### 10. Consider Removing Unused Modules

Review necessity of:

- `@nuxt/test-utils` (in dependencies, should be devDependencies)
- `magic-regexp/nuxt` (check usage)
- `@formkit/auto-animate` (minimal usage detected)

```bash
# Move to devDependencies
bun remove @nuxt/test-utils
bun add -d @nuxt/test-utils
```

## Security Enhancements

### 11. Add Rate Limiting

```typescript
// server/middleware/rate-limit.ts
export default defineEventHandler(async (event) => {
  if (!event.node.req.url?.startsWith("/api/")) return

  const ip = getClientIP(event)
  const key = `rate-limit:${ip}`
  const env = getEnv(event)

  const count = await env.KV.get(key)
  if (count && parseInt(count) > 100) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests"
    })
  }

  await env.KV.put(key, String(parseInt(count || "0") + 1), {
    expirationTtl: 3600
  })
})
```

## Deployment Optimizations

### 12. Configure Build Optimizations

```typescript
// nuxt.config.ts
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'ui-vendor': ['@nuxt/icon', '@nuxt/image']
        }
      }
    }
  }
}
```

### 13. Enable Payload Extraction

```typescript
// nuxt.config.ts
experimental: {
  payloadExtraction: false, // Set to true if using universal rendering
}
```

## Testing Recommendations

### 14. Add Basic Tests

```typescript
// tests/api.test.ts
import { describe, it, expect } from "vitest"
import { $fetch } from "@nuxt/test-utils"

describe("API", () => {
  it("responds to ping", async () => {
    const { message } = await $fetch("/api/ping")
    expect(message).toBe("pong!")
  })
})
```

## Performance Metrics to Monitor

After implementing these changes, monitor:

- **Bundle Size**: Target < 200KB for initial JS
- **LCP**: Target < 2.5s
- **FID**: Target < 100ms
- **CLS**: Target < 0.1
- **Cloudflare Analytics**: Watch for edge cache hit rates

## Implementation Order

1. **Week 1**: Critical issues (1-3)
2. **Week 2**: Performance optimizations (4-6)
3. **Week 3**: Code quality (7-10)
4. **Week 4**: Module audit and security (11-14)

## Expected Impact

- **Performance**: 20-30% faster initial load
- **Bundle Size**: 15-25% reduction
- **Maintainability**: Cleaner, more idiomatic code
- **Security**: Better protection against common attacks

## Summary

The codebase is well-structured for a Nuxt 4 application. These recommendations focus on:

- Removing unused code and dependencies
- Leveraging Nuxt 4's performance features
- Improving code consistency
- Enhancing security posture

Most changes are non-breaking and can be implemented incrementally.
