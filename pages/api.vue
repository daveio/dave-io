<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden">
    <Background />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="dave.io/api" :useMonospace="false">
        <ApiContent />
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ApiContent from "../components/api/ApiContent.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../components/layout/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../components/layout/Interface.vue"

// Set page title and meta
useHead({
  title: "🚀 API Documentation - dave.io",
  meta: [
    {
      name: "description",
      content:
        "Dave.io API documentation - endpoints, authentication, and capabilities. Because even personal sites need overengineered APIs."
    },
    {
      name: "keywords",
      content: "API, REST API, authentication, JWT, Cloudflare Workers, endpoints, dave.io, documentation"
    },
    {
      property: "og:title",
      content: "API Documentation - dave.io"
    },
    {
      property: "og:description",
      content: "Everything you never wanted to know about the dave.io API"
    }
  ]
})

// Page logging
const { logPageVisit } = usePageLogging()

onMounted(() => {
  // Log page visit
  logPageVisit("/api", {
    title: "api-documentation",
    colorMode: "dark",
    services: ["web"]
  })
})
</script>

<style scoped>
/* Additional styling if needed */
</style>