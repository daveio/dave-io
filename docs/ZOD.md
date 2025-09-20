# Schema Validation with Zod in Nuxt/H3

<!-- trunk-ignore-all(trunk-toolbox/todo) -->

This guide teaches you how to implement robust schema validation in a Nuxt application using Zod and H3's built-in validation utilities. We'll build up from simple concepts to complex patterns, using real examples from this codebase.

## Table of Contents

1. [Why Schema Validation?](#why-schema-validation)
2. [Core Concepts](#core-concepts)
3. [Basic Validation](#basic-validation)
4. [H3 Validation Utilities](#h3-validation-utilities)
5. [Sharing Schemas Between Client and Server](#sharing-schemas-between-client-and-server)
6. [Advanced Patterns](#advanced-patterns)
7. [Error Handling](#error-handling)
8. [Real-World Examples](#real-world-examples)

## Why Schema Validation?

**The Golden Rule**: Never trust user input. Ever.

In web applications, data flows from untrusted sources (browsers, API clients, webhooks) to your server. Without validation:

- Invalid data crashes your application
- Malformed input corrupts your database
- Security vulnerabilities emerge
- TypeScript types lie at runtime

Zod solves this by providing:

- **Runtime validation** that matches TypeScript types
- **Single source of truth** for data shapes
- **Automatic type inference** from schemas
- **Detailed error messages** for debugging

## Core Concepts

### 1. Schema Definition

A schema describes the shape and constraints of your data:

```typescript
import { z } from "zod"

// Simple schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number()
})

// This schema validates objects like:
// { name: "Alice", age: 30 } ✅
// { name: "Bob", age: "30" } ❌ (age is string, not number)
```

### 2. Parsing vs SafeParsing

Zod offers two ways to validate data:

```typescript
// parse() - throws ZodError on failure
try {
  const user = UserSchema.parse(data)
  // user is typed and validated
} catch (error) {
  // Handle validation error
}

// safeParse() - returns a result object
const result = UserSchema.safeParse(data)
if (result.success) {
  // result.data is typed and validated
} else {
  // result.error contains validation errors
}
```

### 3. Type Inference

Extract TypeScript types from your schemas:

```typescript
// Define schema once
const UserSchema = z.object({
  name: z.string(),
  age: z.number()
})

// Infer the TypeScript type
type User = z.infer<typeof UserSchema>
// Equivalent to: { name: string; age: number }
```

## Basic Validation

Let's start with a simple TODO submission form. Here's how validation evolves from unsafe to bulletproof:

### Step 1: No Validation (Dangerous!)

```typescript
// ❌ BAD: No validation
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // body could be anything: null, string, malformed object

  // This might crash!
  await saveTodo(body.title, body.description)
})
```

### Step 2: Manual Validation (Tedious)

```typescript
// 🤔 BETTER: Manual checks
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.title || typeof body.title !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Invalid title" })
  }

  if (!body?.description || typeof body.description !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Invalid description" })
  }

  // Repetitive and error-prone
})
```

### Step 3: Zod Validation (Clean & Safe)

```typescript
// ✅ GOOD: Schema validation
import { z } from "zod"

const TodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000)
})

export default defineEventHandler(async (event) => {
  const result = TodoSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: result.error.flatten()
    })
  }

  // result.data is fully typed and validated
  await saveTodo(result.data.title, result.data.description)
})
```

## H3 Validation Utilities

H3 provides built-in utilities that integrate seamlessly with Zod. These handle the parsing and error throwing for you:

### readValidatedBody

Validates request body data:

```typescript
import { readValidatedBody } from "h3"
import { z } from "zod"

const CreateTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
  priority: z.enum(["low", "medium", "high"]).optional()
})

export default defineEventHandler(async (event) => {
  // Automatically throws 400 with validation errors if invalid
  const todo = await readValidatedBody(event, CreateTodoSchema.parse)

  // todo is typed as:
  // { title: string; description: string; priority?: 'low' | 'medium' | 'high' }

  return await createTodo(todo)
})
```

### getValidatedQuery

Validates URL query parameters:

```typescript
import { getValidatedQuery } from "h3"
import { z } from "zod"

// Transform string numbers to actual numbers
const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  sort: z.enum(["asc", "desc"]).optional()
})

export default defineEventHandler(async (event) => {
  // GET /api/todos?page=2&limit=20&sort=desc
  const query = await getValidatedQuery(event, PaginationSchema.parse)

  // query is typed and transformed:
  // { page: number; limit: number; sort?: 'asc' | 'desc' }

  return await getTodos(query)
})
```

### getValidatedRouterParams

Validates route parameters:

```typescript
import { getValidatedRouterParams } from "h3"
import { z } from "zod"

const RouteParamsSchema = z.object({
  id: z.string().uuid("Invalid todo ID")
})

// Route: /api/todos/:id
export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, RouteParamsSchema.parse)

  // params.id is guaranteed to be a valid UUID
  return await getTodoById(params.id)
})
```

## Sharing Schemas Between Client and Server

One of Zod's superpowers is sharing validation logic between frontend and backend. This ensures consistency and prevents drift.

### Step 1: Define Shared Schemas

Create `utils/validators.ts`:

```typescript
import { z } from "zod"

// Reusable field validators
export const emailSchema = z.string().email("Invalid email address")
export const urlSchema = z.string().url("Invalid URL")
export const uuidSchema = z.string().uuid("Invalid UUID")

// Domain validators
export const domainSchema = z
  .string()
  .min(1, "Domain is required")
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, "Invalid domain format")

// Feature-specific schemas
export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
  type: z.enum(["bug", "feature", "task"]).default("task"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee: z
    .object({
      name: z.string().optional(),
      email: emailSchema.optional()
    })
    .optional()
})

// Infer types from schemas
export type CreateTodoInput = z.infer<typeof createTodoSchema>
```

### Step 2: Use on Server

```typescript
// server/api/todos.post.ts
import { readValidatedBody } from "h3"
import { createTodoSchema } from "~/utils/validators"

export default defineEventHandler(async (event) => {
  const todo = await readValidatedBody(event, createTodoSchema.parse)

  // todo is typed as CreateTodoInput
  return await saveTodo(todo)
})
```

### Step 3: Use on Client

```vue
<!-- pages/todos/new.vue -->
<script setup lang="ts">
import { createTodoSchema, type CreateTodoInput } from "~/utils/validators"

const form = reactive<CreateTodoInput>({
  title: "",
  description: "",
  type: "task"
})

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  // Client-side validation
  const result = createTodoSchema.safeParse(form)

  if (!result.success) {
    // Display errors to user
    errors.value = result.error.flatten().fieldErrors
    return
  }

  // Send validated data to server
  await $fetch("/api/todos", {
    method: "POST",
    body: result.data
  })
}
</script>
```

## Advanced Patterns

### 1. Transformations

Transform data during validation:

```typescript
// Convert string to number
const PortSchema = z.string().transform((str) => parseInt(str, 10))

// Parse JSON string
const JsonSchema = z.string().transform((str) => JSON.parse(str))

// Normalize email
const EmailSchema = z
  .string()
  .email()
  .transform((email) => email.toLowerCase().trim())

// Complex transformation with validation
const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
  .transform((str) => new Date(str))
  .refine((date) => date > new Date("2000-01-01"), {
    message: "Date must be after 2000"
  })
```

### 2. Refinements

Add custom validation logic:

```typescript
const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain uppercase letter"
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain number"
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: "Password must contain special character"
  })

// Cross-field validation
const RegisterSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"] // Error appears on confirmPassword field
  })
```

### 3. Conditional Schemas

Schema that changes based on data:

```typescript
const NotificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    recipient: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string().regex(/^\+\d{10,}$/),
    message: z.string().max(160),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string(),
    title: z.string(),
    body: z.string(),
  }),
])

// Usage
const emailNotif = { type: 'email', recipient: 'user@example.com', ... }
const smsNotif = { type: 'sms', phoneNumber: '+1234567890', ... }
```

### 4. Async Validation

Validate against external sources:

```typescript
const UsernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .refine(
    async (username) => {
      // Check if username is available in database
      const exists = await checkUsernameExists(username)
      return !exists
    },
    {
      message: "Username is already taken"
    }
  )

// Must use parseAsync for async refinements
const result = await UsernameSchema.parseAsync("cooluser123")
```

## Error Handling

### Creating a Validation Error Handler

Create `server/utils/validation.ts`:

```typescript
import type { H3Event } from "h3"
import { ZodError } from "zod"

export function handleValidationError(event: H3Event, error: unknown): never {
  if (error instanceof ZodError) {
    // Format Zod errors for client
    const formatted = error.flatten()

    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: {
        fieldErrors: formatted.fieldErrors,
        formErrors: formatted.formErrors
      }
    })
  }

  // Re-throw non-Zod errors
  throw error
}

// Wrapper for validated handlers
export function defineValidatedEventHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (event: H3Event, data: T) => Promise<any>
) {
  return defineEventHandler(async (event) => {
    try {
      const body = await readBody(event)
      const validated = await schema.parseAsync(body)
      return await handler(event, validated)
    } catch (error) {
      handleValidationError(event, error)
    }
  })
}
```

### Using the Error Handler

```typescript
import { defineValidatedEventHandler } from "~/server/utils/validation"
import { createTodoSchema } from "~/utils/validators"

export default defineValidatedEventHandler(createTodoSchema, async (event, todo) => {
  // todo is validated and typed
  return await saveTodo(todo)
})
```

### Client-Side Error Display

```vue
<script setup lang="ts">
const errors = ref<Record<string, string[]>>({})

async function submitForm() {
  try {
    await $fetch("/api/todos", {
      method: "POST",
      body: formData
    })
  } catch (error) {
    if (error.data?.fieldErrors) {
      errors.value = error.data.fieldErrors
    }
  }
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <input v-model="formData.title" />
    <span v-if="errors.title" class="error">
      {{ errors.title[0] }}
    </span>
  </form>
</template>
```

## Real-World Examples

### Example 1: Ctrld Domain Validation

This example shows how to validate a domain unblocking request with authentication:

```typescript
// utils/validators.ts
import { z } from "zod"

// Domain validation with DNS-safe rules
export const domainSchema = z
  .string()
  .min(1, "Domain is required")
  .max(253, "Domain too long")
  .toLowerCase()
  .trim()
  .regex(/^([a-z0-9]([-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,}$/, "Invalid domain format")
  .refine((domain) => !domain.startsWith("-"), {
    message: "Domain cannot start with hyphen"
  })
  .refine((domain) => !domain.endsWith("-"), {
    message: "Domain cannot end with hyphen"
  })

export const ctrldProfileSchema = z.enum(["main", "permissive", "parents"])

export const ctrldUnblockSchema = z.object({
  domain: domainSchema,
  auth: z.string().min(1, "Auth token required"),
  profile: ctrldProfileSchema,
  permanent: z.boolean().default(false)
})

export type CtrldUnblockRequest = z.infer<typeof ctrldUnblockSchema>
```

```typescript
// server/api/ctrld/unblock.post.ts
import { readValidatedBody } from "h3"
import { ctrldUnblockSchema } from "~/utils/validators"

export default defineEventHandler(async (event) => {
  // Validate and parse in one step
  const request = await readValidatedBody(event, ctrldUnblockSchema.parse)

  // Verify auth token
  if (request.auth !== useRuntimeConfig(event).ctrldAuthKey) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid authentication"
    })
  }

  // Map profile to ID
  const profileIds = {
    main: "751219lhr3b5",
    permissive: "753829amsizb",
    parents: "753215amsnk2"
  }

  const profileId = profileIds[request.profile]

  // Execute unblock
  return await unblockDomain({
    domain: request.domain,
    profileId,
    permanent: request.permanent
  })
})
```

### Example 2: Email Verification with Turnstile

Validate a Turnstile token for email revelation:

```typescript
// utils/validators.ts
export const turnstileTokenSchema = z
  .string()
  .min(1, "Token is required")
  .regex(/^[\w-]+$/, "Invalid token format")

export const emailVerificationSchema = z.object({
  token: turnstileTokenSchema
})
```

```typescript
// server/api/util/email.post.ts
import { readValidatedBody } from "h3"
import { emailVerificationSchema } from "~/utils/validators"

export default defineEventHandler(async (event) => {
  const { token } = await readValidatedBody(event, emailVerificationSchema.parse)

  // Verify with Turnstile
  const result = await verifyTurnstileToken(token)

  if (!result.success) {
    throw createError({
      statusCode: 403,
      statusMessage: "Token validation failed"
    })
  }

  // Return protected email
  return {
    email: "dave@dave.io"
  }
})
```

### Example 3: Complex TODO with Nested Objects

A more complex example with nested objects and arrays:

```typescript
// utils/validators.ts
export const attachmentSchema = z.object({
  name: z.string(),
  url: urlSchema,
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
  type: z.enum(["image", "document", "video"])
})

export const createAdvancedTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),

  // Nested object
  metadata: z.object({
    category: z.string(),
    tags: z.array(z.string()).max(10),
    estimatedHours: z.number().positive().optional()
  }),

  // Array of objects
  attachments: z.array(attachmentSchema).max(5).optional(),

  // Date handling
  dueDate: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .refine((date) => date > new Date(), {
      message: "Due date must be in the future"
    })
    .optional(),

  // Conditional field
  recurrence: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly"]),
      interval: z.number().positive().default(1),
      endDate: z.string().datetime().optional()
    })
    .optional()
})
```

## Best Practices

### 1. Organize Schemas Hierarchically

```typescript
// utils/validators/common.ts
export const emailSchema = z.string().email()
export const uuidSchema = z.string().uuid()
export const urlSchema = z.string().url()

// utils/validators/todo.ts
import { emailSchema } from "./common"
export const todoSchema = z.object({
  assigneeEmail: emailSchema.optional()
  // ...
})

// utils/validators/index.ts
export * from "./common"
export * from "./todo"
```

### 2. Use Branded Types for Extra Safety

```typescript
// Create branded types for IDs
const TodoId = z.string().uuid().brand<"TodoId">()
const UserId = z.string().uuid().brand<"UserId">()

// Now these are different types
type TodoId = z.infer<typeof TodoId>
type UserId = z.infer<typeof UserId>

// Prevents mixing IDs
function getTodo(id: TodoId) {
  /* ... */
}
const userId: UserId = "..."
getTodo(userId) // ❌ Type error!
```

### 3. Create Schema Factories

```typescript
// For similar schemas with variations
function createPaginationSchema(defaults = {}) {
  return z.object({
    page: z
      .number()
      .positive()
      .default(defaults.page ?? 1),
    limit: z
      .number()
      .positive()
      .max(100)
      .default(defaults.limit ?? 10),
    sort: z.enum(["asc", "desc"]).default(defaults.sort ?? "asc")
  })
}

// Use in different contexts
const todoListSchema = createPaginationSchema({ limit: 20 })
const userListSchema = createPaginationSchema({ limit: 50 })
```

### 4. Document Complex Validations

```typescript
const phoneNumberSchema = z
  .string()
  // E.164 format: +[country][area][number]
  // Examples: +14155552671, +442071838750
  .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +14155552671)")
  .describe("International phone number in E.164 format")
```

### 5. Performance Considerations

```typescript
// Cache expensive schemas
const expensiveSchema = z.lazy(() => {
  // Only create once
  return z.object({
    // Complex nested structure
  })
})

// Use preprocess for transformations
const efficientSchema = z.preprocess((val) => {
  // Transform before validation
  if (typeof val === "string") {
    return val.trim().toLowerCase()
  }
  return val
}, z.string().email())
```

## Debugging Tips

### 1. Log Validation Errors

```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.log("Validation failed:", JSON.stringify(result.error.format(), null, 2))
}
```

### 2. Use Descriptive Error Messages

```typescript
const schema = z.object({
  age: z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age must be a number"
    })
    .min(18, { message: "Must be 18 or older" })
    .max(120, { message: "Invalid age" })
})
```

### 3. Test Your Schemas

```typescript
// In your tests
import { expect, test } from "vitest"
import { todoSchema } from "~/utils/validators"

test("validates valid todo", () => {
  const result = todoSchema.safeParse({
    title: "Test",
    description: "Description"
  })
  expect(result.success).toBe(true)
})

test("rejects invalid todo", () => {
  const result = todoSchema.safeParse({
    title: "", // Empty title
    description: "Description"
  })
  expect(result.success).toBe(false)
  expect(result.error.issues[0].path).toEqual(["title"])
})
```

## Conclusion

Schema validation with Zod and H3 provides:

1. **Type Safety**: Runtime validation matches compile-time types
2. **Single Source of Truth**: One schema defines validation everywhere
3. **Better UX**: Clear error messages for users
4. **Security**: Sanitized input before processing
5. **Developer Experience**: Less boilerplate, more confidence

Start with simple schemas and gradually add complexity as needed. The investment in proper validation pays dividends in reliability, security, and maintainability.

Remember: **Validate early, validate often, and never trust user input!**
