<template>
  <div class="auth-callback-container">
    <div v-if="loading" class="loading-state">
      <p>Verifying your authentication...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <h2>Authentication Error</h2>
      <p>{{ error }}</p>
      <NuxtLink to="/auth/login">Return to Login</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const supabase = useSupabaseClient()

onMounted(async () => {
  try {
    // Check if there's an error in the URL
    const errorParam = route.query.error as string
    const errorDescription = route.query.error_description as string
    
    if (errorParam) {
      error.value = errorDescription || errorParam
      loading.value = false
      return
    }

    // Use onAuthStateChange to properly wait for authentication
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User is authenticated, clean up listener and redirect
        authListener?.subscription.unsubscribe()
        await navigateTo('/pandorica')
      } else if (event === 'USER_UPDATED' && !session) {
        // Authentication failed
        error.value = 'Authentication failed. Please try again.'
        loading.value = false
        authListener?.subscription.unsubscribe()
      }
    })

    // Set a timeout as a fallback
    setTimeout(() => {
      if (loading.value) {
        error.value = 'Authentication timeout. Please try again.'
        loading.value = false
        authListener?.subscription.unsubscribe()
      }
    }, 5000)
  } catch (err) {
    console.error('Auth callback error:', err)
    error.value = 'An unexpected error occurred during authentication.'
    loading.value = false
  }
})
</script>

<style scoped>
.auth-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-state,
.error-state {
  text-align: center;
  max-width: 400px;
}

.error-state h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state a {
  color: #3b82f6;
  text-decoration: underline;
  margin-top: 1rem;
  display: inline-block;
}
</style>