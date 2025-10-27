<template>
  <span>
    <NuxtTurnstile v-model="token" />
    <span v-if="!error && !emailAddress" class="text-yellow font-['Victor_Mono'] animate-ping"
      >Evaluating humanity...</span
    >
    <span v-else-if="error" class="text-red font-['Victor_Mono']">
      {{ error }}
    </span>
    <span v-else-if="emailAddress" class="font-['Victor_Mono']">
      <a :href="`mailto:${emailAddress}`" class="text-yellow link-url">
        {{ emailAddress }}
      </a>
    </span>
  </span>
</template>

<script lang="ts" setup>
// Auto-imports are available in Nuxt, no need to import ref, watch, etc.
const token = ref<string>()
const emailAddress = ref<string>()
const loading = ref(false)
const error = ref<string>()

// Watch for token changes and verify
watch(
  token,
  async (newToken) => {
    if (!newToken) return

    loading.value = true
    error.value = undefined

    // 5-second delay to further confound bots
    await new Promise((resolve) => setTimeout(resolve, 5000))

    try {
      const response = await $fetch("/api/util/email", {
        method: "POST",
        body: { token: newToken }
      })

      const resp = response as { data?: { email?: string } }
      if (resp.data && typeof resp.data.email === "string") {
        emailAddress.value = resp.data.email
      } else {
        error.value = "Email not found in response"
      }
    } catch {
      error.value = "Browser integrity check failed"
    } finally {
      loading.value = false
    }
  },
  { once: true }
) // Use once option instead of manual stop
</script>
