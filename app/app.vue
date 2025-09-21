<template>
  <div data-theme="mocha" class="mocha">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout v-bind="layoutProps">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Set default color mode preference
const colorMode = useColorMode()
if (import.meta.client) {
  colorMode.preference = "dark"
}

const route = useRoute()
const layoutProps = computed(() => route.meta.layoutProps ?? {})
</script>
