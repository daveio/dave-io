<template>
  <div data-theme="mocha" class="mocha">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtPage />
    <NuxtImg src="images/dave-io-social-1280.png" alt="image" width="400" height="400" />
  </div>
</template>

<script setup lang="ts">
// Set default color mode preference
const colorMode = useColorMode()
if (import.meta.client) {
  colorMode.preference = "dark"
}
</script>
