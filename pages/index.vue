<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />
    <div class="max-w-3xl mx-auto w-full relative z-10">
      <Hero />
      <Interface>
        <HomeContent />
      </Interface>
      <CurlCommand />
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../components/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import CurlCommand from "../components/CurlCommand.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Hero from "../components/Hero.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import HomeContent from "../components/HomeContent.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../components/Interface.vue"

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
