<template>
  <div>
    <div
      class="pb-6 card card-bordered terminal-container w-full bg-surface0/50 border-surface2 shadow-2xl backdrop-blur-sm flex flex-col"
      ref="terminalContainer">
      <!-- Terminal header - sticky -->
      <div
        class="card-title terminal-header flex items-center justify-start px-4 py-2 bg-surface1/95 backdrop-blur-sm border-b border-surface2 sticky top-0 z-10">
        <div class="flex space-x-2">
          <div class="w-3 h-3 rounded-full bg-red"></div>
          <div class="w-3 h-3 rounded-full bg-yellow"></div>
          <div class="w-3 h-3 rounded-full bg-green animate-pulse"></div>
        </div>
        <div class="text-center flex-1 text-sm text-subtext0 font-mono">
          dave.io :: <NuxtLink to="https://github.com/fish-shell/fish-shell" class="link-url">
            fish</NuxtLink> ::
          13×37
        </div>
      </div>

      <!-- Terminal content - scrollable -->
      <div class="card-body terminal-content font-mono text-text p-4 text-sm flex-1 overflow-y-auto" ref="terminalContent">
        <Subtitle />
        <ProfileInfo />
        <SocialLinks />
        <ExtraLinks />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ExtraLinks from "./ExtraLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ProfileInfo from "./ProfileInfo.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import SocialLinks from "./SocialLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Subtitle from "./Subtitle.vue"
</script>

<style scoped>
.terminal-container {
  max-height: 90vh;
}

.terminal-content {
  max-height: calc(90vh - 3rem);
  /* Subtract header height */
}

@media (max-width: 800px) {
  .terminal-container {
    min-height: auto;
    max-height: none;
    border-radius: 0.75rem;
  }

  .terminal-content {
    padding: 1rem 0.5rem;
    max-height: none;
  }
}
</style>
