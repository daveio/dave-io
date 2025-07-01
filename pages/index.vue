<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden">
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
import Background from "../components/layout/Background.vue"
import Interface from "../components/layout/Interface.vue"
import HomeContent from "../components/pages/HomeContent.vue"
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
const handleServiceClick = (service: string) => {
  logInteraction("click", "service-button", { service })
}
</script>
