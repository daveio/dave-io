# Pandorica Implementation Guide

> [!NOTE]
> This guide outlines how to implement Supabase Auth with email OTP for Nuxt 4 on Cloudflare Workers.
>
> It will protect the `/pandorica` frontend route in the `dave.io` site.
>
> **Updated for Opus 4.1**: Now uses `@supabase/ssr` for proper cookie-based authentication,
> correct Cloudflare environment variable access patterns, and Nuxt 4 best practices.

## Overview

The implementation will:

- Use Supabase Auth with email OTP (One-Time Password) for authentication
- Protect only the `/pandorica` route, leaving all other routes unaffected
- Work seamlessly with the existing Cloudflare Workers + Nuxt 4 setup
- Not interfere with the existing JWT-based API authentication system

## Architecture Considerations

### Current State

- **Framework**: Nuxt 4 with Cloudflare Workers runtime
- **Existing Auth**: Custom JWT implementation for API endpoints (server/utils/auth.ts)
- **Middleware**: Non-functional `protection.ts` middleware (hardcoded to deny access)
- **Dependencies**: `@supabase/supabase-js` already installed

### Key Challenges

1. **SSR Compatibility**: Cloudflare Workers runtime has limited Node.js API support
2. **Cookie Management**: Need server-side cookie handling for session management using `@supabase/ssr`
3. **Middleware Naming**: 'auth' middleware name is reserved by Supabase/Nuxt integrations
4. **Environment Variables**: Must use `event.context.cloudflare.env` in Workers, not `process.env`

## Implementation Steps

### 1. Environment Configuration

#### Using Cloudflare Secrets Store

The Supabase credentials are stored in Cloudflare Secrets Store for enhanced security. Secrets Store provides account-level secrets that can be shared across multiple Workers and environments.

**Important**: In Cloudflare Workers with Nuxt 4, environment variables and secrets are NOT available via `process.env`. Instead, they are accessible through the Cloudflare event context:

- **Server-side**: Access via `event.context.cloudflare.env` in your server handlers
- **Client-side**: Public values can be hardcoded or fetched from a config endpoint
- **Cookies**: Use the `useCookie` composable for SSR-friendly cookie management

```bash
# Install the SSR package for cookie-based auth
npm install @supabase/ssr

# Optional: Install nitro-cloudflare-dev for better development experience
npm install --save-dev nitro-cloudflare-dev
```

#### Local Development Configuration

```bash
# Local development (.dev.vars file)
SUPABASE_URL=https://your-project.supabase.co  # Non-secret
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key  # Non-secret (designed to be public)
SUPABASE_SECRET_KEY=sb_secret_your-key  # Secret - server-side only

# Note: The publishable key is meant to be exposed in client-side code.
# Only the secret key needs to be kept secure.
```

#### Sync secrets to Cloudflare Secrets Store

```bash
# Only the secret key needs to be synced
# Mark it with "# secret" comment in your .env file
SUPABASE_SECRET_KEY=sb_secret_your-key # secret

# Sync your secrets to Cloudflare Secrets Store
bun run secrets sync

# Or manually create/update the secret
wrangler secrets-store secret create <STORE_ID> --name SUPABASE_SECRET_KEY --scopes workers --remote
```

#### Configure bindings in `wrangler.jsonc`

```jsonc
{
  // ... existing config
  "vars": {
    // Non-secret values - directly accessible
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_your-key"
  },
  "secrets_store_secrets": [
    {
      "binding": "SUPABASE_SECRET_KEY",
      "secret_name": "SUPABASE_SECRET_KEY",
      "store_id": "c38e38cf995f4db08a71c9b616169d33"
    }
  ]
}
```

#### Note on Nuxt Configuration

Since Cloudflare Workers don't populate `process.env` with bindings, we won't use Nuxt's `runtimeConfig`. Instead, we'll access the values directly from the Cloudflare context in our code.

### 2. Create Supabase Client Utilities

#### `app/utils/supabase.client.ts` - Browser client

