# Supabase Auth Implementation Guide for /pandorica Route Protection

This guide outlines how to implement Supabase Auth with email OTP to protect the `/pandorica` frontend route in the dave.io application.

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
2. **Cookie Management**: Need server-side cookie handling for session management
3. **Middleware Naming**: 'auth' middleware name is reserved by Supabase/Nuxt integrations

## Implementation Steps

### 1. Environment Configuration

Add Supabase credentials to environment variables:

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For server-side operations
```

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  // ... existing config
  runtimeConfig: {
    // Server-side only
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      // Client-side accessible
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  }
})
```

### 2. Create Supabase Client Utilities

#### `app/utils/supabase.client.ts` - Browser client

```typescript
import { createClient } from "@supabase/supabase-js"
import type { Database } from "~/types/supabase"

export const createBrowserClient = () => {
  const config = useRuntimeConfig()

  return createClient<Database>(config.public.supabaseUrl, config.public.supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: {
        // Use cookies instead of localStorage for SSR compatibility
        getItem: (key: string) => {
          const cookie = useCookie(key, {
            httpOnly: false,
            sameSite: "lax",
            secure: true
          })
          return cookie.value
        },
        setItem: (key: string, value: string) => {
          const cookie = useCookie(key, {
            httpOnly: false,
            sameSite: "lax",
            secure: true,
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
          cookie.value = value
        },
        removeItem: (key: string) => {
          const cookie = useCookie(key)
          cookie.value = null
        }
      }
    }
  })
}
```

#### `server/utils/supabase.server.ts` - Server client

```typescript
import { createClient } from "@supabase/supabase-js"
import type { Database } from "~/types/supabase"
import type { H3Event } from "h3"

export const createServerClient = (event: H3Event) => {
  const config = useRuntimeConfig()

  return createClient<Database>(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey || config.public.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          // Pass through cookies from the request
          cookie: getCookie(event, "sb-auth-token") || ""
        }
      }
    }
  )
}
```

### 3. Create Auth Composables

#### `app/composables/useSupabaseAuth.ts`

```typescript
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
        emailRedirectTo: `${window.location.origin}/pandorica`
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
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only protect the /pandorica route
  if (to.path !== "/pandorica") {
    return
  }

  // Client-side check
  if (process.client) {
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
  if (process.server) {
    const supabase = createServerClient(useEvent())
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

### 6. Update Pandorica Page

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

### 7. Create API Endpoint for Session Validation (Optional)

If you need server-side session validation:

```typescript
// server/api/auth/session.get.ts
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

In your Supabase dashboard:

1. Go to **Authentication** > **Email Templates**
2. Select **Magic Link** template
3. Update the template to send OTP instead:

```html
<h2>Your sign-in code</h2>

<p>Hello!</p>

<p>Your sign-in code is: <strong>{{ .Token }}</strong></p>

<p>This code will expire in 1 hour.</p>

<p>If you didn't request this code, you can safely ignore this email.</p>
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

## Testing Guide

### Local Development

1. Set up environment variables
2. Run `bun run dev`
3. Navigate to `/pandorica`
4. Should redirect to `/auth/login?redirect=/pandorica`
5. Enter email and receive OTP
6. Verify OTP and get redirected back

### Production Deployment

1. Set Cloudflare environment variables:

   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

2. Deploy: `bun run deploy`

## Security Considerations

1. **Cookie Security**: Use `httpOnly`, `secure`, and `sameSite` flags
2. **PKCE Flow**: Enabled by default for additional security
3. **Rate Limiting**: Supabase enforces rate limits on OTP generation
4. **Session Management**: Sessions expire based on Supabase configuration
5. **No Password Storage**: Using OTP eliminates password management

## Troubleshooting

### Common Issues

1. **"auth middleware not found"**: Ensure middleware is named `protection.ts`, not `auth.ts`
2. **Cookie not persisting**: Check `sameSite` and `secure` settings
3. **OTP not received**: Verify email provider settings in Supabase
4. **Session lost on refresh**: Ensure cookie storage is properly configured

### Debug Tips

1. Check browser DevTools > Application > Cookies
2. Monitor Supabase Auth logs in dashboard
3. Use `supabase.auth.getSession()` to debug session state
4. Check Cloudflare Workers logs for server-side issues

## Migration Notes

- The existing JWT auth system remains untouched
- API endpoints continue using the current auth flow
- Only frontend route protection uses Supabase Auth
- No database migrations required (unless adding user profile tables)

## Future Enhancements

1. **User Profiles**: Store additional user data in Supabase
2. **Role-Based Access**: Implement user roles and permissions
3. **Social Auth**: Add OAuth providers (Google, GitHub, etc.)
4. **MFA**: Enable two-factor authentication
5. **Session Management UI**: Allow users to view/revoke sessions
