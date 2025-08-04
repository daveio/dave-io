<template>
  <div>
    <h1>Protected Content</h1>
    <p>Welcome, {{ user?.email }}! You have authorized access.</p>
    <p>Your permissions: {{ JSON.stringify(userPermissions) }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup>
// Apply the protected middleware to this specific page
definePageMeta({
  middleware: 'protected'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const userPermissions = ref({})

// Load user permissions on mount
onMounted(async () => {
  if (user.value) {
    const { data } = await $fetch('/api/auth/check-authorization', {
      method: 'POST',
      body: { email: user.value.email, phone: user.value.phone }
    })
    userPermissions.value = data.user?.permissions || {}
  }
})

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/auth/login')
}
</script>
