<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden">
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
import Background from "../../components/Background.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import GoContent from "../../components/GoContent.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Interface from "../../components/Interface.vue"

// Page metadata
useHead({
  title: "Access Denied - Dave.io",
  meta: [{ name: "description", content: "You didn't say the magic word!" }]
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
