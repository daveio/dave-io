<template>
  <div class="max-w-3xl mx-auto w-full relative z-10">
    <Hero />
    <TerminalWindow />
    <CurlCommand />
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import CurlCommand from "./CurlCommand.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Hero from "./Hero.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import TerminalWindow from "./TerminalWindow.vue"

defineProps<{
  handleServiceClick: (service: string) => void
}>()
</script>
