<template>
  <span
    :class="[tierClasses, 'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide']"
    :title="tierDescription"
  >
    {{ tierLabel }}
  </span>
</template>

<script setup lang="ts">
import type { PerformanceTier } from "~/data/anbernic/types"

interface Props {
  tier: PerformanceTier
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDescription: false
})

const tierConfig: Record<PerformanceTier, { label: string; description: string; classes: string }> = {
  entry: {
    label: "Entry",
    description: "8-bit & 16-bit gaming",
    classes: "bg-surface1 text-subtext1 border border-overlay0"
  },
  mid: {
    label: "Mid",
    description: "Up to PS1, N64, PSP (limited)",
    classes: "bg-green/20 text-green border border-green/40"
  },
  "upper-mid": {
    label: "Upper-Mid",
    description: "Good PSP, Dreamcast",
    classes: "bg-teal/20 text-teal border border-teal/40"
  },
  flagship: {
    label: "Flagship",
    description: "GameCube, PS2 (varied)",
    classes: "bg-blue/20 text-blue border border-blue/40"
  },
  ultra: {
    label: "Ultra",
    description: "Switch, AAA streaming",
    classes: "bg-mauve/20 text-mauve border border-mauve/40"
  }
}

const tierLabel = computed(() => tierConfig[props.tier].label)
const tierDescription = computed(() => tierConfig[props.tier].description)
const tierClasses = computed(() => tierConfig[props.tier].classes)
</script>