```typescript
import { createBrowserClient as createClient } from "@supabase/ssr"
import type { Database } from "~/types/supabase"

// These values need to be provided to the client
// Option 1: Hardcode them (simplest for public values)
const SUPABASE_URL = "https://your-project.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your-key"

// Option 2: Create a public config endpoint (see below)
// const { supabaseUrl, supabasePublishableKey } = await $fetch('/api/config')

export const createBrowserClient = () => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      get(name: string) {
        const cookie = useCookie(name, {
          httpOnly: false,
          sameSite: "lax",
          secure: true
        })
        return cookie.value as string | undefined
      },
      set(name: string, value: string, options?: any) {
        const cookie = useCookie(name, {
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: options?.maxAge
        })
        cookie.value = value
      },
      remove(name: string) {
        const cookie = useCookie(name)
        cookie.value = null
      }
    }
  })
}
```

#### `server/utils/supabase.server.ts` - Server client

```typescript
import { createServerClient as createClient } from "@supabase/ssr"
import { getCookie, setCookie } from "h3"
import type { Database } from "~/types/supabase"
import type { H3Event } from "h3"

export const createServerClient = (event: H3Event) => {
  // Access Cloudflare bindings from the event context
  const env = event.context.cloudflare?.env

  if (!env?.SUPABASE_URL || !env?.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase credentials not found in environment")
  }

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    cookies: {
      get(name: string) {
        return getCookie(event, name)
      },
      set(name: string, value: string, options?: any) {
        setCookie(event, name, value, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: options?.maxAge,
          path: "/"
        })
      },
      remove(name: string) {
        setCookie(event, name, "", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 0,
          path: "/"
        })
      }
    }
  })
}
```

#### Option 2: Create a config endpoint (alternative approach)

If you prefer not to hardcode values in the client, create a public endpoint:

```typescript
// server/api/config.get.ts
export default defineEventHandler((event) => {
  const env = event.context.cloudflare?.env

  return {
    supabaseUrl: env?.SUPABASE_URL,
    supabasePublishableKey: env?.SUPABASE_PUBLISHABLE_KEY
  }
})
```

Then update the client to fetch config on initialization.

### 3. Create Auth Composables

#### `app/composables/useSupabaseAuth.ts`

```typescript
import type { User } from "@supabase/supabase-js"
import { createBrowserClient } from "~/utils/supabase.client"

export const useSupabaseAuth = () => {
  const supabase = createBrowserClient()
  const user = useState<User | null>("supabase-user", () => null)

  // Initialize user state
  onMounted(async () => {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()
    user.value = currentUser

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })

    // Cleanup on unmount
    onUnmounted(() => {
      subscription.unsubscribe()
    })
  })

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    })
    return { error }
  }

  const verifyOTP = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email"
    })
    if (data?.user) {
      user.value = data.user
    }
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      user.value = null
      await navigateTo("/")
    }
    return { error }
  }

  return {
    user: readonly(user),
    signInWithOTP,
    verifyOTP,
    signOut
  }
}
```

### 4. Update Middleware

Replace `app/middleware/protection.ts`:

```typescript
import { createServerClient } from "~/server/utils/supabase.server"

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only protect the /pandorica route
  if (to.path !== "/pandorica") {
    return
  }

  // Client-side check
  if (import.meta.client) {
    const { user } = useSupabaseAuth()

    // Wait for auth state to be initialized
    await new Promise((resolve) => {
      const unwatch = watch(
        user,
        (newUser) => {
          if (newUser !== undefined) {
            unwatch()
            resolve(true)
          }
        },
        { immediate: true }
      )
    })

    if (!user.value) {
      return navigateTo("/auth/login?redirect=/pandorica")
    }
  }

  // Server-side check
  if (import.meta.server) {
    const event = useRequestEvent()
    if (!event) return

    const supabase = createServerClient(event)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return navigateTo("/auth/login?redirect=/pandorica")
    }
  }
})
```

### 5. Create Auth Pages

#### `app/pages/auth/login.vue`

