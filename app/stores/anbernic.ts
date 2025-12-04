// ANBERNIC Product Explorer Store
import type {
  AnbernicProduct,
  FormFactor,
  OperatingSystem,
  PerformanceTier,
  ProductFilters,
  SortOption,
} from "~/data/anbernic/types"
import {
  products,
  productsById,
  searchProducts,
  getRelatedProducts,
  calculateValueScore,
} from "~/data/anbernic/products"
import { processors, processorBenchmarks } from "~/data/anbernic/processors"
import { emulationSystems, emulationSystemsById } from "~/data/anbernic/emulation-systems"

export type ViewMode = "grid" | "list" | "comparison"
export type DetailTab = "overview" | "specs" | "emulation" | "comparison"

export const useAnbernicStore = defineStore("anbernic", () => {
  // ============================================
  // State
  // ============================================

  // View state
  const viewMode = ref<ViewMode>("grid")
  const selectedProductId = ref<string | null>(null)
  const comparisonProductIds = ref<string[]>([])
  const detailTab = ref<DetailTab>("overview")
  const showDetailModal = ref(false)

  // Filter state
  const filters = ref<ProductFilters>({
    formFactors: [],
    operatingSystems: [],
    performanceTiers: [],
    priceRange: [0, 400],
    minScreenSize: 0,
    maxScreenSize: 10,
    emulationTarget: undefined,
    features: [],
    searchQuery: "",
  })

  // Sort state
  const currentSort = ref<SortOption>({
    id: "price-asc",
    name: "Price: Low to High",
    field: "price",
    direction: "asc",
  })

  // UI state
  const isLoading = ref(false)
  const showFilters = ref(true)
  const expandedSections = ref<string[]>(["tier", "formFactor"])

  // ============================================
  // Sort options
  // ============================================
  const sortOptions: SortOption[] = [
    { id: "price-asc", name: "Price: Low to High", field: "price", direction: "asc" },
    { id: "price-desc", name: "Price: High to Low", field: "price", direction: "desc" },
    { id: "performance", name: "Performance", field: "performanceScore", direction: "desc" },
    { id: "value", name: "Best Value", field: "valueScore", direction: "desc" },
    { id: "release", name: "Newest First", field: "releaseDate", direction: "desc" },
    { id: "screen", name: "Screen Size", field: "display", direction: "desc" },
    { id: "battery", name: "Battery Life", field: "battery", direction: "desc" },
  ]

  // ============================================
  // Computed: Filtered & Sorted Products
  // ============================================
  const filteredProducts = computed(() => {
    let result = [...products]

    // Search query filter
    if (filters.value.searchQuery.trim()) {
      result = searchProducts(filters.value.searchQuery)
    }

    // Form factor filter
    if (filters.value.formFactors.length > 0) {
      result = result.filter((p) => filters.value.formFactors.includes(p.formFactor))
    }

    // OS filter
    if (filters.value.operatingSystems.length > 0) {
      result = result.filter((p) => filters.value.operatingSystems.includes(p.os))
    }

    // Performance tier filter
    if (filters.value.performanceTiers.length > 0) {
      result = result.filter((p) => filters.value.performanceTiers.includes(p.performanceTier))
    }

    // Price range filter
    result = result.filter((p) => p.price >= filters.value.priceRange[0] && p.price <= filters.value.priceRange[1])

    // Screen size filter
    result = result.filter(
      (p) => p.display.size >= filters.value.minScreenSize && p.display.size <= filters.value.maxScreenSize,
    )

    // Emulation target filter - show only devices that can play the target system
    if (filters.value.emulationTarget) {
      result = result.filter((p) =>
        p.emulationCapabilities.some(
          (e) =>
            e.shortName.toLowerCase() === filters.value.emulationTarget?.toLowerCase() &&
            ["perfect", "excellent", "good", "playable"].includes(e.rating),
        ),
      )
    }

    // Feature filter
    if (filters.value.features.length > 0) {
      result = result.filter((p) =>
        filters.value.features.every((f) => p.features.some((pf) => pf.toLowerCase().includes(f.toLowerCase()))),
      )
    }

    return result
  })

  const sortedProducts = computed(() => {
    const sorted = [...filteredProducts.value]
    const { field, direction } = currentSort.value
    const multiplier = direction === "asc" ? 1 : -1

    sorted.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (field) {
        case "price":
          aVal = a.price
          bVal = b.price
          break
        case "performanceScore":
          aVal = a.processor.performanceScore
          bVal = b.processor.performanceScore
          break
        case "valueScore":
          aVal = calculateValueScore(a)
          bVal = calculateValueScore(b)
          break
        case "releaseDate":
          aVal = new Date(a.releaseDate).getTime()
          bVal = new Date(b.releaseDate).getTime()
          break
        case "display":
          aVal = a.display.size
          bVal = b.display.size
          break
        case "battery":
          aVal = a.battery.batteryLife
          bVal = b.battery.batteryLife
          break
        default:
          aVal = a.price
          bVal = b.price
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * multiplier
      }
      return String(aVal).localeCompare(String(bVal)) * multiplier
    })

    return sorted
  })

  // ============================================
  // Computed: Selected Product
  // ============================================
  const selectedProduct = computed(() => {
    if (!selectedProductId.value) return null
    return productsById[selectedProductId.value] || null
  })

  const comparisonProducts = computed(() => {
    return comparisonProductIds.value.map((id) => productsById[id]).filter((p): p is AnbernicProduct => p !== undefined)
  })

  const relatedProducts = computed(() => {
    if (!selectedProductId.value) return []
    return getRelatedProducts(selectedProductId.value, 4)
  })

  // ============================================
  // Computed: Statistics
  // ============================================
  const productStats = computed(() => {
    const priceRange = products.reduce(
      (acc, p) => ({
        min: Math.min(acc.min, p.price),
        max: Math.max(acc.max, p.price),
      }),
      { min: Infinity, max: 0 },
    )

    const screenRange = products.reduce(
      (acc, p) => ({
        min: Math.min(acc.min, p.display.size),
        max: Math.max(acc.max, p.display.size),
      }),
      { min: Infinity, max: 0 },
    )

    const formFactorCounts = products.reduce(
      (acc, p) => {
        acc[p.formFactor] = (acc[p.formFactor] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const tierCounts = products.reduce(
      (acc, p) => {
        acc[p.performanceTier] = (acc[p.performanceTier] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: products.length,
      filtered: filteredProducts.value.length,
      priceRange,
      screenRange,
      formFactorCounts,
      tierCounts,
    }
  })

  // ============================================
  // Computed: Available filter options
  // ============================================
  const availableFormFactors = computed((): { value: FormFactor; label: string; count: number }[] => [
    { value: "horizontal", label: "Horizontal", count: productStats.value.formFactorCounts.horizontal || 0 },
    { value: "vertical", label: "Vertical", count: productStats.value.formFactorCounts.vertical || 0 },
    { value: "clamshell", label: "Clamshell", count: productStats.value.formFactorCounts.clamshell || 0 },
    { value: "sliding", label: "Sliding", count: productStats.value.formFactorCounts.sliding || 0 },
    { value: "cube", label: "Cube", count: productStats.value.formFactorCounts.cube || 0 },
    { value: "dual-screen", label: "Dual Screen", count: productStats.value.formFactorCounts["dual-screen"] || 0 },
  ])

  const availableOperatingSystems = computed((): { value: OperatingSystem; label: string }[] => [
    { value: "android", label: "Android" },
    { value: "linux", label: "Linux" },
  ])

  const availablePerformanceTiers = computed((): { value: PerformanceTier; label: string; description: string }[] => [
    { value: "entry", label: "Entry", description: "Basic retro gaming" },
    { value: "mid", label: "Mid-Range", description: "Up to PS1/N64" },
    { value: "upper-mid", label: "Upper-Mid", description: "Good PSP/DC" },
    { value: "flagship", label: "Flagship", description: "GameCube/PS2" },
    { value: "ultra", label: "Ultra", description: "Switch/AAA capable" },
  ])

  // ============================================
  // Actions
  // ============================================

  function selectProduct(id: string | null) {
    selectedProductId.value = id
    if (id) {
      showDetailModal.value = true
      detailTab.value = "overview"
    }
  }

  function closeDetailModal() {
    showDetailModal.value = false
  }

  function addToComparison(id: string) {
    if (!comparisonProductIds.value.includes(id) && comparisonProductIds.value.length < 4) {
      comparisonProductIds.value.push(id)
    }
  }

  function removeFromComparison(id: string) {
    comparisonProductIds.value = comparisonProductIds.value.filter((pid) => pid !== id)
  }

  function clearComparison() {
    comparisonProductIds.value = []
  }

  function isInComparison(id: string): boolean {
    return comparisonProductIds.value.includes(id)
  }

  function toggleFormFactor(formFactor: FormFactor) {
    const idx = filters.value.formFactors.indexOf(formFactor)
    if (idx >= 0) {
      filters.value.formFactors.splice(idx, 1)
    } else {
      filters.value.formFactors.push(formFactor)
    }
  }

  function toggleOS(os: OperatingSystem) {
    const idx = filters.value.operatingSystems.indexOf(os)
    if (idx >= 0) {
      filters.value.operatingSystems.splice(idx, 1)
    } else {
      filters.value.operatingSystems.push(os)
    }
  }

  function toggleTier(tier: PerformanceTier) {
    const idx = filters.value.performanceTiers.indexOf(tier)
    if (idx >= 0) {
      filters.value.performanceTiers.splice(idx, 1)
    } else {
      filters.value.performanceTiers.push(tier)
    }
  }

  function setSort(sortId: string) {
    const option = sortOptions.find((s) => s.id === sortId)
    if (option) {
      currentSort.value = option
    }
  }

  function setSearchQuery(query: string) {
    filters.value.searchQuery = query
  }

  function setPriceRange(min: number, max: number) {
    filters.value.priceRange = [min, max]
  }

  function setEmulationTarget(systemId: string | undefined) {
    filters.value.emulationTarget = systemId
  }

  function resetFilters() {
    filters.value = {
      formFactors: [],
      operatingSystems: [],
      performanceTiers: [],
      priceRange: [0, 400],
      minScreenSize: 0,
      maxScreenSize: 10,
      emulationTarget: undefined,
      features: [],
      searchQuery: "",
    }
  }

  function toggleSection(section: string) {
    const idx = expandedSections.value.indexOf(section)
    if (idx >= 0) {
      expandedSections.value.splice(idx, 1)
    } else {
      expandedSections.value.push(section)
    }
  }

  function isSectionExpanded(section: string): boolean {
    return expandedSections.value.includes(section)
  }

  // ============================================
  // Return store interface
  // ============================================
  return {
    // State
    viewMode,
    selectedProductId,
    comparisonProductIds,
    detailTab,
    showDetailModal,
    filters,
    currentSort,
    isLoading,
    showFilters,
    expandedSections,

    // Static data
    sortOptions,
    allProducts: products,
    processors,
    processorBenchmarks,
    emulationSystems,
    emulationSystemsById,

    // Computed
    filteredProducts,
    sortedProducts,
    selectedProduct,
    comparisonProducts,
    relatedProducts,
    productStats,
    availableFormFactors,
    availableOperatingSystems,
    availablePerformanceTiers,

    // Actions
    selectProduct,
    closeDetailModal,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    toggleFormFactor,
    toggleOS,
    toggleTier,
    setSort,
    setSearchQuery,
    setPriceRange,
    setEmulationTarget,
    resetFilters,
    toggleSection,
    isSectionExpanded,
  }
})
