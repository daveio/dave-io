<template>
  <div :class="colorClasses.card" class="p-6 rounded-lg">
    <div class="space-y-4">
      <h2 :class="colorClasses.title" class="text-3xl font-bold mb-4">{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  color: "yellow" | "blue" | "purple" | "red" | "green" | "cyan" | "orange"
}

const props = defineProps<Props>()

// biome-ignore lint/correctness/noUnusedVariables: Used in template with :class
const colorClasses = computed(() => {
  const colorMap = {
    yellow: {
      card: "border-l-4 border-yellow-400 bg-gradient-to-r from-yellow-900/10 to-transparent",
      title: "text-yellow-400"
    },
    blue: {
      card: "border-l-4 border-blue-400 bg-gradient-to-r from-blue-900/10 to-transparent",
      title: "text-blue-400"
    },
    purple: {
      card: "border-l-4 border-purple-400 bg-gradient-to-r from-purple-900/10 to-transparent",
      title: "text-purple-400"
    },
    red: {
      card: "border-l-4 border-red-400 bg-gradient-to-r from-red-900/10 to-transparent",
      title: "text-red-400"
    },
    green: {
      card: "border-l-4 border-green-400 bg-gradient-to-r from-green-900/10 to-transparent",
      title: "text-green-400"
    },
    cyan: {
      card: "border-l-4 border-cyan-400 bg-gradient-to-r from-cyan-900/10 to-transparent",
      title: "text-cyan-400"
    },
    orange: {
      card: "border-l-4 border-orange-400 bg-gradient-to-r from-orange-900/10 to-transparent",
      title: "text-orange-400"
    }
  }
  return colorMap[props.color]
})
</script>