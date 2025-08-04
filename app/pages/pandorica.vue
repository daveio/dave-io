<template>
  <div class="pandorica-container">
    <div class="header">
      <h1>Protected Content</h1>
      <button class="logout-button" :disabled="loggingOut" @click="logout">
        {{ loggingOut ? 'Logging out...' : 'Logout' }}
      </button>
    </div>
    
    <div class="user-info">
      <h2>Welcome!</h2>
      <p>You are logged in as: <strong>{{ user?.email || user?.phone }}</strong></p>
      <p class="user-id">User ID: {{ user?.id }}</p>
    </div>

    <div class="content">
      <p>This is a protected area. Only authorized users can access this content.</p>
      <!-- Add your protected content here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { clearAuthCache } from '~/middleware/protected'

// Apply the protected middleware to this specific page
definePageMeta({
  middleware: 'protected'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loggingOut = ref(false)

// Logout function with cache clearing
async function logout() {
  loggingOut.value = true
  
  try {
    // Clear the auth cache for this user
    const userIdentifier = user.value?.email || user.value?.phone || user.value?.id
    if (userIdentifier) {
      clearAuthCache(userIdentifier)
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
    }
    
    // Always redirect to login page
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
    // Still try to redirect even if logout fails
    await navigateTo('/auth/login')
  }
}

// Watch for user changes (in case of session expiry)
watch(user, (newUser) => {
  if (!newUser) {
    // User session expired or was revoked
    navigateTo('/auth/login')
  }
})
</script>

<style scoped>
.pandorica-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

h1 {
  margin: 0;
  color: #1f2937;
}

.logout-button {
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-button:hover:not(:disabled) {
  background-color: #dc2626;
}

.logout-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.user-info {
  background-color: #f3f4f6;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.user-info h2 {
  margin-top: 0;
  color: #1f2937;
}

.user-info p {
  margin: 0.5rem 0;
  color: #4b5563;
}

.user-id {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: monospace;
}

.content {
  padding: 1.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .pandorica-container {
    color: #e5e7eb;
  }
  
  .header {
    border-bottom-color: #374151;
  }
  
  h1, .user-info h2 {
    color: #f3f4f6;
  }
  
  .user-info {
    background-color: #1f2937;
  }
  
  .user-info p {
    color: #9ca3af;
  }
  
  .user-id {
    color: #6b7280;
  }
  
  .content {
    background-color: #111827;
    border-color: #374151;
    color: #e5e7eb;
  }
}
</style>
