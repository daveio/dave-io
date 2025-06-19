<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden"
  >
    <Background />

    <div class="max-w-4xl mx-auto w-full relative z-10">
      <Interface title="dave.io/go" :useMonospace="false">
        <GoContent />
      </Interface>
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Background from "../../components/layout/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../../components/layout/Interface.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GoContent from "../../components/pages/GoContent.vue"

usePageSetup({
  title: "go",
  keywords: ["access denied", "magic word", "jurassic park", "dennis nedry"],
  description: "You didn't say the magic word!",
  icon: "/images/dave-io-icon-128.png",
  image: "/images/dave-io-social-1280.png"
})

// Page logging
const { logPageVisit } = usePageLogging()

onMounted(() => {
  // Log page visit to access denied page
  logPageVisit("/go", {
    title: "Access Denied",
    theme: "jurassic-park",
    reason: "no-magic-word"
  })
})
</script>
