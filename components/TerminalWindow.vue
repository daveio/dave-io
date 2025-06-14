<template>
  <div>
    <div
      class="pb-6 terminal-container w-full bg-black/50 border border-gray-700 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm"
      ref="terminalContainer"
    >
      <!-- Terminal header -->
      <div class="terminal-header flex items-center justify-start px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div class="flex space-x-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <div class="text-center flex-1 text-sm text-gray-400 font-mono">
          dave.io :: <ULink to="https://github.com/fish-shell/fish-shell" class="hover:text-gray-300">fish</ULink> ::
          13×37
        </div>
      </div>

      <!-- Terminal content -->
      <div class="terminal-content font-mono text-white p-4 text-sm" ref="terminalContent">
        <Subtitle />
        <ProfileInfo />
        <SocialLinks />
        <ExtraLinks />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExtraLinks from "./ExtraLinks.vue"
import ProfileInfo from "./ProfileInfo.vue"
import SocialLinks from "./SocialLinks.vue"
import Subtitle from "./Subtitle.vue"
</script>

<style scoped>
.terminal-container {
  max-height: 90vh;
  overflow-y: auto;
}

.terminal-content {
  overflow: visible;
}

@media (max-width: 800px) {
  .terminal-container {
    min-height: auto;
    max-height: none;
    border-radius: 0.75rem;
  }

  .terminal-content {
    padding: 1rem 0.5rem;
  }
}
</style>
