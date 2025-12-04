<template>
  <div v-if="product" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text mb-1">{{ product.fullName }}</h2>
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold text-green">${{ product.price }}</span>
          <AnbernicTierBadge :tier="product.performanceTier" />
          <span
            :class="[
              'px-2 py-0.5 rounded text-xs font-medium',
              product.os === 'android' ? 'bg-teal/20 text-teal' : 'bg-yellow/20 text-yellow'
            ]"
          >
            {{ product.os === "android" ? "Android" : "Linux" }}
          </span>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors',
            isComparing ? 'bg-blue text-base' : 'bg-surface1 text-subtext1 hover:bg-surface2 hover:text-text'
          ]"
          @click="toggleComparison"
        >
          <Icon :name="isComparing ? 'i-heroicons-check' : 'i-heroicons-scale'" class="w-4 h-4" />
          {{ isComparing ? "In Comparison" : "Compare" }}
        </button>
        <a
          :href="product.productUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 rounded-lg bg-green/20 text-green text-sm font-medium flex items-center gap-1.5 hover:bg-green/30 transition-colors"
        >
          <Icon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
          View on ANBERNIC
        </a>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === tab.id
            ? 'border-blue text-blue'
            : 'border-transparent text-subtext0 hover:text-text hover:border-surface2'
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="grid grid-cols-2 gap-6">
      <!-- Left column: Key specs -->
      <div class="space-y-4">
        <AnbernicInfoCard title="Quick Specs" icon="i-heroicons-clipboard-document-list" color="blue">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-overlay0">Display:</span>
              <p class="text-text">{{ product.display.size }}" {{ product.display.type }}</p>
              <p class="text-xs text-subtext0">
                {{ product.display.resolution }} @ {{ product.display.refreshRate }}Hz
              </p>
            </div>
            <div>
              <span class="text-overlay0">Processor:</span>
              <p class="text-text">{{ product.processor.name }}</p>
              <p class="text-xs text-subtext0">{{ product.processor.manufacturer }}</p>
            </div>
            <div>
              <span class="text-overlay0">Memory:</span>
              <p class="text-text">{{ product.ram }}GB {{ product.ramType }}</p>
            </div>
            <div>
              <span class="text-overlay0">Storage:</span>
              <p class="text-text">{{ product.storage }}GB {{ product.storageType }}</p>
            </div>
            <div>
              <span class="text-overlay0">Battery:</span>
              <p class="text-text">{{ product.battery.capacity }}mAh</p>
              <p class="text-xs text-subtext0">~{{ product.battery.batteryLife }}h playtime</p>
            </div>
            <div>
              <span class="text-overlay0">Form Factor:</span>
              <p class="text-text capitalize">{{ product.formFactor }}</p>
            </div>
          </div>
        </AnbernicInfoCard>

        <AnbernicInfoCard title="Controls" icon="i-heroicons-puzzle-piece" color="purple">
          <div class="flex flex-wrap gap-2">
            <span v-if="product.controls.dpad" class="px-2 py-1 bg-purple/10 text-purple text-xs rounded">D-Pad</span>
            <span v-if="product.controls.analogSticks > 0" class="px-2 py-1 bg-purple/10 text-purple text-xs rounded">
              {{ product.controls.analogSticks }} Analog Stick{{ product.controls.analogSticks > 1 ? "s" : "" }}
            </span>
            <span class="px-2 py-1 bg-purple/10 text-purple text-xs rounded">
              {{ product.controls.faceButtons }} Face Buttons
            </span>
            <span class="px-2 py-1 bg-purple/10 text-purple text-xs rounded">
              {{ product.controls.shoulderButtons }} Shoulder Buttons
            </span>
            <span v-if="product.controls.analogTriggers" class="px-2 py-1 bg-green/10 text-green text-xs rounded">
              Analog Triggers
            </span>
            <span v-if="product.controls.hallSensors" class="px-2 py-1 bg-green/10 text-green text-xs rounded">
              Hall Sensors
            </span>
            <span v-if="product.controls.gyroscope" class="px-2 py-1 bg-teal/10 text-teal text-xs rounded">
              Gyroscope
            </span>
            <span v-if="product.controls.rgbLighting" class="px-2 py-1 bg-pink/10 text-pink text-xs rounded">
              RGB Lighting
            </span>
          </div>
        </AnbernicInfoCard>
      </div>

      <!-- Right column: Pros/Cons, Best For -->
      <div class="space-y-4">
        <AnbernicInfoCard title="Strengths" icon="i-heroicons-check-circle" color="green">
          <ul class="space-y-1.5">
            <li v-for="pro in product.pros" :key="pro" class="flex items-start gap-2 text-sm text-text">
              <Icon name="i-heroicons-check" class="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
              {{ pro }}
            </li>
          </ul>
        </AnbernicInfoCard>

        <AnbernicInfoCard title="Weaknesses" icon="i-heroicons-exclamation-circle" color="peach">
          <ul class="space-y-1.5">
            <li v-for="con in product.cons" :key="con" class="flex items-start gap-2 text-sm text-text">
              <Icon name="i-heroicons-minus" class="w-4 h-4 text-peach mt-0.5 flex-shrink-0" />
              {{ con }}
            </li>
          </ul>
        </AnbernicInfoCard>

        <AnbernicInfoCard title="Best For" icon="i-heroicons-star" color="yellow">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="useCase in product.bestFor"
              :key="useCase"
              class="px-2 py-1 bg-yellow/10 text-yellow text-sm rounded"
            >
              {{ useCase }}
            </span>
          </div>
        </AnbernicInfoCard>
      </div>
    </div>

    <!-- Full Specs Tab -->
    <div v-if="activeTab === 'specs'" class="space-y-4">
      <div class="grid grid-cols-2 gap-6">
        <!-- Display Specs -->
        <AnbernicInfoCard title="Display" icon="i-heroicons-tv" color="blue">
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="spec in displaySpecs" :key="spec.label" class="border-b border-surface1 last:border-0">
                <td class="py-2 text-overlay0">{{ spec.label }}</td>
                <td class="py-2 text-text text-right">{{ spec.value }}</td>
              </tr>
            </tbody>
          </table>
        </AnbernicInfoCard>

        <!-- Processor Specs -->
        <AnbernicInfoCard title="Processor" icon="i-heroicons-cpu-chip" color="mauve">
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="spec in processorSpecs" :key="spec.label" class="border-b border-surface1 last:border-0">
                <td class="py-2 text-overlay0">{{ spec.label }}</td>
                <td class="py-2 text-text text-right">{{ spec.value }}</td>
              </tr>
            </tbody>
          </table>
          <!-- Performance bar -->
          <div class="mt-4">
            <div class="flex justify-between text-xs text-overlay0 mb-1">
              <span>Performance Score</span>
              <span>{{ product.processor.performanceScore }}/100</span>
            </div>
            <div class="h-2 bg-surface1 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-green via-teal to-blue rounded-full transition-all"
                :style="{ width: `${product.processor.performanceScore}%` }"
              />
            </div>
          </div>
        </AnbernicInfoCard>

        <!-- Memory & Storage -->
        <AnbernicInfoCard title="Memory & Storage" icon="i-heroicons-circle-stack" color="teal">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">RAM</td>
                <td class="py-2 text-text text-right">{{ product.ram }}GB {{ product.ramType }}</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Internal Storage</td>
                <td class="py-2 text-text text-right">{{ product.storage }}GB {{ product.storageType }}</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">SD Card Support</td>
                <td class="py-2 text-text text-right">Up to {{ product.connectivity.maxSdCapacity }}GB</td>
              </tr>
            </tbody>
          </table>
        </AnbernicInfoCard>

        <!-- Battery & Power -->
        <AnbernicInfoCard title="Battery & Power" icon="i-heroicons-battery-100" color="green">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Capacity</td>
                <td class="py-2 text-text text-right">{{ product.battery.capacity }}mAh</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Battery Life</td>
                <td class="py-2 text-text text-right">~{{ product.battery.batteryLife }} hours</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Charging</td>
                <td class="py-2 text-text text-right">
                  {{ product.battery.chargingSpeed || 5 }}W
                  <span v-if="product.battery.fastCharging" class="text-green">(Fast)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </AnbernicInfoCard>

        <!-- Connectivity -->
        <AnbernicInfoCard title="Connectivity" icon="i-heroicons-wifi" color="cyan">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">WiFi</td>
                <td class="py-2 text-text text-right">{{ product.connectivity.wifi.join(", ") }}</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Standard</td>
                <td class="py-2 text-text text-right">{{ product.connectivity.wifiStandard }}</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Bluetooth</td>
                <td class="py-2 text-text text-right">{{ product.connectivity.bluetooth }}</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">HDMI Output</td>
                <td class="py-2 text-text text-right">{{ product.connectivity.hdmiOut ? "Yes" : "No" }}</td>
              </tr>
              <tr>
                <td class="py-2 text-overlay0">USB-C</td>
                <td class="py-2 text-text text-right">{{ product.connectivity.usbC ? "Yes" : "No" }}</td>
              </tr>
            </tbody>
          </table>
        </AnbernicInfoCard>

        <!-- Dimensions -->
        <AnbernicInfoCard title="Dimensions" icon="i-heroicons-arrows-pointing-out" color="pink">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Width</td>
                <td class="py-2 text-text text-right">{{ product.dimensions.width }}mm</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Height</td>
                <td class="py-2 text-text text-right">{{ product.dimensions.height }}mm</td>
              </tr>
              <tr class="border-b border-surface1">
                <td class="py-2 text-overlay0">Depth</td>
                <td class="py-2 text-text text-right">{{ product.dimensions.depth }}mm</td>
              </tr>
              <tr>
                <td class="py-2 text-overlay0">Weight</td>
                <td class="py-2 text-text text-right">{{ product.dimensions.weight }}g</td>
              </tr>
            </tbody>
          </table>
        </AnbernicInfoCard>
      </div>

      <!-- Features -->
      <AnbernicInfoCard title="Features" icon="i-heroicons-sparkles" color="yellow">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="feature in product.features"
            :key="feature"
            class="px-2 py-1 bg-yellow/10 text-yellow text-sm rounded"
          >
            {{ feature }}
          </span>
        </div>
      </AnbernicInfoCard>

      <!-- Colors -->
      <AnbernicInfoCard title="Available Colors" icon="i-heroicons-swatch" color="mauve">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="color in product.colors"
            :key="color"
            class="px-3 py-1 bg-surface1 text-text text-sm rounded border border-surface2"
          >
            {{ color }}
          </span>
        </div>
      </AnbernicInfoCard>
    </div>

    <!-- Emulation Tab -->
    <div v-if="activeTab === 'emulation'" class="space-y-4">
      <AnbernicInfoCard title="Emulation Compatibility" icon="i-heroicons-play" color="teal">
        <p class="text-sm text-subtext0 mb-4">
          Emulation performance based on the {{ product.processor.name }} ({{ product.processor.manufacturer }})
          processor with {{ product.ram }}GB RAM.
        </p>

        <!-- Group by generation -->
        <div v-for="gen in sortedGenerations" :key="gen" class="mb-6 last:mb-0">
          <h4 class="text-sm font-medium text-subtext1 mb-3 flex items-center gap-2">
            <span class="w-6 h-6 rounded bg-surface1 flex items-center justify-center text-xs">{{ gen }}</span>
            Generation {{ gen }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="cap in getCapabilitiesByGeneration(gen)"
              :key="cap.shortName"
              class="flex items-center justify-between p-3 bg-surface0 rounded-lg border border-surface1"
            >
              <div>
                <p class="text-sm font-medium text-text">{{ cap.system }}</p>
                <p class="text-xs text-overlay0">{{ cap.shortName }}</p>
              </div>
              <div class="text-right">
                <AnbernicEmulationBadge :rating="cap.rating" :percent="cap.compatibilityPercent" show-percent />
                <p v-if="cap.notes" class="text-xs text-overlay0 mt-1 max-w-32">{{ cap.notes }}</p>
                <p v-if="cap.upscalingSupport" class="text-xs text-green mt-1">
                  <Icon name="i-heroicons-arrow-up" class="w-3 h-3 inline" /> Upscaling
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnbernicInfoCard>

      <!-- Emulation Legend -->
      <AnbernicInfoCard title="Rating Legend" icon="i-heroicons-information-circle" color="blue">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="perfect" />
            <span class="text-xs text-subtext0">100% - Flawless</span>
          </div>
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="excellent" />
            <span class="text-xs text-subtext0">95%+ - Nearly perfect</span>
          </div>
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="good" />
            <span class="text-xs text-subtext0">80%+ - Most work</span>
          </div>
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="playable" />
            <span class="text-xs text-subtext0">50%+ - Many playable</span>
          </div>
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="limited" />
            <span class="text-xs text-subtext0">&lt;50% - Limited</span>
          </div>
          <div class="flex items-center gap-2">
            <AnbernicEmulationBadge rating="none" />
            <span class="text-xs text-subtext0">Not supported</span>
          </div>
        </div>
      </AnbernicInfoCard>
    </div>

    <!-- Related Products -->
    <div v-if="relatedProducts.length > 0" class="pt-4 border-t border-surface1">
      <h3 class="text-lg font-semibold text-subtext1 mb-4">Similar Devices</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="related in relatedProducts"
          :key="related.id"
          class="p-3 bg-surface0 rounded-lg border border-surface1 hover:border-blue/50 text-left transition-colors"
          @click="$emit('select', related.id)"
        >
          <p class="font-medium text-text text-sm">{{ related.name }}</p>
          <p class="text-xs text-overlay0">${{ related.price }}</p>
          <AnbernicTierBadge :tier="related.performanceTier" class="mt-2" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AnbernicProduct } from "~/data/anbernic/types"
