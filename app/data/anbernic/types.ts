// ANBERNIC Product Explorer Type Definitions

export type FormFactor = "horizontal" | "vertical" | "clamshell" | "sliding" | "cube" | "dual-screen"

export type OperatingSystem = "android" | "linux" | "dual-boot"

export type PerformanceTier = "entry" | "mid" | "upper-mid" | "flagship" | "ultra"

export type EmulationRating = "perfect" | "excellent" | "good" | "playable" | "limited" | "none"

export interface Processor {
  id: string
  name: string
  manufacturer: string
  architecture: string
  processNode: string // e.g., "6nm", "22nm"
  cores: number
  cpuConfig: string // e.g., "4×A53@1.5GHz"
  maxFrequency: number // MHz
  gpu: string
  gpuFrequency: number // MHz
  performanceScore: number // 1-100 relative score
  powerEfficiency: number // 1-10 rating
  thermalRating: string // "cool", "warm", "hot"
}

export interface EmulationCapability {
  system: string
  shortName: string
  generation: number // 1-8 for ordering
  rating: EmulationRating
  compatibilityPercent: number
  notes?: string
  upscalingSupport?: boolean
}

export interface Display {
  size: number // inches
  type: "IPS" | "AMOLED" | "LTPS"
  resolution: string // e.g., "640x480"
  resolutionWidth: number
  resolutionHeight: number
  aspectRatio: string // e.g., "4:3"
  ppi: number
  refreshRate: number // Hz
  touchscreen: boolean
  lamination: boolean // OCA full lamination
  brightness?: number // nits
}

export interface Battery {
  capacity: number // mAh
  batteryLife: number // hours
  chargingSpeed?: number // watts
  fastCharging: boolean
}

export interface Connectivity {
  wifi: string[] // e.g., ["2.4GHz", "5GHz"]
  wifiStandard: string // e.g., "802.11ac"
  bluetooth: string // version
  hdmiOut: boolean
  usbC: boolean
  headphoneJack: boolean
  sdCardSlot: boolean
  maxSdCapacity: number // GB
}

export interface Dimensions {
  width: number // mm
  height: number // mm
  depth: number // mm
  weight: number // grams
}

export interface Controls {
  dpad: boolean
  analogSticks: number // 0, 1, or 2
  faceButtons: number
  shoulderButtons: number
  analogTriggers: boolean
  hallSensors: boolean
  gyroscope: boolean
  rgbLighting: boolean
}

export interface AnbernicProduct {
  id: string
  name: string
  fullName: string
  slug: string
  releaseDate: string // ISO date
  releaseYear: number
  price: number // USD
  priceRange: string // e.g., "$60-70"
  formFactor: FormFactor
  os: OperatingSystem
  performanceTier: PerformanceTier
  processor: Processor
  ram: number // GB
  ramType: string
  storage: number // GB
  storageType: string
  display: Display
  battery: Battery
  connectivity: Connectivity
  dimensions: Dimensions
  controls: Controls
  emulationCapabilities: EmulationCapability[]
  colors: string[]
  features: string[]
  pros: string[]
  cons: string[]
  bestFor: string[]
  imageUrl?: string
  productUrl: string
  discontinued: boolean
}

export interface EmulationSystem {
  id: string
  name: string
  shortName: string
  manufacturer: string
  releaseYear: number
  generation: number
  difficulty: "easy" | "medium" | "hard" | "very-hard"
  minimumTier: PerformanceTier
  color: string // for UI theming
}

export interface ComparisonMetric {
  id: string
  name: string
  category: "performance" | "display" | "battery" | "portability" | "value"
  description: string
  higherIsBetter: boolean
}

export interface PricePerformanceData {
  productId: string
  price: number
  performanceScore: number
  valueScore: number // performance per dollar
}

// Filter types for the explorer
export interface ProductFilters {
  formFactors: FormFactor[]
  operatingSystems: OperatingSystem[]
  performanceTiers: PerformanceTier[]
  priceRange: [number, number]
  minScreenSize: number
  maxScreenSize: number
  emulationTarget?: string // system ID that must be playable
  features: string[]
  searchQuery: string
}

export interface SortOption {
  id: string
  name: string
  field: keyof AnbernicProduct | "valueScore" | "performanceScore"
  direction: "asc" | "desc"
}
