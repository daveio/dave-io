<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-text">Device Comparison</h2>
        <p class="text-sm text-subtext0">Compare up to 4 devices side-by-side</p>
      </div>
      <button
        v-if="products.length > 0"
        class="px-3 py-1.5 bg-surface1 hover:bg-surface2 text-subtext1 hover:text-text rounded-lg text-sm flex items-center gap-1.5 transition-colors"
        @click="store.clearComparison()"
      >
        <Icon name="i-heroicons-trash" class="w-4 h-4" />
        Clear All
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="products.length === 0" class="text-center py-12 bg-surface0 rounded-lg border border-surface1">
      <Icon name="i-heroicons-scale" class="w-12 h-12 text-overlay0 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-subtext1 mb-2">No devices to compare</h3>
      <p class="text-sm text-overlay0 mb-4">Add devices using the + button on product cards</p>
    </div>

    <!-- Comparison table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-max">
        <thead>
          <tr class="border-b border-surface1">
            <th class="py-3 px-4 text-left text-sm font-medium text-overlay0 w-40">Specification</th>
            <th v-for="product in products" :key="product.id" class="py-3 px-4 text-center min-w-48">
              <div class="flex flex-col items-center gap-2">
                <button
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red/20 text-red hover:bg-red/30 flex items-center justify-center"
                  @click="store.removeFromComparison(product.id)"
                >
                  <Icon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
                <span class="font-semibold text-text">{{ product.name }}</span>
                <AnbernicTierBadge :tier="product.performanceTier" />
                <span class="text-lg font-bold text-green">${{ product.price }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Basic Info -->
          <ComparisonRow label="Form Factor" :products="products" :get-value="(p) => capitalize(p.formFactor)" />
          <ComparisonRow
            label="Operating System"
            :products="products"
            :get-value="(p) => (p.os === 'android' ? 'Android' : 'Linux')"
          />
          <ComparisonRow label="Release Year" :products="products" :get-value="(p) => p.releaseYear.toString()" />

          <!-- Display -->
          <tr class="bg-blue/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-blue">Display</td>
          </tr>
          <ComparisonRow
            label="Screen Size"
            :products="products"
            :get-value="formatScreenSize"
            highlight="highest"
            :get-numeric="(p) => p.display.size"
          />
          <ComparisonRow label="Type" :products="products" :get-value="(p) => p.display.type" />
          <ComparisonRow label="Resolution" :products="products" :get-value="(p) => p.display.resolution" />
          <ComparisonRow label="Aspect Ratio" :products="products" :get-value="(p) => p.display.aspectRatio" />
          <ComparisonRow
            label="Refresh Rate"
            :products="products"
            :get-value="(p) => `${p.display.refreshRate}Hz`"
            highlight="highest"
            :get-numeric="(p) => p.display.refreshRate"
          />
          <ComparisonRow
            label="PPI"
            :products="products"
            :get-value="(p) => p.display.ppi.toString()"
            highlight="highest"
            :get-numeric="(p) => p.display.ppi"
          />
          <ComparisonRow
            label="Touchscreen"
            :products="products"
            :get-value="(p) => (p.display.touchscreen ? 'Yes' : 'No')"
            :is-boolean="true"
          />

          <!-- Processor -->
          <tr class="bg-mauve/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-mauve">Processor</td>
          </tr>
          <ComparisonRow label="Chip" :products="products" :get-value="(p) => p.processor.name" />
          <ComparisonRow label="Manufacturer" :products="products" :get-value="(p) => p.processor.manufacturer" />
          <ComparisonRow
            label="Cores"
            :products="products"
            :get-value="(p) => p.processor.cores.toString()"
            highlight="highest"
            :get-numeric="(p) => p.processor.cores"
          />
          <ComparisonRow label="Process Node" :products="products" :get-value="(p) => p.processor.processNode" />
          <ComparisonRow label="GPU" :products="products" :get-value="(p) => p.processor.gpu" />
          <ComparisonRow
            label="Performance Score"
            :products="products"
            :get-value="(p) => `${p.processor.performanceScore}/100`"
            highlight="highest"
            :get-numeric="(p) => p.processor.performanceScore"
          >
            <template #cell="{ product }">
              <div class="flex flex-col items-center gap-1">
                <span>{{ product.processor.performanceScore }}/100</span>
                <div class="w-16 h-1.5 bg-surface1 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-green to-teal rounded-full"
                    :style="{ width: `${product.processor.performanceScore}%` }"
                  />
                </div>
              </div>
            </template>
          </ComparisonRow>

          <!-- Memory -->
          <tr class="bg-teal/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-teal">Memory & Storage</td>
          </tr>
          <ComparisonRow
            label="RAM"
            :products="products"
            :get-value="(p) => `${p.ram}GB`"
            highlight="highest"
            :get-numeric="(p) => p.ram"
          />
          <ComparisonRow label="RAM Type" :products="products" :get-value="(p) => p.ramType" />
          <ComparisonRow
            label="Storage"
            :products="products"
            :get-value="(p) => `${p.storage}GB`"
            highlight="highest"
            :get-numeric="(p) => p.storage"
          />
          <ComparisonRow label="Storage Type" :products="products" :get-value="(p) => p.storageType" />
          <ComparisonRow
            label="Max SD Card"
            :products="products"
            :get-value="(p) => `${p.connectivity.maxSdCapacity}GB`"
            highlight="highest"
            :get-numeric="(p) => p.connectivity.maxSdCapacity"
          />

          <!-- Battery -->
          <tr class="bg-green/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-green">Battery</td>
          </tr>
          <ComparisonRow
            label="Capacity"
            :products="products"
            :get-value="(p) => `${p.battery.capacity}mAh`"
            highlight="highest"
            :get-numeric="(p) => p.battery.capacity"
          />
          <ComparisonRow
            label="Battery Life"
            :products="products"
            :get-value="(p) => `${p.battery.batteryLife}h`"
            highlight="highest"
            :get-numeric="(p) => p.battery.batteryLife"
          />
          <ComparisonRow
            label="Fast Charging"
            :products="products"
            :get-value="(p) => (p.battery.fastCharging ? `${p.battery.chargingSpeed}W` : 'No')"
            :is-boolean="true"
          />

          <!-- Controls -->
          <tr class="bg-purple/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-purple">Controls</td>
          </tr>
          <ComparisonRow
            label="Analog Sticks"
            :products="products"
            :get-value="(p) => p.controls.analogSticks.toString()"
            highlight="highest"
            :get-numeric="(p) => p.controls.analogSticks"
          />
          <ComparisonRow
            label="Hall Sensors"
            :products="products"
            :get-value="(p) => (p.controls.hallSensors ? 'Yes' : 'No')"
            :is-boolean="true"
          />
          <ComparisonRow
            label="Analog Triggers"
            :products="products"
            :get-value="(p) => (p.controls.analogTriggers ? 'Yes' : 'No')"
            :is-boolean="true"
          />
          <ComparisonRow
            label="Gyroscope"
            :products="products"
            :get-value="(p) => (p.controls.gyroscope ? 'Yes' : 'No')"
            :is-boolean="true"
          />
          <ComparisonRow
            label="RGB Lighting"
            :products="products"
            :get-value="(p) => (p.controls.rgbLighting ? 'Yes' : 'No')"
            :is-boolean="true"
          />

          <!-- Connectivity -->
          <tr class="bg-cyan/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-cyan">Connectivity</td>
          </tr>
          <ComparisonRow label="WiFi" :products="products" :get-value="(p) => p.connectivity.wifi.join(', ')" />
          <ComparisonRow label="Bluetooth" :products="products" :get-value="(p) => p.connectivity.bluetooth" />
          <ComparisonRow
            label="HDMI Out"
            :products="products"
            :get-value="(p) => (p.connectivity.hdmiOut ? 'Yes' : 'No')"
            :is-boolean="true"
          />

          <!-- Dimensions -->
          <tr class="bg-pink/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-pink">Dimensions</td>
          </tr>
          <ComparisonRow
            label="Weight"
            :products="products"
            :get-value="(p) => `${p.dimensions.weight}g`"
            highlight="lowest"
            :get-numeric="(p) => p.dimensions.weight"
          />
          <ComparisonRow label="Width" :products="products" :get-value="(p) => `${p.dimensions.width}mm`" />
          <ComparisonRow label="Height" :products="products" :get-value="(p) => `${p.dimensions.height}mm`" />
          <ComparisonRow label="Depth" :products="products" :get-value="(p) => `${p.dimensions.depth}mm`" />

          <!-- Value -->
          <tr class="bg-yellow/5">
            <td colspan="5" class="py-2 px-4 text-sm font-semibold text-yellow">Value Analysis</td>
          </tr>
          <ComparisonRow
            label="Value Score"
            :products="products"
            :get-value="(p) => calculateValueScore(p).toString()"
            highlight="highest"
            :get-numeric="(p) => calculateValueScore(p)"
          >
            <template #cell="{ product }">
              <div class="flex flex-col items-center gap-1">
                <span class="font-semibold text-yellow">{{ calculateValueScore(product) }}</span>
                <span class="text-xs text-overlay0">perf/$</span>
              </div>
            </template>
          </ComparisonRow>
        </tbody>
      </table>
    </div>

    <!-- Emulation Comparison -->
    <div v-if="products.length > 0" class="mt-8">
      <h3 class="text-lg font-semibold text-subtext1 mb-4 flex items-center gap-2">
        <Icon name="i-heroicons-play" class="w-5 h-5" />
        Emulation Comparison
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full min-w-max">
          <thead>
            <tr class="border-b border-surface1">
              <th class="py-3 px-4 text-left text-sm font-medium text-overlay0 w-40">System</th>
              <th v-for="product in products" :key="product.id" class="py-3 px-4 text-center min-w-32">
                {{ product.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="system in emulationSystems" :key="system.id" class="border-b border-surface1">
              <td class="py-2 px-4">
                <span class="text-sm text-text">{{ system.shortName }}</span>
                <span class="text-xs text-overlay0 ml-1">({{ system.name }})</span>
              </td>
              <td v-for="product in products" :key="product.id" class="py-2 px-4 text-center">
                <AnbernicEmulationBadge :rating="getEmulationRating(product, system.shortName)" compact />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnbernicProduct, EmulationRating } from "~/data/anbernic/types"
import { useAnbernicStore } from "~/stores/anbernic"
import { calculateValueScore } from "~/data/anbernic/products"
import { emulationSystems } from "~/data/anbernic/emulation-systems"

const store = useAnbernicStore()
const products = computed(() => store.comparisonProducts)

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getEmulationRating(product: AnbernicProduct, systemShortName: string): EmulationRating {
  const cap = product.emulationCapabilities.find((c) => c.shortName.toLowerCase() === systemShortName.toLowerCase())
  return cap?.rating || "none"
}

function formatScreenSize(product: AnbernicProduct): string {
  return product.display.size + '"'
}

// Comparison Row Component
const ComparisonRow = defineComponent({
  name: "ComparisonRow",
  props: {
    label: { type: String, required: true },
    products: { type: Array as PropType<AnbernicProduct[]>, required: true },
    getValue: { type: Function as PropType<(p: AnbernicProduct) => string>, required: true },
    getNumeric: { type: Function as PropType<(p: AnbernicProduct) => number>, default: null },
    highlight: { type: String as PropType<"highest" | "lowest" | null>, default: null },
    isBoolean: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const highlightedIndex = computed(() => {
      if (!props.highlight || !props.getNumeric) return -1
      const values = props.products.map((p) => props.getNumeric!(p))
      if (props.highlight === "highest") {
        const max = Math.max(...values)
        return values.indexOf(max)
      } else {
        const min = Math.min(...values)
        return values.indexOf(min)
      }
    })

    return () =>
      h("tr", { class: "border-b border-surface1" }, [
        h("td", { class: "py-2 px-4 text-sm text-overlay0" }, props.label),
        ...props.products.map((product, idx) =>
          h(
            "td",
            {
              class: [
                "py-2 px-4 text-center text-sm",
                highlightedIndex.value === idx ? "text-green font-medium" : "text-text",
                props.isBoolean && props.getValue(product) === "Yes" ? "text-green" : "",
                props.isBoolean && props.getValue(product) === "No" ? "text-overlay0" : ""
              ]
            },
            slots.cell ? slots.cell({ product }) : props.getValue(product)
          )
        )
      ])
  }
})
</script>