import { useAnbernicStore } from "~/stores/anbernic"
import { getRelatedProducts } from "~/data/anbernic/products"

interface Props {
  product: AnbernicProduct | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [id: string]
}>()

const store = useAnbernicStore()

const activeTab = ref<"overview" | "specs" | "emulation">("overview")

const tabs = [
  { id: "overview" as const, label: "Overview" },
  { id: "specs" as const, label: "Full Specs" },
  { id: "emulation" as const, label: "Emulation" }
]

const isComparing = computed(() => (props.product ? store.isInComparison(props.product.id) : false))

function toggleComparison() {
  if (!props.product) return
  if (isComparing.value) {
    store.removeFromComparison(props.product.id)
  } else {
    store.addToComparison(props.product.id)
  }
}

const relatedProducts = computed(() => {
  if (!props.product) return []
  return getRelatedProducts(props.product.id, 4)
})

const displaySpecs = computed(() => {
  if (!props.product) return []
  const d = props.product.display
  return [
    { label: "Size", value: `${d.size}"` },
    { label: "Type", value: d.type },
    { label: "Resolution", value: d.resolution },
    { label: "Aspect Ratio", value: d.aspectRatio },
    { label: "PPI", value: d.ppi.toString() },
    { label: "Refresh Rate", value: `${d.refreshRate}Hz` },
    { label: "Touchscreen", value: d.touchscreen ? "Yes" : "No" },
    { label: "Lamination", value: d.lamination ? "OCA Full" : "No" }
  ]
})

const processorSpecs = computed(() => {
  if (!props.product) return []
  const p = props.product.processor
  return [
    { label: "Name", value: p.name },
    { label: "Manufacturer", value: p.manufacturer },
    { label: "Architecture", value: p.architecture },
    { label: "Process", value: p.processNode },
    { label: "Cores", value: p.cores.toString() },
    { label: "Configuration", value: p.cpuConfig },
    { label: "GPU", value: p.gpu },
    { label: "GPU Freq", value: `${p.gpuFrequency}MHz` }
  ]
})

const sortedGenerations = computed(() => {
  if (!props.product) return []
  const gens = new Set(props.product.emulationCapabilities.map((c) => c.generation))
  return Array.from(gens).sort((a, b) => a - b)
})

function getCapabilitiesByGeneration(gen: number) {
  if (!props.product) return []
  return props.product.emulationCapabilities
    .filter((c) => c.generation === gen)
    .sort((a, b) => a.shortName.localeCompare(b.shortName))
}
</script>
