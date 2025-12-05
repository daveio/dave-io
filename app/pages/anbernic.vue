<template>
  <div>
    <!-- Hero section -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-3 bg-gradient-to-r from-blue via-teal to-green bg-clip-text text-transparent">
        ANBERNIC Product Explorer
      </h1>
      <p class="text-lg text-subtext1 mb-2">Explore {{ store.productStats.total }} retro gaming handhelds</p>
      <p class="text-sm text-subtext0">Compare specs, emulation capabilities, and find your perfect device</p>
    </div>

    <!-- View tabs -->
    <div class="flex flex-wrap items-center justify-center gap-2 mb-6">
      <button
        v-for="tab in viewTabs"
        :key="tab.id"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
          currentView === tab.id ? 'bg-blue text-base' : 'bg-surface1 text-subtext0 hover:bg-surface2 hover:text-text'
        ]"
        @click="currentView = tab.id"
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Comparison bar (when items selected) -->
    <Transition name="slide">
      <div
        v-if="store.comparisonProductIds.length > 0"
        class="mb-6 p-3 bg-blue/10 border border-blue/30 rounded-lg flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <Icon name="i-heroicons-scale" class="w-5 h-5 text-blue" />
          <span class="text-sm text-text">
            <strong class="text-blue">{{ store.comparisonProductIds.length }}</strong> device{{
              store.comparisonProductIds.length > 1 ? "s" : ""
            }}
            selected for comparison
          </span>
          <div class="flex gap-1">
            <span
              v-for="id in store.comparisonProductIds"
              :key="id"
              class="px-2 py-0.5 bg-surface1 rounded text-xs text-text"
            >
              {{ getProductName(id) }}
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 bg-blue text-base rounded-lg text-sm font-medium hover:bg-blue/80 transition-colors"
            @click="currentView = 'compare'"
          >
            Compare Now
          </button>
          <button
            class="px-3 py-1.5 bg-surface1 text-subtext1 rounded-lg text-sm hover:bg-surface2 transition-colors"
            @click="store.clearComparison()"
          >
            Clear
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main content area -->
    <div class="flex gap-6">
      <!-- Sidebar (for products view) -->
      <aside v-if="currentView === 'products' && store.showFilters" class="w-64 flex-shrink-0">
        <div class="sticky top-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-subtext1">Filters</h2>
            <button class="text-overlay0 hover:text-text transition-colors" @click="store.showFilters = false">
              <Icon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          <AnbernicFilterSidebar />
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0">
        <!-- Products View -->
        <div v-if="currentView === 'products'">
          <!-- Toolbar -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <button
                v-if="!store.showFilters"
                class="px-3 py-1.5 bg-surface1 text-subtext1 rounded-lg text-sm flex items-center gap-1.5 hover:bg-surface2 transition-colors"
                @click="store.showFilters = true"
              >
                <Icon name="i-heroicons-funnel" class="w-4 h-4" />
                Filters
              </button>
              <span class="text-sm text-subtext0">
                Showing {{ store.sortedProducts.length }} of {{ store.productStats.total }} devices
              </span>
            </div>
            <div class="flex items-center gap-3">
              <!-- Sort dropdown -->
              <select
                :value="store.currentSort.id"
                class="bg-surface0 border border-surface1 rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-blue/50"
                @change="onSortChange"
              >
                <option v-for="opt in store.sortOptions" :key="opt.id" :value="opt.id">
                  {{ opt.name }}
                </option>
              </select>
              <!-- View mode -->
              <div class="flex bg-surface1 rounded-lg p-0.5">
                <button
                  :class="[
                    'p-1.5 rounded transition-colors',
                    store.viewMode === 'grid' ? 'bg-surface2 text-text' : 'text-overlay0 hover:text-text'
                  ]"
                  @click="store.viewMode = 'grid'"
                >
                  <Icon name="i-heroicons-squares-2x2" class="w-4 h-4" />
                </button>
                <button
                  :class="[
                    'p-1.5 rounded transition-colors',
                    store.viewMode === 'list' ? 'bg-surface2 text-text' : 'text-overlay0 hover:text-text'
                  ]"
                  @click="store.viewMode = 'list'"
                >
                  <Icon name="i-heroicons-bars-3" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Product grid -->
          <div
            v-if="store.sortedProducts.length > 0"
            :class="[store.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3']"
          >
            <AnbernicProductCard
              v-for="product in store.sortedProducts"
              :key="product.id"
              :product="product"
              @select="openProductDetail"
            />
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-12 bg-surface0 rounded-lg border border-surface1">
            <Icon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-overlay0 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-subtext1 mb-2">No devices found</h3>
            <p class="text-sm text-overlay0 mb-4">Try adjusting your filters</p>
            <button
              class="px-4 py-2 bg-blue text-base rounded-lg text-sm font-medium hover:bg-blue/80 transition-colors"
              @click="store.resetFilters()"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Comparison View -->
        <div v-else-if="currentView === 'compare'">
          <AnbernicComparisonView />
        </div>

        <!-- Performance Tiers View -->
        <div v-else-if="currentView === 'tiers'">
          <AnbernicPerformanceTiers @select-product="openProductDetail" />
        </div>

        <!-- Emulation Matrix View -->
        <div v-else-if="currentView === 'emulation'">
          <AnbernicEmulationMatrix @select-product="openProductDetail" />
        </div>

        <!-- Value Analysis View -->
        <div v-else-if="currentView === 'value'">
          <AnbernicValueChart @select-product="openProductDetail" />
        </div>
      </main>
    </div>

    <!-- Product Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="store.showDetailModal && store.selectedProduct"
          class="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto"
        >
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-crust/80 backdrop-blur-sm" @click="store.closeDetailModal()" />

          <!-- Modal content -->
          <div
            class="relative bg-base border border-surface1 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <!-- Close button -->
            <button
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-surface1 text-subtext0 hover:bg-surface2 hover:text-text transition-colors z-10"
              @click="store.closeDetailModal()"
            >
              <Icon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>

            <!-- Content -->
            <div class="p-6">
              <AnbernicProductDetail :product="store.selectedProduct" @select="openProductDetail" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Back to Home -->
    <div class="mt-8 pt-6 border-t border-surface1">
      <BackToHomeButton from="anbernic" />
    </div>
  </div>
