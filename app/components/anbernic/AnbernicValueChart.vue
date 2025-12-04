<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-bold text-text mb-2">Price vs. Performance</h2>
      <p class="text-sm text-subtext0">Finding the sweet spot for your budget</p>
    </div>

    <!-- Chart area -->
    <div class="relative bg-surface0 rounded-lg border border-surface1 p-4" style="height: 400px">
      <!-- Y-axis label -->
      <div class="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-overlay0 whitespace-nowrap">
        Performance Score
      </div>

      <!-- X-axis label -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-overlay0">Price (USD)</div>

      <!-- Grid lines -->
      <svg class="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-3rem)]" preserveAspectRatio="none">
        <!-- Horizontal grid lines -->
        <line
          v-for="i in 5"
          :key="`h${i}`"
          x1="0"
          :y1="`${i * 20}%`"
          x2="100%"
          :y2="`${i * 20}%`"
          stroke="currentColor"
          class="text-surface1"
          stroke-dasharray="4"
        />
        <!-- Vertical grid lines -->
        <line
          v-for="i in 5"
          :key="`v${i}`"
          :x1="`${i * 20}%`"
          y1="0"
          :x2="`${i * 20}%`"
          y2="100%"
          stroke="currentColor"
          class="text-surface1"
          stroke-dasharray="4"
        />
        <!-- Value line (diagonal reference) -->
        <line
          x1="0"
          y1="100%"
          x2="100%"
          y2="0"
          stroke="currentColor"
          class="text-overlay0"
          stroke-dasharray="8"
          opacity="0.3"
        />
      </svg>

      <!-- Data points -->
      <div class="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-3rem)]">
        <div
          v-for="product in chartProducts"
          :key="product.id"
          class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:z-10"
          :style="{
            left: `${getXPosition(product.price)}%`,
            bottom: `${getYPosition(product.processor.performanceScore)}%`
          }"
          @click="$emit('selectProduct', product.id)"
          @mouseenter="hoveredProduct = product.id"
          @mouseleave="hoveredProduct = null"
        >
          <!-- Dot -->
          <div
            :class="[
              'w-4 h-4 rounded-full border-2 transition-all',
              getTierDotClass(product.performanceTier),
              hoveredProduct === product.id ? 'scale-150' : ''
            ]"
          />

          <!-- Tooltip -->
          <Transition name="fade">
            <div
              v-if="hoveredProduct === product.id"
              class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-base border border-surface1 rounded-lg p-2 shadow-lg z-20 whitespace-nowrap"
            >
              <p class="font-semibold text-text text-sm">{{ product.name }}</p>
              <p class="text-xs text-subtext0">
                ${{ product.price }} / Score: {{ product.processor.performanceScore }}
              </p>
              <p class="text-xs text-green">Value: {{ calculateValueScore(product) }}</p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Y-axis values -->
      <div class="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-xs text-overlay0">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>

      <!-- X-axis values -->
      <div class="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-overlay0">
        <span>$0</span>
        <span>$100</span>
        <span>$200</span>
        <span>$300</span>
        <span>$400</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap justify-center gap-4">
      <div v-for="tier in tierLegend" :key="tier.id" class="flex items-center gap-2">
        <div :class="['w-3 h-3 rounded-full border-2', tier.dotClass]" />
        <span class="text-xs text-subtext0">{{ tier.label }}</span>
      </div>
    </div>

    <!-- Value rankings -->
    <div class="mt-8">
      <h3 class="text-lg font-semibold text-subtext1 mb-4">Best Value Rankings</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(product, index) in topValueProducts"
          :key="product.id"
          class="flex items-center gap-3 p-3 bg-surface0 rounded-lg border border-surface1 hover:border-green/50 cursor-pointer transition-colors"
          @click="$emit('selectProduct', product.id)"
        >
          <span
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              index === 0
                ? 'bg-yellow/20 text-yellow'
                : index === 1
                  ? 'bg-subtext0/20 text-subtext0'
                  : index === 2
                    ? 'bg-peach/20 text-peach'
                    : 'bg-surface1 text-overlay0'
            ]"
          >
            {{ index + 1 }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-text truncate">{{ product.name }}</p>
            <p class="text-xs text-subtext0">${{ product.price }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-green">{{ calculateValueScore(product) }}</p>
            <p class="text-xs text-overlay0">value</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Value explanation -->
    <AnbernicInfoCard title="How Value Score Works" icon="i-heroicons-calculator" color="blue">
      <p class="text-sm text-text mb-2">
        The value score is calculated as:
        <code class="px-1 py-0.5 bg-surface1 rounded text-blue">(Performance Score / Price) × 100</code>
      </p>
      <p class="text-sm text-subtext0">
        Higher scores mean you get more performance per dollar. The diagonal line on the chart represents equal value -
        devices above the line offer better value, devices below offer less value for their price.
      </p>
    </AnbernicInfoCard>
  </div>
</template>

<script setup lang="ts">
import type { AnbernicProduct, PerformanceTier } from "~/data/anbernic/types"
import { products, calculateValueScore } from "~/data/anbernic/products"

const emit = defineEmits<{
  selectProduct: [id: string]
}>()

const hoveredProduct = ref<string | null>(null)

const chartProducts = computed(() => products.filter((p) => !p.discontinued))

const topValueProducts = computed(() => {
  return [...products]
    .map((p) => ({ ...p, valueScore: calculateValueScore(p) }))
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 9)
})

function getXPosition(price: number): number {
  const minPrice = 0
  const maxPrice = 400
  return ((price - minPrice) / (maxPrice - minPrice)) * 100
}

function getYPosition(score: number): number {
  return score // Already 0-100
}

function getTierDotClass(tier: PerformanceTier): string {
  const classes: Record<PerformanceTier, string> = {
    entry: "bg-surface2 border-overlay0",
    mid: "bg-green/50 border-green",
    "upper-mid": "bg-teal/50 border-teal",
    flagship: "bg-blue/50 border-blue",
    ultra: "bg-mauve/50 border-mauve"
  }
  return classes[tier]
}

const tierLegend = [
  { id: "entry", label: "Entry", dotClass: "bg-surface2 border-overlay0" },
  { id: "mid", label: "Mid-Range", dotClass: "bg-green/50 border-green" },
  { id: "upper-mid", label: "Upper-Mid", dotClass: "bg-teal/50 border-teal" },
  { id: "flagship", label: "Flagship", dotClass: "bg-blue/50 border-blue" },
  { id: "ultra", label: "Ultra", dotClass: "bg-mauve/50 border-mauve" }
]
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
