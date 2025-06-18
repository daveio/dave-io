<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />
    
    <GenderFloatingChatButton />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="gender.dave.io" subtitle="pronouns guide" :showFishLink="false" :useMonospace="false">
        <GenderContent />
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../components/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderContent from "../components/GenderContent.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GenderFloatingChatButton from "../components/GenderFloatingChatButton.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../components/Interface.vue"

// Set page title and meta
useHead({
  title: "🏳️‍⚧️ Gender Identity & Pronouns - dave.io",
  meta: [
    {
      name: "description",
      content:
        "Dave Williams' journey with non-binary gender identity, using they/them pronouns. A friendly, educational guide to understanding gender diversity."
    },
    {
      name: "keywords",
      content:
        "non-binary, pronouns, they/them, gender identity, LGBTQ+, transgender, enby, inclusion, respect, gender diversity"
    },
    {
      property: "og:title",
      content: "Gender Identity & Pronouns - dave.io"
    },
    {
      property: "og:description",
      content: "Understanding non-binary gender identity and they/them pronouns - a friendly educational guide"
    }
  ]
})

// Page logging
const { logPageVisit } = usePageLogging()

onMounted(() => {
  // Log page visit
  logPageVisit("/gender", {
    title: "gender-identity-guide",
    colorMode: "dark",
    services: ["web"]
  })
})
</script>

<style scoped>
/* Additional styling if needed */
</style>