</template>

<script setup lang="ts">
import BackToHomeButton from "~/components/shared/BackToHomeButton.vue"
import { useAnbernicStore } from "~/stores/anbernic"
import { productsById } from "~/data/anbernic/products"

usePageSetup({
  title: "anbernic",
  description:
    "Interactive ANBERNIC retro gaming handheld explorer - compare devices, view emulation compatibility, and find your perfect portable gaming companion",
  keywords: [
    "ANBERNIC",
    "retro gaming",
    "handheld console",
    "emulation",
    "RG35XX",
    "RG556",
    "RG Cube",
    "portable gaming",
    "comparison"
  ]
})

const store = useAnbernicStore()

type ViewType = "products" | "compare" | "tiers" | "emulation" | "value"
const currentView = ref<ViewType>("products")

const viewTabs = [
  { id: "products" as const, label: "All Devices", icon: "i-heroicons-device-phone-mobile" },
  { id: "compare" as const, label: "Compare", icon: "i-heroicons-scale" },
  { id: "tiers" as const, label: "Performance Tiers", icon: "i-heroicons-chart-bar" },
  { id: "emulation" as const, label: "Emulation Matrix", icon: "i-heroicons-table-cells" },
  { id: "value" as const, label: "Value Analysis", icon: "i-heroicons-currency-dollar" }
]

function onSortChange(e: Event) {
  const target = e.target as HTMLSelectElement
  store.setSort(target.value)
}

function openProductDetail(id: string) {
  store.selectProduct(id)
}

function getProductName(id: string): string {
  return productsById[id]?.name || id
}

// Initialize expanded sections
onMounted(() => {
  store.toggleSection("tier")
  store.toggleSection("formFactor")
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
