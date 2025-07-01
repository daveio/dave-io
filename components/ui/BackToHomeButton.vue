<template>
  <div class="text-center pt-8">
    <NuxtLink to="/" @click="handleBackClick"
      class="inline-flex items-center px-6 py-4 text-xl font-semibold text-crust bg-gradient-to-r from-pink to-mauve hover:from-pink hover:to-mauve transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg">
      <Icon name="i-mdi-arrow-left" class="mr-3 w-6 h-6" />
      🏠 Back to Home
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Props {
  from?: string
}

const props = withDefaults(defineProps<Props>(), {
  from: "page"
})

// Page logging
const { logInteraction } = usePageLogging()

// Track back button clicks
const handleBackClick = () => {
  logInteraction("click", "navigation", { action: "back-to-home", from: props.from })
}
</script>
