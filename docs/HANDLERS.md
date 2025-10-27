# API Handler Patterns in Nuxt 4: A Learning Guide

## Overview

This guide explores the proper patterns for handling API responses and errors in Nuxt 4, specifically addressing why the current `ok()` and `error()` helper pattern is problematic and how to implement the recommended approaches.

## The Problem with the Current Pattern

### Current Implementation Analysis

Looking at the current codebase, we're using custom `ok()` and `error()` helper functions:

```typescript
// Current pattern in server/utils/response.ts
export function ok(event: H3Event, data: unknown, code?: number) {
  logResponse(event, data, code || 200)
  if (code) {
    return wrapResponse(event, data, undefined, code)
  } else {
    return wrapResponse(event, data, undefined)
  }
}

export function error(event: H3Event, data: unknown, error: string, code?: number) {
  logResponse(event, data, code || 500, error)
  if (code) {
    return wrapResponse(event, data, error, code)
  } else {
    return wrapResponse(event, data, error)
  }
}

// Usage in API routes
export default defineEventHandler(async (event) => {
  return ok(event, { message: "pong!" })
})
```

### Why This Pattern Is Problematic

1. **Bypasses Nuxt's Built-in Error Handling**: Nuxt 4 and H3 have sophisticated error handling mechanisms that this pattern circumvents.

2. **Unnecessary Complexity**: The `wrapResponse()` function adds extra structure that isn't needed or expected by clients.

3. **Manual Status Code Management**: Using `setResponseStatus()` manually when H3 can handle this automatically.

4. **Inconsistent with Framework Conventions**: This pattern doesn't follow Nuxt 4's recommended practices.

5. **No Integration with Client-Side Error Handling**: Nuxt's client-side error utilities expect errors to be thrown using `createError()`.

6. **Verbose Response Structure**: The wrapped response includes unnecessary metadata like request details that bloat the response.

## The Correct Nuxt 4 Patterns

### 1. Success Responses: Return Data Directly

