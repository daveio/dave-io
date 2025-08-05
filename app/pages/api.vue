<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="dave.io/api" :use-monospace="false">
        <ApiContent />
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
import ApiContent from "../components/api/ApiContent.vue"
import Background from "../components/layout/Background.vue"
import Interface from "../components/layout/Interface.vue"

usePageSetup({
  title: "api",
  keywords: ["API", "REST API", "authentication", "JWT", "Cloudflare Workers", "endpoints", "dave.io", "documentation"],
  description: "Everything you never wanted to know about the dave.io API",
  icon: "/images/dave-io-icon-128.png",
  image: "/images/dave-io-social-1280.png"
})

onMounted(() => {
  // Page mounted
})
</script>

<style scoped>
/* Additional styling if needed */
</style>
