<template>
  <UCard :class="`border-l-4 border-${color}-400 bg-gradient-to-r from-${color}-900/10 to-transparent`">
    <div class="space-y-4">
      <h2 :class="`text-3xl font-bold text-${color}-400 mb-4`">{{ title }}</h2>
      <slot />
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  color: "pink" | "blue" | "purple" | "red" | "green" | "cyan"
}

defineProps<Props>()
</script>
