<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-bold text-text mb-2">Emulation Compatibility Matrix</h2>
      <p class="text-sm text-subtext0">What can each device play? Find the right handheld for your favorite systems.</p>
    </div>

    <!-- System filter -->
    <div class="flex flex-wrap gap-2 justify-center">
      <button
        v-for="gen in generations"
        :key="gen"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          selectedGeneration === gen
            ? 'bg-blue text-base'
            : 'bg-surface1 text-subtext0 hover:bg-surface2 hover:text-text'
        ]"
        @click="selectedGeneration = selectedGeneration === gen ? null : gen"
      >
        Gen {{ gen }}
      </button>
      <button
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          selectedGeneration === null
            ? 'bg-blue text-base'
            : 'bg-surface1 text-subtext0 hover:bg-surface2 hover:text-text'
        ]"
        @click="selectedGeneration = null"
      >
        All Systems
      </button>
    </div>

    <!-- Matrix table -->
    <div class="overflow-x-auto">
      <table class="w-full min-w-max border-collapse">
        <thead>
          <tr>
            <th
              class="sticky left-0 z-10 bg-base py-3 px-4 text-left text-sm font-medium text-overlay0 border-b border-surface1"
            >
              System
            </th>
            <th
              v-for="device in sortedDevices"
              :key="device.id"
              class="py-3 px-2 text-center border-b border-surface1 min-w-20"
            >
              <button
                class="text-xs font-medium text-text hover:text-blue transition-colors"
                @click="$emit('selectProduct', device.id)"
              >
                {{ device.name }}
              </button>
              <p class="text-xs text-overlay0">${{ device.price }}</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="system in filteredSystems" :key="system.id">
            <tr
              :class="['border-b border-surface1 transition-colors', hoveredSystem === system.id ? 'bg-surface0' : '']"
              @mouseenter="hoveredSystem = system.id"
              @mouseleave="hoveredSystem = null"
            >
              <td class="sticky left-0 z-10 bg-base py-2 px-4">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded flex items-center justify-center text-xs bg-surface1 text-overlay0">
                    {{ system.generation }}
                  </span>
                  <div>
                    <p class="text-sm font-medium text-text">{{ system.shortName }}</p>
                    <p class="text-xs text-overlay0">{{ system.name }}</p>
                  </div>
                </div>
              </td>
              <td v-for="device in sortedDevices" :key="`${system.id}-${device.id}`" class="py-2 px-2 text-center">
                <div class="flex justify-center">
                  <span
                    :class="[
                      'w-6 h-6 rounded flex items-center justify-center text-xs font-medium',
                      getRatingClass(getDeviceRating(device, system.shortName))
                    ]"
                    :title="getRatingTitle(getDeviceRating(device, system.shortName))"
                  >
                    {{ getRatingSymbol(getDeviceRating(device, system.shortName)) }}
                  </span>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap justify-center gap-4 pt-4 border-t border-surface1">
      <div v-for="rating in ratingLegend" :key="rating.id" class="flex items-center gap-2">
        <span :class="['w-6 h-6 rounded flex items-center justify-center text-xs font-medium', rating.class]">
          {{ rating.symbol }}
        </span>
        <span class="text-xs text-subtext0">{{ rating.label }}</span>
      </div>
    </div>

    <!-- Quick recommendations -->
    <AnbernicInfoCard title="Quick Recommendations" icon="i-heroicons-light-bulb" color="yellow">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-text mb-2">Best for PS2/GameCube:</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="device in ps2Recommendations"
              :key="device.id"
              class="text-xs px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-text transition-colors"
              @click="$emit('selectProduct', device.id)"
            >
              {{ device.name }} (${{ device.price }})
            </button>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium text-text mb-2">Best for PSP/Dreamcast:</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="device in pspRecommendations"
              :key="device.id"
              class="text-xs px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-text transition-colors"
              @click="$emit('selectProduct', device.id)"
            >
              {{ device.name }} (${{ device.price }})
            </button>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium text-text mb-2">Best Budget (PS1/N64):</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="device in budgetRecommendations"
              :key="device.id"
              class="text-xs px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-text transition-colors"
              @click="$emit('selectProduct', device.id)"
            >
              {{ device.name }} (${{ device.price }})
            </button>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium text-text mb-2">Best for 8/16-bit Only:</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="device in retroRecommendations"
              :key="device.id"
              class="text-xs px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-text transition-colors"
              @click="$emit('selectProduct', device.id)"
            >
              {{ device.name }} (${{ device.price }})
            </button>
          </div>
        </div>
      </div>
    </AnbernicInfoCard>
  </div>
