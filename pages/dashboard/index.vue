<template>
  <div class="min-h-screen p-4 bg-black text-white">
    <h1 class="text-3xl font-bold mb-4">Live Dashboard</h1>
    <LiveMetrics />
  </div>
</template>

<script setup lang="ts">
import LiveMetrics from "~/components/LiveMetrics.vue"

useHead({
  title: "Live Dashboard - dave.io",
  meta: [{ name: "description", content: "Real-time metrics dashboard" }]
})

const { logPageVisit } = usePageLogging()

onMounted(() => {
  logPageVisit("/dashboard", { title: "live-dashboard" })
})
</script>
