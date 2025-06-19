<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />
    <div class="max-w-3xl mx-auto w-full relative z-10">
      <Interface>
        <HomeContent />
      </Interface>
      <CurlCommand />
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../components/layout/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../components/layout/Interface.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import HomeContent from "../components/pages/HomeContent.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import CurlCommand from "../components/ui/CurlCommand.vue"

usePageSetup({
  title: "home",
  keywords: [
    "dave.io",
    "Dave Williams",
    "personal site",
    "portfolio",
    "blog",
    "projects",
    "web development",
    "programming",
    "technology",
    "software engineer"
  ],
  description: "Personal site of Dave Williams",
  icon: "/images/dave-io-icon-128.png",
  image: "/images/dave-io-social-1280.png"
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
