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
const route = useRoute()
const layoutProps = computed(() => route.meta.layoutProps ?? {})
</script>
