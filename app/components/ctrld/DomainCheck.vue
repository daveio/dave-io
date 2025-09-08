<template>
  <div class="domain-check-section">
    <div class="flex items-center gap-2 mb-3">
      <Icon name="i-heroicons-shield-check" class="text-blue-400 w-5 h-5" />
      <h3 class="text-lg font-semibold text-text">Domain Security Check</h3>
    </div>

    <div class="bg-surface1/50 border border-surface2 rounded-lg p-4">
      <div v-if="loading" class="flex items-center gap-2 text-subtext1 bg-{{ indicator }}">
        <Icon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
        <span>Checking domain security...</span>
      </div>

      <div v-else-if="error || !safety" class="text-red-400">
        <Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-2" />
        {{ error }}
      </div>

      <div v-else-if="result && safety" class="text-green-400">
        <p class="text-sm">{{ result }}</p>
      </div>

      <div v-else class="text-subtext1 text-sm">
        <Icon name="i-heroicons-information-circle" class="w-4 h-4 inline mr-2" />
        Domain check completed
      </div>
    </div>
    <p class="text-subtext1 text-sm mt-4">
      The domain check operates with <strong>very limited information</strong>. It will only catch the most obvious red
      flags.
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  auth: string
  domain: string
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref<string>()
const result = ref<string>()
const safety = ref<boolean>()

// Function to check domain security
const checkDomainSecurity = async () => {
  try {
    loading.value = true
    error.value = undefined

    if (!props.domain) {
      error.value = "No domain provided"
      return
    }

    const response = await $fetch("/api/ctrld/check", {
      method: "POST",
      body: { domain: props.domain, auth: props.auth }
    })

    // The API returns the AI response directly
    const res = response as unknown as { safe: boolean; reasoning: string }
    result.value = res.reasoning
    safety.value = res.safe
  } catch (err) {
    console.error("Domain check failed:", err)
    error.value = "Failed to check domain security"
  } finally {
    loading.value = false
  }
}

// Check domain when component mounts
onMounted(() => {
  checkDomainSecurity()
})
</script>

<style scoped>
.domain-check-section {
  margin-bottom: 6px;
}
</style>
