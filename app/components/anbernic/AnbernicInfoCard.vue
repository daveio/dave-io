<template>
  <div :class="[colorClasses.card, 'p-5 rounded-lg border transition-all duration-200']">
    <h3 v-if="title" :class="[colorClasses.title, 'text-lg font-semibold mb-3 flex items-center gap-2']">
      <Icon v-if="icon" :name="icon" class="w-5 h-5" />
      {{ title }}
    </h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
type CardColor = "pink" | "blue" | "purple" | "red" | "green" | "cyan" | "yellow" | "peach" | "mauve" | "teal"

interface Props {
  title?: string
  icon?: string
  color?: CardColor
}

const props = withDefaults(defineProps<Props>(), {
  color: "blue"
})

const colorClasses = computed(() => {
  const colors: Record<CardColor, { card: string; title: string }> = {
    pink: {
      card: "bg-pink/10 border-pink/30 hover:border-pink/50",
      title: "text-pink"
    },
    blue: {
      card: "bg-blue/10 border-blue/30 hover:border-blue/50",
      title: "text-blue"
    },
    purple: {
      card: "bg-purple/10 border-purple/30 hover:border-purple/50",
      title: "text-purple"
    },
    red: {
      card: "bg-red/10 border-red/30 hover:border-red/50",
      title: "text-red"
    },
    green: {
      card: "bg-green/10 border-green/30 hover:border-green/50",
      title: "text-green"
    },
    cyan: {
      card: "bg-cyan/10 border-cyan/30 hover:border-cyan/50",
      title: "text-cyan"
    },
    yellow: {
      card: "bg-yellow/10 border-yellow/30 hover:border-yellow/50",
      title: "text-yellow"
    },
    peach: {
      card: "bg-peach/10 border-peach/30 hover:border-peach/50",
      title: "text-peach"
    },
    mauve: {
      card: "bg-mauve/10 border-mauve/30 hover:border-mauve/50",
      title: "text-mauve"
    },
    teal: {
      card: "bg-teal/10 border-teal/30 hover:border-teal/50",
      title: "text-teal"
    }
  }
  return colors[props.color]
})
</script>
