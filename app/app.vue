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
declare global {
  interface Window {
    SentryToolbar?: {
      init(config: { organizationSlug: string; projectIdOrSlug: string }): void
    }
  }
}

useScript("https://browser.sentry-cdn.com/sentry-toolbar/latest/toolbar.min.js", {
  use() {
    if (window.SentryToolbar) {
      window.SentryToolbar.init({
        organizationSlug: "daveio",
        projectIdOrSlug: "dave-io"
      })
    }
    return null
  }
})

// Set default color mode preference
const colorMode = useColorMode()
if (import.meta.client) {
  colorMode.preference = "dark"
}

const route = useRoute()
const layoutProps = computed(() => route.meta.layoutProps ?? {})
</script>
