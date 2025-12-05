<template>
  <div class="space-y-4">
    <!-- Search -->
    <div>
      <label class="block text-sm font-medium text-subtext1 mb-2">Search</label>
      <div class="relative">
        <Icon
          name="i-heroicons-magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-overlay0"
        />
        <input
          :value="store.filters.searchQuery"
          type="text"
          placeholder="Search devices..."
          class="w-full bg-surface0 border border-surface1 rounded-lg pl-10 pr-4 py-2 text-sm text-text placeholder-overlay0 focus:outline-none focus:border-blue/50"
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Performance Tier -->
    <FilterSection title="Performance Tier" section="tier" :is-expanded="store.isSectionExpanded('tier')">
      <div class="space-y-2">
        <label
          v-for="tier in store.availablePerformanceTiers"
          :key="tier.value"
          class="flex items-center gap-2 cursor-pointer group"
        >
          <input
            type="checkbox"
            :checked="store.filters.performanceTiers.includes(tier.value)"
            class="w-4 h-4 rounded bg-surface0 border-surface2 text-blue focus:ring-blue/50"
            @change="store.toggleTier(tier.value)"
          />
          <span class="text-sm text-subtext1 group-hover:text-text flex-1">
            {{ tier.label }}
          </span>
          <span class="text-xs text-overlay0">{{ tier.description }}</span>
        </label>
      </div>
    </FilterSection>

    <!-- Form Factor -->
    <FilterSection title="Form Factor" section="formFactor" :is-expanded="store.isSectionExpanded('formFactor')">
      <div class="space-y-2">
        <label
          v-for="ff in store.availableFormFactors"
          :key="ff.value"
          class="flex items-center gap-2 cursor-pointer group"
        >
          <input
            type="checkbox"
            :checked="store.filters.formFactors.includes(ff.value)"
            class="w-4 h-4 rounded bg-surface0 border-surface2 text-blue focus:ring-blue/50"
            @change="store.toggleFormFactor(ff.value)"
          />
          <span class="text-sm text-subtext1 group-hover:text-text flex-1">
            {{ ff.label }}
          </span>
          <span class="text-xs text-overlay0 bg-surface1 px-1.5 py-0.5 rounded">
            {{ ff.count }}
          </span>
        </label>
      </div>
    </FilterSection>

    <!-- Operating System -->
    <FilterSection title="Operating System" section="os" :is-expanded="store.isSectionExpanded('os')">
      <div class="space-y-2">
        <label
          v-for="os in store.availableOperatingSystems"
          :key="os.value"
          class="flex items-center gap-2 cursor-pointer group"
        >
          <input
            type="checkbox"
            :checked="store.filters.operatingSystems.includes(os.value)"
            class="w-4 h-4 rounded bg-surface0 border-surface2 text-blue focus:ring-blue/50"
            @change="store.toggleOS(os.value)"
          />
          <span class="text-sm text-subtext1 group-hover:text-text">
            {{ os.label }}
          </span>
        </label>
      </div>
    </FilterSection>

    <!-- Price Range -->
    <FilterSection title="Price Range" section="price" :is-expanded="store.isSectionExpanded('price')">
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <label class="text-xs text-overlay0 mb-1 block">Min</label>
            <input
              :value="store.filters.priceRange[0]"
              type="number"
              min="0"
              max="400"
              step="10"
              class="w-full bg-surface0 border border-surface1 rounded px-2 py-1 text-sm text-text"
              @input="onMinPriceChange"
            />
          </div>
          <span class="text-overlay0 mt-4">-</span>
          <div class="flex-1">
            <label class="text-xs text-overlay0 mb-1 block">Max</label>
            <input
              :value="store.filters.priceRange[1]"
              type="number"
              min="0"
              max="400"
              step="10"
              class="w-full bg-surface0 border border-surface1 rounded px-2 py-1 text-sm text-text"
              @input="onMaxPriceChange"
            />
          </div>
        </div>
        <div class="flex justify-between text-xs text-overlay0">
          <span>${{ store.filters.priceRange[0] }}</span>
          <span>${{ store.filters.priceRange[1] }}</span>
        </div>
      </div>
    </FilterSection>

    <!-- Emulation Target -->
    <FilterSection title="Must Play System" section="emulation" :is-expanded="store.isSectionExpanded('emulation')">
      <select
        :value="store.filters.emulationTarget || ''"
        class="w-full bg-surface0 border border-surface1 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-blue/50"
        @change="onEmulationChange"
      >
        <option value="">Any system</option>
        <optgroup label="Easy">
          <option v-for="sys in easyEmulation" :key="sys.id" :value="sys.shortName">
            {{ sys.name }}
          </option>
        </optgroup>
        <optgroup label="Moderate">
          <option v-for="sys in mediumEmulation" :key="sys.id" :value="sys.shortName">
            {{ sys.name }}
          </option>
        </optgroup>
        <optgroup label="Demanding">
          <option v-for="sys in hardEmulation" :key="sys.id" :value="sys.shortName">
            {{ sys.name }}
          </option>
        </optgroup>
      </select>
      <p class="text-xs text-overlay0 mt-2">Filter to devices that can run this system at least "Playable" level.</p>
    </FilterSection>

    <!-- Reset Filters -->
    <button
      v-if="hasActiveFilters"
      class="w-full py-2 px-4 bg-surface1 hover:bg-surface2 text-subtext1 hover:text-text rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
      @click="store.resetFilters()"
    >
      <Icon name="i-heroicons-x-mark" class="w-4 h-4" />
      Reset Filters
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAnbernicStore } from "~/stores/anbernic"

