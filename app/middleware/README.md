# Access Control Middleware

A simple route middleware for controlling page access in the Nuxt 4 application.

## Overview

The `access-control.ts` middleware provides a foundation for implementing page-level access control. It currently uses a simple `if { true }` check but is designed to be easily expanded for real-world authentication and authorization logic.

## Usage

### Apply to Specific Pages

Add the middleware to any page by using `definePageMeta`:

```vue
<script setup lang="ts">
// Apply access control to this page
definePageMeta({
  middleware: "access-control"
})
</script>
```

### Apply Globally

To apply the middleware to all pages, rename the file to `access-control.global.ts`:

```bash
mv middleware/access-control.ts middleware/access-control.global.ts
```

## Current Behavior

- ✅ **Allows all access** - Currently returns `true` for all requests
- 📝 **Logs access** - Logs successful page access to console
- 🚫 **Error handling** - Prepared to throw 403 errors when access is denied
- 🔍 **Route tracking** - Tracks which routes are being accessed

## Expansion Examples

### 1. Authentication Check

```typescript
export default defineNuxtRouteMiddleware((to, _from) => {
  // Check if user is authenticated
  const { $auth } = useNuxtApp()
  const allowAccess = $auth.isAuthenticated()

  if (!allowAccess) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication Required"
    })
  }
})
```

### 2. Role-based Access

```typescript
export default defineNuxtRouteMiddleware((to, _from) => {
  // Check user role
  const user = useAuthUser()
  const requiredRole = to.meta.requiresRole || "user"
  const allowAccess = user.value?.role === requiredRole

  if (!allowAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "Insufficient Permissions"
    })
  }
})
```

### 3. JWT Token Validation

```typescript
export default defineNuxtRouteMiddleware((to, _from) => {
  // Validate JWT token
  const token = useCookie("auth-token")
  const allowAccess = token.value && validateJWT(token.value)

  if (!allowAccess) {
    return navigateTo("/login")
  }
})
```

### 4. Feature Flags

```typescript
export default defineNuxtRouteMiddleware((to, _from) => {
  // Check feature flags
  const { $featureFlags } = useNuxtApp()
  const featureEnabled = $featureFlags.isEnabled("protected-pages")
  const allowAccess = featureEnabled

  if (!allowAccess) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page Not Found"
    })
  }
})
```

### 5. Time-based Access

```typescript
export default defineNuxtRouteMiddleware((to, _from) => {
  // Check time-based access
  const now = new Date()
  const businessHours = now.getHours() >= 9 && now.getHours() <= 17
  const allowAccess = businessHours

  if (!allowAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "Outside Business Hours"
    })
  }
})
```

## Integration with Project Patterns

This middleware follows the project's established patterns:

- **Error Handling**: Uses `createError()` for consistent error responses
- **Logging**: Uses `console.log()` and `console.error()` for debugging
- **TypeScript**: Fully typed with proper route parameter types
- **Testing**: Includes comprehensive unit tests
- **Documentation**: Full JSDoc documentation

## Files

- `middleware/access-control.ts` - Main middleware implementation
- `test/access-control-middleware.test.ts` - Unit tests
- `app/pages/example-protected.vue` - Usage example
- `middleware/README.md` - This documentation

## Testing

Run the middleware tests:

```bash
bun run test test/access-control-middleware.test.ts
```

## Security Considerations

When expanding this middleware:

1. **Never log sensitive data** (tokens, passwords, etc.)
2. **Use secure error messages** - Don't reveal system internals
3. **Implement rate limiting** for authentication attempts
4. **Validate all inputs** before processing
5. **Use HTTPS** for production deployments

## Next Steps

1. Replace the `true` condition with real access control logic
2. Add authentication service integration
3. Implement role-based permissions
4. Add session management
5. Consider caching for performance

For more information about Nuxt middleware, see the [official documentation](https://nuxt.com/docs/guide/directory-structure/middleware).
