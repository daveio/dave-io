<template>
  <span
    :class="[ratingClasses, 'px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1']"
    :title="ratingDescription"
  >
    <span v-if="showIcon" class="w-2 h-2 rounded-full" :class="dotClass"></span>
    {{ displayLabel }}
    <span v-if="showPercent && percent !== undefined" class="opacity-70"> ({{ percent }}%) </span>
  </span>
</template>

<script setup lang="ts">
import type { EmulationRating } from "~/data/anbernic/types"

interface Props {
  rating: EmulationRating
  percent?: number
  showPercent?: boolean
  showIcon?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPercent: false,
  showIcon: true,
  compact: false
})

const ratingConfig: Record<
  EmulationRating,
  { label: string; compactLabel: string; description: string; classes: string; dot: string }
> = {
  perfect: {
    label: "Perfect",
    compactLabel: "100%",
    description: "All games run flawlessly at full speed",
    classes: "bg-green/20 text-green border border-green/40",
    dot: "bg-green"
  },
  excellent: {
    label: "Excellent",
    compactLabel: "95%+",
    description: "Nearly all games work perfectly",
    classes: "bg-teal/20 text-teal border border-teal/40",
    dot: "bg-teal"
  },
  good: {
    label: "Good",
    compactLabel: "80%+",
    description: "Most games work well, some need tweaks",
    classes: "bg-blue/20 text-blue border border-blue/40",
    dot: "bg-blue"
  },
  playable: {
    label: "Playable",
    compactLabel: "50%+",
    description: "Many games playable, varies by title",
    classes: "bg-yellow/20 text-yellow border border-yellow/40",
    dot: "bg-yellow"
  },
  limited: {
    label: "Limited",
    compactLabel: "<50%",
    description: "Only simple games work",
    classes: "bg-peach/20 text-peach border border-peach/40",
    dot: "bg-peach"
  },
  none: {
    label: "N/A",
    compactLabel: "N/A",
    description: "Not supported on this device",
    classes: "bg-surface1 text-overlay0 border border-overlay0",
    dot: "bg-overlay0"
  }
}

const displayLabel = computed(() =>
  props.compact ? ratingConfig[props.rating].compactLabel : ratingConfig[props.rating].label
)
const ratingDescription = computed(() => ratingConfig[props.rating].description)
const ratingClasses = computed(() => ratingConfig[props.rating].classes)
const dotClass = computed(() => ratingConfig[props.rating].dot)
</script>