const store = useAnbernicStore()

const hasActiveFilters = computed(() => {
  const f = store.filters
  return (
    f.searchQuery.trim() !== "" ||
    f.formFactors.length > 0 ||
    f.operatingSystems.length > 0 ||
    f.performanceTiers.length > 0 ||
    f.priceRange[0] > 0 ||
    f.priceRange[1] < 400 ||
    f.emulationTarget !== undefined
  )
})

const easyEmulation = computed(() => store.emulationSystems.filter((s) => s.difficulty === "easy"))
const mediumEmulation = computed(() => store.emulationSystems.filter((s) => s.difficulty === "medium"))
const hardEmulation = computed(() =>
  store.emulationSystems.filter((s) => s.difficulty === "hard" || s.difficulty === "very-hard")
)

function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement
  store.setSearchQuery(target.value)
}

function onMinPriceChange(e: Event) {
  const target = e.target as HTMLInputElement
  store.setPriceRange(Number(target.value), store.filters.priceRange[1])
}

function onMaxPriceChange(e: Event) {
  const target = e.target as HTMLInputElement
  store.setPriceRange(store.filters.priceRange[0], Number(target.value))
}

function onEmulationChange(e: Event) {
  const target = e.target as HTMLSelectElement
  store.setEmulationTarget(target.value || undefined)
}

// Filter Section Component
const FilterSection = defineComponent({
  name: "FilterSection",
  props: {
    title: { type: String, required: true },
    section: { type: String, required: true },
    isExpanded: { type: Boolean, default: true }
  },
  setup(props, { slots }) {
    const store = useAnbernicStore()

    return () =>
      h("div", { class: "border border-surface1 rounded-lg overflow-hidden" }, [
        h(
          "button",
          {
            class:
              "w-full flex items-center justify-between px-3 py-2 bg-surface0 hover:bg-surface1 text-sm font-medium text-subtext1 transition-colors",
            onClick: () => store.toggleSection(props.section)
          },
          [
            h("span", props.title),
            h(resolveComponent("Icon"), {
              name: props.isExpanded ? "i-heroicons-chevron-up" : "i-heroicons-chevron-down",
              class: "w-4 h-4"
            })
          ]
        ),
        props.isExpanded ? h("div", { class: "p-3 bg-surface0/50" }, slots.default?.()) : null
      ])
  }
})
</script>