```vue
<template>
  <div class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4">
    <div class="max-w-md mx-auto w-full">
      <Interface title="Sign In to Pandorica" :use-monospace="false">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email input step -->
          <div v-if="!showOtpInput">
            <label for="email" class="block text-text text-sm font-medium mb-2"> Email Address </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-3 py-2 bg-surface0 border border-surface2 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              :disabled="loading"
              class="mt-4 w-full py-2 px-4 bg-blue text-base font-medium rounded-lg hover:bg-blue/90 disabled:opacity-50 transition-colors"
            >
              {{ loading ? "Sending..." : "Send Magic Code" }}
            </button>
          </div>

          <!-- OTP input step -->
          <div v-else>
            <p class="text-subtext0 mb-4">We've sent a 6-digit code to {{ email }}</p>
            <label for="otp" class="block text-text text-sm font-medium mb-2"> Verification Code </label>
            <input
              id="otp"
              v-model="otp"
              type="text"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              class="w-full px-3 py-2 bg-surface0 border border-surface2 rounded-lg text-text text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue"
              placeholder="000000"
            />
            <button
              type="submit"
              :disabled="loading || otp.length !== 6"
              class="mt-4 w-full py-2 px-4 bg-blue text-base font-medium rounded-lg hover:bg-blue/90 disabled:opacity-50 transition-colors"
            >
              {{ loading ? "Verifying..." : "Verify Code" }}
            </button>
            <button
              type="button"
              @click="resetForm"
              class="mt-2 w-full text-subtext0 hover:text-text transition-colors"
            >
              Use a different email
            </button>
          </div>

          <!-- Error message -->
          <div v-if="error" class="p-3 bg-red/20 border border-red rounded-lg">
            <p class="text-red text-sm">{{ error }}</p>
          </div>

          <!-- Success message -->
          <div v-if="success" class="p-3 bg-green/20 border border-green rounded-lg">
            <p class="text-green text-sm">{{ success }}</p>
          </div>
        </form>
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
import Interface from "~/app/components/layout/Interface.vue"

const route = useRoute()
const router = useRouter()
const { signInWithOTP, verifyOTP, user } = useSupabaseAuth()

const email = ref("")
const otp = ref("")
const showOtpInput = ref(false)
const loading = ref(false)
const error = ref("")
const success = ref("")

// Redirect if already authenticated
watch(
  user,
  (newUser) => {
    if (newUser) {
      const redirect = (route.query.redirect as string) || "/pandorica"
      router.push(redirect)
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  error.value = ""
  success.value = ""
  loading.value = true

  try {
    if (!showOtpInput.value) {
      // Send OTP
      const { error: otpError } = await signInWithOTP(email.value)
      if (otpError) throw otpError

      success.value = "Check your email for the verification code!"
      showOtpInput.value = true
    } else {
      // Verify OTP
      const { error: verifyError } = await verifyOTP(email.value, otp.value)
      if (verifyError) throw verifyError

      success.value = "Success! Redirecting..."
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "An error occurred"
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  showOtpInput.value = false
  otp.value = ""
  error.value = ""
  success.value = ""
}

usePageSetup({
  title: "Sign In - Pandorica",
  description: "Sign in to access Pandorica",
  keywords: ["auth", "login", "pandorica"],
  icon: "/images/dave-io-icon-128.png"
})
</script>
```

### 6. Create Authentication Confirmation Route

Create `app/pages/auth/confirm.vue` to handle the email confirmation:

```vue
<template>
  <div class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4">
    <div class="max-w-md mx-auto w-full">
      <Interface title="Confirming..." :use-monospace="false">
        <div class="text-center">
          <Icon name="i-mdi-loading" class="animate-spin text-blue w-12 h-12 mx-auto mb-4" />
          <p class="text-subtext0">Verifying your email...</p>
        </div>
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
import Interface from "~/app/components/layout/Interface.vue"
import { createServerClient } from "~/server/utils/supabase.server"

// Handle the confirmation on mount
onMounted(async () => {
  const route = useRoute()
  const router = useRouter()

  const tokenHash = route.query.token_hash as string
  const type = route.query.type as string

  if (!tokenHash || type !== "email") {
    await router.push("/auth/login?error=Invalid confirmation link")
    return
  }

  // Exchange the token hash for a session
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email"
  })

  if (error) {
    await router.push(`/auth/login?error=${encodeURIComponent(error.message)}`)
  } else {
    await router.push("/pandorica")
  }
})

usePageSetup({
  title: "Confirming Email - Pandorica",
  description: "Confirming your email address",
  keywords: ["auth", "confirm", "pandorica"],
  icon: "/images/dave-io-icon-128.png"
})
</script>
```

