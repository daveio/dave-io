<template>
  <div
    class="group relative bg-surface0 rounded-lg border border-surface1 hover:border-blue/50 transition-all duration-200 overflow-hidden cursor-pointer"
    @click="$emit('select', product.id)"
  >
    <!-- Comparison checkbox -->
    <div class="absolute top-2 right-2 z-10">
      <button
        :class="[
          'w-6 h-6 rounded flex items-center justify-center transition-all',
          isComparing ? 'bg-blue text-base' : 'bg-surface1/80 text-subtext0 hover:bg-surface2 hover:text-text'
        ]"
        :title="isComparing ? 'Remove from comparison' : 'Add to comparison'"
        @click.stop="toggleComparison"
      >
        <Icon :name="isComparing ? 'i-heroicons-check' : 'i-heroicons-plus'" class="w-4 h-4" />
      </button>
    </div>

    <!-- Product image placeholder -->
    <div class="h-32 bg-gradient-to-br from-surface1 to-surface0 flex items-center justify-center">
      <div class="text-center">
        <Icon :name="formFactorIcon" class="w-12 h-12 text-overlay1 mb-1" />
        <span class="text-xs text-overlay0 capitalize">{{ product.formFactor }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <h3 class="font-semibold text-text group-hover:text-blue transition-colors">
          {{ product.name }}
        </h3>
        <AnbernicTierBadge :tier="product.performanceTier" />
      </div>

      <!-- Price & OS -->
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg font-bold text-green">${{ product.price }}</span>
        <span
          :class="[
            'px-1.5 py-0.5 rounded text-xs font-medium',
            product.os === 'android' ? 'bg-teal/20 text-teal' : 'bg-yellow/20 text-yellow'
          ]"
        >
          {{ product.os === "android" ? "Android" : "Linux" }}
        </span>
      </div>

      <!-- Key specs -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-subtext0 mb-3">
        <div class="flex items-center gap-1">
          <Icon name="i-heroicons-tv" class="w-3 h-3" />
          {{ product.display.size }}" {{ product.display.type }}
        </div>
        <div class="flex items-center gap-1">
          <Icon name="i-heroicons-cpu-chip" class="w-3 h-3" />
          {{ product.processor.name }}
        </div>
        <div class="flex items-center gap-1">
          <Icon name="i-heroicons-battery-100" class="w-3 h-3" />
          {{ product.battery.batteryLife }}h
        </div>
        <div class="flex items-center gap-1">
          <Icon name="i-heroicons-circle-stack" class="w-3 h-3" />
          {{ product.ram }}GB RAM
        </div>
      </div>

      <!-- Emulation preview -->
      <div class="border-t border-surface1 pt-3">
        <p class="text-xs text-overlay1 mb-1.5">Emulation capability:</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="cap in topCapabilities"
            :key="cap.shortName"
            :class="['px-1.5 py-0.5 rounded text-xs', getCapabilityColor(cap.rating)]"
          >
            {{ cap.shortName }}
          </span>
          <span v-if="remainingCount > 0" class="px-1.5 py-0.5 text-xs text-overlay0"> +{{ remainingCount }} </span>
        </div>
      </div>

      <!-- Best for tags -->
      <div v-if="product.bestFor.length > 0" class="mt-3 pt-3 border-t border-surface1">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in product.bestFor.slice(0, 2)"
            :key="tag"
            class="px-1.5 py-0.5 bg-mauve/10 text-mauve text-xs rounded"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnbernicProduct, EmulationRating } from "~/data/anbernic/types"
import { useAnbernicStore } from "~/stores/anbernic"

interface Props {
  product: AnbernicProduct
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [id: string]
}>()

const store = useAnbernicStore()

const isComparing = computed(() => store.isInComparison(props.product.id))

function toggleComparison() {
  if (isComparing.value) {
    store.removeFromComparison(props.product.id)
  } else {
    store.addToComparison(props.product.id)
  }
}

const formFactorIcon = computed(() => {
  const icons: Record<string, string> = {
    horizontal: "i-heroicons-device-phone-mobile",
    vertical: "i-heroicons-device-phone-mobile",
    clamshell: "i-heroicons-device-tablet",
    sliding: "i-heroicons-arrows-right-left",
    cube: "i-heroicons-cube",
    "dual-screen": "i-heroicons-squares-2x2"
  }
  return icons[props.product.formFactor] || "i-heroicons-device-phone-mobile"
})

// Show top 5 capabilities sorted by rating
const topCapabilities = computed(() => {
  const ratingOrder: EmulationRating[] = ["perfect", "excellent", "good", "playable", "limited", "none"]
  return [...props.product.emulationCapabilities]
    .filter((c) => c.rating !== "none")
    .sort((a, b) => ratingOrder.indexOf(a.rating) - ratingOrder.indexOf(b.rating))
    .slice(0, 5)
})

const remainingCount = computed(() => {
  const playable = props.product.emulationCapabilities.filter((c) => c.rating !== "none").length
  return Math.max(0, playable - 5)
})

function getCapabilityColor(rating: EmulationRating): string {
  const colors: Record<EmulationRating, string> = {
    perfect: "bg-green/20 text-green",
    excellent: "bg-teal/20 text-teal",
    good: "bg-blue/20 text-blue",
    playable: "bg-yellow/20 text-yellow",
    limited: "bg-peach/20 text-peach",
    none: "bg-surface1 text-overlay0"
  }
  return colors[rating]
}
</script>