</template>

<script setup lang="ts">
import type { AnbernicProduct, EmulationRating } from "~/data/anbernic/types"
import { products } from "~/data/anbernic/products"
import { emulationSystems } from "~/data/anbernic/emulation-systems"

const emit = defineEmits<{
  selectProduct: [id: string]
}>()

const selectedGeneration = ref<number | null>(null)
const hoveredSystem = ref<string | null>(null)

const generations = computed(() => {
  const gens = new Set(emulationSystems.map((s) => s.generation))
  return Array.from(gens).sort((a, b) => a - b)
})

const filteredSystems = computed(() => {
  if (selectedGeneration.value === null) {
    return emulationSystems
  }
  return emulationSystems.filter((s) => s.generation === selectedGeneration.value)
})

const sortedDevices = computed(() => {
  return [...products].filter((p) => !p.discontinued).sort((a, b) => a.price - b.price)
})

function getDeviceRating(device: AnbernicProduct, systemShortName: string): EmulationRating {
  const cap = device.emulationCapabilities.find((c) => c.shortName.toLowerCase() === systemShortName.toLowerCase())
  return cap?.rating || "none"
}

function getRatingSymbol(rating: EmulationRating): string {
  const symbols: Record<EmulationRating, string> = {
    perfect: "A",
    excellent: "B",
    good: "C",
    playable: "D",
    limited: "E",
    none: "-"
  }
  return symbols[rating]
}

function getRatingClass(rating: EmulationRating): string {
  const classes: Record<EmulationRating, string> = {
    perfect: "bg-green/30 text-green",
    excellent: "bg-teal/30 text-teal",
    good: "bg-blue/30 text-blue",
    playable: "bg-yellow/30 text-yellow",
    limited: "bg-peach/30 text-peach",
    none: "bg-surface1 text-overlay0"
  }
  return classes[rating]
}

function getRatingTitle(rating: EmulationRating): string {
  const titles: Record<EmulationRating, string> = {
    perfect: "Perfect (100% - All games flawless)",
    excellent: "Excellent (95%+ - Nearly perfect)",
    good: "Good (80%+ - Most games work)",
    playable: "Playable (50%+ - Many work)",
    limited: "Limited (<50% - Only some work)",
    none: "Not supported"
  }
  return titles[rating]
}

const ratingLegend = [
  { id: "perfect", symbol: "A", label: "Perfect", class: "bg-green/30 text-green" },
  { id: "excellent", symbol: "B", label: "Excellent", class: "bg-teal/30 text-teal" },
  { id: "good", symbol: "C", label: "Good", class: "bg-blue/30 text-blue" },
  { id: "playable", symbol: "D", label: "Playable", class: "bg-yellow/30 text-yellow" },
  { id: "limited", symbol: "E", label: "Limited", class: "bg-peach/30 text-peach" },
  { id: "none", symbol: "-", label: "N/A", class: "bg-surface1 text-overlay0" }
]

// Recommendations
const ps2Recommendations = computed(() =>
  products
    .filter((p) => {
      const ps2Cap = p.emulationCapabilities.find((c) => c.shortName === "PS2")
      return ps2Cap && ["perfect", "excellent", "good"].includes(ps2Cap.rating)
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
)

const pspRecommendations = computed(() =>
  products
    .filter((p) => {
      const pspCap = p.emulationCapabilities.find((c) => c.shortName === "PSP")
      return pspCap && ["perfect", "excellent"].includes(pspCap.rating)
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
)

const budgetRecommendations = computed(() =>
  products
    .filter((p) => {
      const ps1Cap = p.emulationCapabilities.find((c) => c.shortName === "PS1")
      return p.price < 80 && ps1Cap && ["perfect", "excellent"].includes(ps1Cap.rating)
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
)

const retroRecommendations = computed(() =>
  products
    .filter((p) => p.price < 70)
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
)
</script>