### 7. Update Pandorica Page

Modify `app/pages/pandorica.vue` to include sign-out functionality:

```vue
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="Welcome to Pandorica" :use-monospace="false">
        <div class="text-center space-y-6">
          <div class="bg-surface0/80 border border-surface2 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
            <Icon name="i-mdi-shield-check" class="text-green w-16 h-16 mx-auto mb-4" />
            <h2 class="text-text font-bold text-2xl mb-4">Access Granted!</h2>
            <p class="text-subtext0 leading-relaxed mb-4">
              Welcome, {{ userEmail }}! You have successfully authenticated using Supabase Auth with email OTP.
            </p>
            <button
              @click="handleSignOut"
              class="px-4 py-2 bg-red text-base font-medium rounded-lg hover:bg-red/90 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div class="bg-surface1/60 border border-surface2 rounded-lg p-6 backdrop-blur-sm">
            <h3 class="text-text font-semibold text-lg mb-3">Protected Content</h3>
            <p class="text-subtext0">This is your protected content that only authenticated users can see.</p>
          </div>

          <BackToHomeButton from="pandorica" />
        </div>
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
import Background from "../components/layout/Background.vue"
import Interface from "../components/layout/Interface.vue"
import BackToHomeButton from "../components/ui/BackToHomeButton.vue"

const { user, signOut } = useSupabaseAuth()
const userEmail = computed(() => user.value?.email || "User")

// Keep the middleware protection
definePageMeta({
  middleware: "protection"
})

const handleSignOut = async () => {
  await signOut()
}

usePageSetup({
  title: "Pandorica - Protected Area",
  keywords: ["pandorica", "protected", "authenticated"],
  description: "Protected area accessible only to authenticated users",
  icon: "/images/dave-io-icon-128.png",
  image: "/images/dave-io-social-1280.png"
})

onMounted(() => {
  console.log("Pandorica page mounted successfully")
})
</script>
```

### 8. Create API Endpoint for Session Validation (Optional)

If you need server-side session validation:

```typescript
// server/api/auth/session.get.ts
import { createServerClient } from "~/server/utils/supabase.server"
import { createApiResponse } from "~/server/utils/responses"

export default defineEventHandler(async (event) => {
  const supabase = createServerClient(event)

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return createApiResponse({
      result: null,
      message: "Not authenticated",
      error: null
    })
  }

  return createApiResponse({
    result: {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    },
    message: "Session valid",
    error: null
  })
})
```

## Supabase Configuration

### 1. Email Templates

In your Supabase dashboard, configure templates for PKCE flow:

#### Magic Link Template

1. Go to **Authentication** > **Email Templates**
2. Select **Magic Link** template
3. Update to support both OTP and token hash:

```html
<h2>Sign in to Pandorica</h2>

<p>Hello!</p>

<p>Click this link to sign in:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign In to Pandorica</a></p>

<p>Or enter this code: <strong>{{ .Token }}</strong></p>

<p>This link/code will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Confirm Signup Template

1. Select **Confirm signup** template
2. Update similarly:

```html
<h2>Confirm your email</h2>

<p>Welcome!</p>

<p>Please confirm your email address by clicking this link:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm Email</a></p>

<p>If you didn't sign up, you can safely ignore this email.</p>
```

### 2. Auth Settings

1. Go to **Authentication** > **Providers**
2. Ensure **Email** is enabled
3. Configure:
   - **Email OTP Expiration**: 3600 seconds (1 hour)
   - **Minimum password length**: Not applicable for OTP
   - **Site URL**: Your production URL
   - **Redirect URLs**: Add `http://localhost:3000/**` and your production URLs

### 3. Security Settings

1. Enable **Row Level Security** on all tables
2. Set up appropriate RLS policies
3. Configure rate limiting for OTP requests

## Important Nuxt 4 and Cloudflare Considerations

### Key Differences from Standard Nuxt

1. **Environment Variables**: Use `event.context.cloudflare.env`, not `process.env`
2. **Import Meta**: Use `import.meta.client/server` instead of `process.client/server`
3. **SSR Package**: Use `@supabase/ssr` for proper cookie handling
4. **Cookie Management**: Use `useCookie` composable for SSR-friendly cookies
5. **Request Event**: Use `useRequestEvent()` to access the H3 event in composables

