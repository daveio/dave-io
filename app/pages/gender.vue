<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />

    <GenderFloatingChatButton />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="dave.io/gender" :use-monospace="false">
        <GenderContent />
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenderContent from "../components/gender/GenderContent.vue"
import GenderFloatingChatButton from "../components/gender/GenderFloatingChatButton.vue"
import Background from "../components/layout/Background.vue"
import Interface from "../components/layout/Interface.vue"

usePageSetup({
  title: "gender",
  keywords: [
    "non-binary",
    "pronouns",
    "they/them",
    "gender identity",
    "LGBTQ+",
    "transgender",
    "enby",
    "inclusion",
    "respect",
    "gender diversity"
  ],
  description: "Understanding non-binary gender identity and they/them pronouns - a friendly educational guide",
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