H3 (Nuxt's server engine) automatically handles JSON serialization and sets appropriate status codes.

```typescript
// ✅ CORRECT: Simple data return
export default defineEventHandler(async (event) => {
  // H3 automatically:
  // - Converts objects/arrays to JSON
  // - Sets Content-Type: application/json
  // - Sets status code to 200
  return {
    message: "pong!",
    timestamp: new Date().toISOString()
  }
})

// ✅ CORRECT: Return different data types
export default defineEventHandler(async (event) => {
  // Can return strings, objects, arrays, promises, etc.
  return "Hello World!" // Content-Type: text/plain
})

// ✅ CORRECT: Async operations
export default defineEventHandler(async (event) => {
  const data = await fetchSomeData()
  return data // H3 awaits promises automatically
})
```

### 2. Error Responses: Use createError() and Throw

For error conditions, use Nuxt's `createError()` utility and throw the error.

```typescript
// ✅ CORRECT: Throw errors with createError()
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title || !body?.description) {
    throw createError({
      statusCode: 422,
      statusMessage: "Unprocessable Entity",
      message: "Missing required fields: title and description"
    })
  }

  return { received: true, message: "Todo created successfully" }
})

// ✅ CORRECT: Different error scenarios
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "ID parameter is required"
    })
  }

  const resource = await findResource(id)
  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Resource not found"
    })
  }

  return resource
})
```

### 3. Custom Status Codes for Success

When you need non-200 status codes for successful operations:

```typescript
// ✅ CORRECT: Custom success status codes
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Create the resource
  const newResource = await createResource(body)

  // Set 201 Created status
  setResponseStatus(event, 201)

  return {
    id: newResource.id,
    message: "Resource created successfully"
  }
})

// ✅ CORRECT: Accepted status (202)
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Queue the task for later processing
  await queueTask(body)

  setResponseStatus(event, 202)

  return {
    message: "Task queued for processing",
    queueId: generateQueueId()
  }
})
```

## Understanding createError()

### createError() Parameters

```typescript
createError({
  statusCode: number, // HTTP status code (required for errors)
  statusMessage: string, // HTTP status message (recommended)
  message: string, // Detailed error message
  data: any, // Additional data to send to client
  cause: Error, // Original error that caused this
  fatal: boolean // Whether to trigger full-screen error page
})
```

### Error Handling Best Practices

```typescript
// ✅ CORRECT: Comprehensive error handling
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validation
    if (!body.email || !isValidEmail(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Valid email address is required",
        data: { field: "email" } // Additional context
      })
    }

    // Business logic
    const result = await processEmail(body.email)

    return { success: true, result }
  } catch (error) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error("Unexpected error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "An unexpected error occurred"
    })
  }
})
```

## Migration Strategy

### Converting Current Handlers

Here's how to convert the existing handlers:

```typescript
// ❌ BEFORE: Using ok() helper
export default defineEventHandler(async (event) => {
  return ok(event, {
    message: "pong!"
  })
})

// ✅ AFTER: Direct return
export default defineEventHandler(async (event) => {
  return {
    message: "pong!"
  }
})

// ❌ BEFORE: Using error() helper
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title) {
    return error(event, {}, "Missing required field: title", 422)
  }

  return ok(event, { received: true }, 202)
})

// ✅ AFTER: Using createError()
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title) {
    throw createError({
      statusCode: 422,
      statusMessage: "Unprocessable Entity",
      message: "Missing required field: title"
    })
  }

  setResponseStatus(event, 202)
  return { received: true }
})
```

## Advanced Patterns

### 1. Conditional Error Handling

```typescript
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Authentication required"
    })
  }

  if (!user.hasPermission("read:data")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "Insufficient permissions"
    })
  }

  return await getUserData(user.id)
})
```

### 2. Nested Route Handlers

```typescript
// server/api/users/[id]/posts.get.ts
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id")

  if (!userId || !isValidId(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Valid user ID is required"
    })
  }

  const user = await findUser(userId)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "User not found"
    })
  }

  const posts = await getUserPosts(userId)

  return {
    user: { id: user.id, name: user.name },
    posts,
    total: posts.length
  }
})
```

### 3. Content-Type Handling

```typescript
// H3 automatically handles different content types
export default defineEventHandler(async (event) => {
  const format = getQuery(event).format

  const data = await getData()

  if (format === "xml") {
    // Set custom content type
    setResponseHeader(event, "content-type", "application/xml")
    return generateXML(data)
  }

  // Default to JSON (automatic)
  return data
})
```

## Benefits of the Correct Approach

### 1. **Cleaner Code**

- Less boilerplate
- More readable handlers
- Focus on business logic

### 2. **Better Error Handling**

- Integrates with Nuxt's error system
- Proper error propagation to client
- Support for client-side error handling

### 3. **Automatic Features**

- JSON serialization
- Content-Type headers
- Status code management
- Promise handling

### 4. **Framework Consistency**

- Follows Nuxt 4 conventions
- Works with client-side utilities
- Consistent with documentation

### 5. **Better Developer Experience**

- TypeScript support
- IDE autocompletion
- Predictable behavior

## Testing the New Patterns

### Client-Side Usage

```vue
<script setup>
// ✅ Clean client-side handling
const { data, error } = await useFetch("/api/ping")

if (error.value) {
  // Nuxt automatically handles thrown errors
  console.error("API Error:", error.value.statusMessage)
  console.error("Details:", error.value.message)
}
</script>
```

### Testing with cURL

```bash
# Success response (clean JSON)
curl -X GET http://localhost:3000/api/ping
# Returns: {"message":"pong!","timestamp":"..."}

# Error response (proper error structure)
curl -X POST http://localhost:3000/api/todo \
  -H "Content-Type: application/json" \
  -d '{}'
# Returns: {"statusCode":422,"statusMessage":"Unprocessable Entity","message":"Missing required fields"}
```

## Conclusion

The current `ok()` and `error()` pattern, while functional, goes against Nuxt 4's design principles and creates unnecessary complexity. By adopting the recommended patterns:

1. **Return data directly** for successful responses
2. **Use `createError()` and throw** for error conditions
3. **Let H3 handle** JSON serialization and status codes
4. **Leverage Nuxt's error handling** for better integration

This approach results in cleaner, more maintainable code that follows framework conventions and provides better developer and user experiences.

The migration can be done incrementally, handler by handler, allowing you to learn and apply these patterns gradually while maintaining a working application.