### Cookie Security Settings

For production on Cloudflare:

- **httpOnly**: `true` for auth cookies (prevents XSS)
- **secure**: `true` (HTTPS only)
- **sameSite**: `"lax"` (CSRF protection)
- **path**: `"/"` (available across the site)

## Testing Guide

### Local Development

1. Set up environment variables in `.dev.vars`
2. Run `bun run dev`
3. Navigate to `/pandorica`
4. Should redirect to `/auth/login?redirect=/pandorica`
5. Enter email and receive OTP
6. Verify OTP and get redirected back

### Production Deployment

1. Ensure your secret is in Cloudflare Secrets Store:

   ```bash
   # In your .env file, mark only the secret key
   SUPABASE_SECRET_KEY="sb_secret_your-key" # secret

   # Sync secrets to Cloudflare Secrets Store
   bun run secrets sync

   # Or sync with force update for existing secrets
   bun run secrets sync --force
   ```

2. Update `wrangler.jsonc` to include the public values in vars:

   ```jsonc
   {
     "vars": {
       "SUPABASE_URL": "https://your-project.supabase.co",
       "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_your-key"
       // ... other non-secret vars
     },
     "secrets_store_secrets": [
       {
         "binding": "SUPABASE_SECRET_KEY",
         "secret_name": "SUPABASE_SECRET_KEY",
         "store_id": "your-store-id"
       }
     ]
   }
   ```

3. Deploy: `bun run deploy`

## Security Considerations

1. **Cookie Security**: Use `httpOnly`, `secure`, and `sameSite` flags
2. **PKCE Flow**: Enabled by default for additional security
3. **Rate Limiting**: Supabase enforces rate limits on OTP generation
4. **Session Management**: Sessions expire based on Supabase configuration
5. **No Password Storage**: Using OTP eliminates password management

## Troubleshooting

### Common Issues

1. **"auth middleware not found"**: Ensure middleware is named `protection.ts`, not `auth.ts`
2. **Cookie not persisting**: Check `sameSite` and `secure` settings, ensure using `@supabase/ssr`
3. **OTP not received**: Verify email provider settings in Supabase
4. **Session lost on refresh**: Ensure cookie storage is properly configured with SSR package
5. **`process.env` undefined**: Use `event.context.cloudflare.env` in Cloudflare Workers
6. **Hydration mismatch**: Use `import.meta.client/server` for conditional rendering

### Debug Tips

1. Check browser DevTools > Application > Cookies
2. Monitor Supabase Auth logs in dashboard
3. Use `supabase.auth.getSession()` to debug session state
4. Check Cloudflare Workers logs for server-side issues
5. Verify `.dev.vars` file is being loaded in development
6. Use `refreshCookie()` if cookie values aren't updating in Nuxt 4

## Migration Notes

- The existing JWT auth system remains untouched
- API endpoints continue using the current auth flow
- Only frontend route protection uses Supabase Auth
- No database migrations required (unless adding user profile tables)

## Why Cloudflare Secrets Store Instead of App Secrets?

We're using Cloudflare Secrets Store instead of Worker-specific secrets (set via `wrangler secret put`) for several reasons:

1. **Account-level Management**: Secrets Store allows you to manage secrets at the account level and share them across multiple Workers
2. **Centralized Updates**: Update a secret once in the store, and all Workers using it get the updated value
3. **Better Organization**: Group related secrets together with descriptive names and comments
4. **Audit Trail**: Track when secrets were created, updated, and by whom
5. **Reduced Duplication**: No need to set the same secret multiple times for different environments or Workers
6. **Simplified Deployment**: The `bin/secrets.ts` script provides automated syncing from local `.env` files marked with `# secret`

## Future Enhancements

1. **User Profiles**: Store additional user data in Supabase
2. **Role-Based Access**: Implement user roles and permissions
3. **Social Auth**: Add OAuth providers (Google, GitHub, etc.)
4. **MFA**: Enable two-factor authentication
5. **Session Management UI**: Allow users to view/revoke sessions
