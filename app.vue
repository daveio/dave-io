<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
// Set default color mode preference
const colorMode = useColorMode()
if (import.meta.client) {
  colorMode.preference = "dark"
}
</script>
