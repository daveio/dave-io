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

onMounted(async () => {
  try {
    // The Supabase Nuxt module handles the callback automatically
    // It will exchange the token and set the session
    // We just need to wait for it to complete
    
    // Check if there's an error in the URL
    const errorParam = route.query.error as string
    const errorDescription = route.query.error_description as string
    
    if (errorParam) {
      error.value = errorDescription || errorParam
      loading.value = false
      return
    }

    // Give Supabase module time to process the callback
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if we have a user after callback processing
    const user = useSupabaseUser()
    
    if (user.value) {
      // User is authenticated, redirect to protected page
      await navigateTo('/pandorica')
    } else {
      // No user found after callback
      error.value = 'Authentication failed. Please try again.'
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    error.value = 'An unexpected error occurred during authentication.'
  } finally {
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