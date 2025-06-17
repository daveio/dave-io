<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />
    <IndexUI :handleServiceClick="handleServiceClick" />
  </div>
</template>

<script setup lang="ts">
import Background from "../components/Background.vue"
import IndexUI from "../components/IndexUI.vue"

// Set page title and meta
useHead({
  title: "dave.io - Dave Williams",
  meta: [
    {
      name: "description",
      content: "Personal site of Dave Williams"
    }
  ]
})

// Page logging
const { logPageVisit, logInteraction } = usePageLogging()

onMounted(() => {
  // Log page visit
  logPageVisit("/", {
    title: "home",
    colorMode: "dark",
    services: ["web"]
  })
})

// Log button interactions
// biome-ignore lint/correctness/noUnusedVariables: Passed as prop to IndexUI but not currently used
const handleServiceClick = (service: string) => {
  logInteraction("click", "service-button", { service })
}
</script>
