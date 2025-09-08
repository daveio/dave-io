<template>
  <div>
    <ApiContent />
  </div>
</template>

<script setup lang="ts">
import ApiContent from "~/components/api/ApiContent.vue"

usePageSetup({
  title: "api",
  keywords: ["API", "REST API", "authentication", "JWT", "Cloudflare Workers", "endpoints", "dave.io", "documentation"],
  description: "Everything you never wanted to know about the dave.io API"
})

onMounted(() => {
  // Page mounted
})
</script>

<style scoped>
/* Additional styling if needed */
</style>
