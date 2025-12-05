<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h2 class="text-xl font-bold text-text mb-2">Performance Tiers Explained</h2>
      <p class="text-sm text-subtext0">Understanding what each tier can handle for emulation and gaming</p>
    </div>

    <!-- Tier pyramid visualization -->
    <div class="flex flex-col items-center gap-2">
      <div
        v-for="(tier, index) in tiers"
        :key="tier.id"
        :class="[
          'rounded-lg p-4 transition-all cursor-pointer border-2',
          selectedTier === tier.id ? tier.selectedClass : tier.baseClass,
          'hover:scale-[1.02]'
        ]"
        :style="{ width: `${100 - index * 12}%` }"
        @click="selectedTier = selectedTier === tier.id ? null : tier.id"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Icon :name="tier.icon" :class="['w-6 h-6', tier.iconColor]" />
            <div>
              <h3 :class="['font-semibold', tier.textColor]">{{ tier.name }}</h3>
              <p class="text-xs text-subtext0">{{ tier.priceRange }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-subtext1">{{ tier.deviceCount }} devices</p>
            <p class="text-xs text-overlay0">{{ tier.maxEmulation }}</p>
          </div>
        </div>

        <!-- Expanded content -->
        <Transition name="expand">
          <div v-if="selectedTier === tier.id" class="mt-4 pt-4 border-t border-current/20">
            <div class="grid grid-cols-2 gap-4">
              <!-- Processors -->
              <div>
                <h4 class="text-sm font-medium text-subtext1 mb-2">Processors</h4>
                <div class="space-y-1">
                  <span
                    v-for="proc in tier.processors"
                    :key="proc"
                    class="block text-xs px-2 py-1 bg-surface0 rounded text-text"
                  >
                    {{ proc }}
                  </span>
                </div>
              </div>

              <!-- Systems playable -->
              <div>
                <h4 class="text-sm font-medium text-subtext1 mb-2">Perfect Emulation</h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="sys in tier.perfectSystems"
                    :key="sys"
                    class="text-xs px-1.5 py-0.5 bg-green/20 text-green rounded"
                  >
                    {{ sys }}
                  </span>
                </div>
              </div>

              <!-- Playable systems -->
              <div class="col-span-2">
                <h4 class="text-sm font-medium text-subtext1 mb-2">Also Playable</h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="sys in tier.playableSystems"
                    :key="sys"
                    class="text-xs px-1.5 py-0.5 bg-yellow/20 text-yellow rounded"
                  >
                    {{ sys }}
                  </span>
                </div>
              </div>

              <!-- Example devices -->
              <div class="col-span-2">
                <h4 class="text-sm font-medium text-subtext1 mb-2">Example Devices</h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="device in tier.exampleDevices"
                    :key="device.id"
                    class="text-xs px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-text transition-colors"
                    @click.stop="$emit('selectProduct', device.id)"
                  >
                    {{ device.name }} (${{ device.price }})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Performance score chart -->
    <div class="mt-8 p-4 bg-surface0 rounded-lg border border-surface1">
      <h3 class="text-lg font-semibold text-subtext1 mb-4">Processor Performance Comparison</h3>
      <div class="space-y-3">
        <div v-for="proc in sortedProcessors" :key="proc.id" class="flex items-center gap-3">
          <span class="w-28 text-sm text-text truncate">{{ proc.name }}</span>
          <div class="flex-1 h-6 bg-surface1 rounded-full overflow-hidden relative">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="getProcessorBarClass(proc.performanceScore)"
              :style="{ width: `${proc.performanceScore}%` }"
            />
            <span class="absolute inset-0 flex items-center justify-center text-xs font-medium text-text">
              {{ proc.performanceScore }}
            </span>
          </div>
          <span class="w-16 text-xs text-overlay0 text-right">{{ proc.processNode }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnbernicStore } from "~/stores/anbernic"
import { products } from "~/data/anbernic/products"
import { processors } from "~/data/anbernic/processors"

const emit = defineEmits<{
  selectProduct: [id: string]
}>()

const store = useAnbernicStore()
const selectedTier = ref<string | null>(null)

interface TierConfig {
  id: string
  name: string
  priceRange: string
  maxEmulation: string
  icon: string
  iconColor: string
  textColor: string
  baseClass: string
  selectedClass: string
  processors: string[]
  perfectSystems: string[]
  playableSystems: string[]
  exampleDevices: { id: string; name: string; price: number }[]
  deviceCount: number
}

const tiers = computed<TierConfig[]>(() => [
  {
    id: "ultra",
    name: "Ultra",
    priceRange: "$250-320",
    maxEmulation: "Switch, PS2, GameCube @ 2x",
    icon: "i-heroicons-trophy",
    iconColor: "text-mauve",
    textColor: "text-mauve",
    baseClass: "bg-mauve/10 border-mauve/30",
    selectedClass: "bg-mauve/20 border-mauve/60",
    processors: ["Dimensity 8300"],
    perfectSystems: ["PS1", "N64", "PSP", "DC", "Saturn", "NDS"],
    playableSystems: ["PS2", "GC", "Wii", "3DS", "Switch"],
    exampleDevices: products
      .filter((p) => p.performanceTier === "ultra")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    deviceCount: products.filter((p) => p.performanceTier === "ultra").length
  },
  {
    id: "flagship",
    name: "Flagship",
    priceRange: "$160-200",
    maxEmulation: "GameCube, PS2 (varied)",
    icon: "i-heroicons-star",
    iconColor: "text-blue",
    textColor: "text-blue",
    baseClass: "bg-blue/10 border-blue/30",
    selectedClass: "bg-blue/20 border-blue/60",
    processors: ["Unisoc T820"],
    perfectSystems: ["PS1", "N64", "PSP", "DC"],
    playableSystems: ["Saturn", "GC", "PS2", "Wii", "3DS"],
    exampleDevices: products
      .filter((p) => p.performanceTier === "flagship")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    deviceCount: products.filter((p) => p.performanceTier === "flagship").length
  },
  {
    id: "upper-mid",
    name: "Upper-Mid",
    priceRange: "$150-180",
    maxEmulation: "Good PSP, Dreamcast",
    icon: "i-heroicons-arrow-trending-up",
    iconColor: "text-teal",
    textColor: "text-teal",
    baseClass: "bg-teal/10 border-teal/30",
    selectedClass: "bg-teal/20 border-teal/60",
    processors: ["Unisoc T618", "RK3568"],
    perfectSystems: ["PS1", "N64", "PSP (most)", "DC"],
    playableSystems: ["Saturn", "GC (light)", "PS2 (light)"],
    exampleDevices: products
      .filter((p) => p.performanceTier === "upper-mid")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    deviceCount: products.filter((p) => p.performanceTier === "upper-mid").length
  },
  {
    id: "mid",
    name: "Mid-Range",
    priceRange: "$55-80",
    maxEmulation: "PS1 perfect, N64/PSP varied",
    icon: "i-heroicons-adjustments-horizontal",
    iconColor: "text-green",
    textColor: "text-green",
    baseClass: "bg-green/10 border-green/30",
    selectedClass: "bg-green/20 border-green/60",
    processors: ["Allwinner H700"],
    perfectSystems: ["NES", "SNES", "GB/GBC", "GBA", "Genesis", "PS1"],
    playableSystems: ["N64", "PSP", "DC"],
    exampleDevices: products
      .filter((p) => p.performanceTier === "mid")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    deviceCount: products.filter((p) => p.performanceTier === "mid").length
  },
  {
    id: "entry",
    name: "Entry",
    priceRange: "$30-50",
    maxEmulation: "8/16-bit, some PS1",
    icon: "i-heroicons-play",
    iconColor: "text-subtext1",
    textColor: "text-subtext1",
    baseClass: "bg-surface1 border-surface2",
    selectedClass: "bg-surface2 border-overlay0",
    processors: ["RK3326", "JZ4770"],
    perfectSystems: ["NES", "SNES", "GB/GBC", "GBA", "Genesis"],
    playableSystems: ["PS1", "Some N64"],
    exampleDevices: products
      .filter((p) => p.performanceTier === "entry")
      .slice(0, 3)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
    deviceCount: products.filter((p) => p.performanceTier === "entry").length
  }
])

const sortedProcessors = computed(() => {
  return Object.values(processors).sort((a, b) => b.performanceScore - a.performanceScore)
})

function getProcessorBarClass(score: number): string {
  if (score >= 90) return "bg-gradient-to-r from-mauve to-pink"
  if (score >= 70) return "bg-gradient-to-r from-blue to-teal"
  if (score >= 50) return "bg-gradient-to-r from-teal to-green"
  if (score >= 30) return "bg-gradient-to-r from-green to-yellow"
  return "bg-gradient-to-r from-yellow to-peach"
}
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
