<template>
  <div class="text-center space-y-6">
    <div class="bg-surface0/80 border border-surface2 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
      <img
        src="/gifs/nedry.gif"
        alt="You didn't say the magic word"
        class="mx-auto max-w-lg w-full h-auto rounded-lg"
      />
    </div>

    <div class="alert alert-error border-red border-2 bg-surface1/60 backdrop-blur-sm">
      <div class="flex items-start space-x-3">
        <Icon name="i-mdi-skull" class="text-red w-6 h-6 mt-0.5 flex-shrink-0" />
        <div class="text-left">
          <h3 class="text-red font-bold text-xl">Access Denied</h3>
          <p class="text-subtext0 mt-1 leading-relaxed">You didn't say the magic word!</p>
        </div>
      </div>
    </div>
    <BackToHomeButton from="go" />
  </div>
</template>

<script setup lang="ts">
import BackToHomeButton from "../ui/BackToHomeButton.vue"

// This component handles the Jurassic Park themed access denied content
</script>
