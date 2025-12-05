// ANBERNIC Processor/Chipset Database
import type { Processor } from "./types"

export const processors: Record<string, Processor> = {
  // Entry-level processors
  rk3326: {
    id: "rk3326",
    name: "RK3326",
    manufacturer: "Rockchip",
    architecture: "ARM Cortex-A35",
    processNode: "28nm",
    cores: 4,
    cpuConfig: "4×A35@1.5GHz",
    maxFrequency: 1500,
    gpu: "Mali-G31 MP2",
    gpuFrequency: 520,
    performanceScore: 25,
    powerEfficiency: 7,
    thermalRating: "cool",
  },

  // Mid-range processors
  h700: {
    id: "h700",
    name: "H700",
    manufacturer: "Allwinner",
    architecture: "ARM Cortex-A53",
    processNode: "28nm",
    cores: 4,
    cpuConfig: "4×A53@1.5GHz",
    maxFrequency: 1500,
    gpu: "Mali-G31 MP2",
    gpuFrequency: 600,
    performanceScore: 35,
    powerEfficiency: 7,
    thermalRating: "cool",
  },

  rk3566: {
    id: "rk3566",
    name: "RK3566",
    manufacturer: "Rockchip",
    architecture: "ARM Cortex-A55",
    processNode: "22nm",
    cores: 4,
    cpuConfig: "4×A55@1.8GHz",
    maxFrequency: 1800,
    gpu: "Mali-G52 MP2",
    gpuFrequency: 850,
    performanceScore: 45,
    powerEfficiency: 6,
    thermalRating: "warm",
  },

  rk3568: {
    id: "rk3568",
    name: "RK3568",
    manufacturer: "Rockchip",
    architecture: "ARM Cortex-A55",
    processNode: "22nm",
    cores: 4,
    cpuConfig: "4×A55@2.0GHz",
    maxFrequency: 2000,
    gpu: "Mali-G52 2EE",
    gpuFrequency: 800,
    performanceScore: 48,
    powerEfficiency: 6,
    thermalRating: "warm",
  },

  // Upper-mid processors
  t618: {
    id: "t618",
    name: "T618",
    manufacturer: "Unisoc",
    architecture: "ARM Cortex-A75/A55",
    processNode: "12nm",
    cores: 8,
    cpuConfig: "2×A75@2.0GHz + 6×A55@2.0GHz",
    maxFrequency: 2000,
    gpu: "Mali-G52 MP2",
    gpuFrequency: 850,
    performanceScore: 55,
    powerEfficiency: 6,
    thermalRating: "warm",
  },

  // Flagship processors
  t820: {
    id: "t820",
    name: "T820 (Tiger)",
    manufacturer: "Unisoc",
    architecture: "ARM Cortex-A76/A55",
    processNode: "6nm",
    cores: 8,
    cpuConfig: "1×A76@2.7GHz + 3×A76@2.3GHz + 4×A55@2.1GHz",
    maxFrequency: 2700,
    gpu: "Mali-G57 MP4",
    gpuFrequency: 850,
    performanceScore: 72,
    powerEfficiency: 8,
    thermalRating: "warm",
  },

  // Ultra processors
  dimensity8300: {
    id: "dimensity8300",
    name: "Dimensity 8300",
    manufacturer: "MediaTek",
    architecture: "ARM Cortex-A715/A510",
    processNode: "4nm",
    cores: 8,
    cpuConfig: "1×A715@3.35GHz + 3×A715@3.2GHz + 4×A510@2.2GHz",
    maxFrequency: 3350,
    gpu: "Mali-G615 MC6",
    gpuFrequency: 1000,
    performanceScore: 95,
    powerEfficiency: 9,
    thermalRating: "warm",
  },

  sd855plus: {
    id: "sd855plus",
    name: "Snapdragon 855+",
    manufacturer: "Qualcomm",
    architecture: "Kryo 485",
    processNode: "7nm",
    cores: 8,
    cpuConfig: "1×Prime@2.96GHz + 3×Perf@2.42GHz + 4×Eff@1.8GHz",
    maxFrequency: 2960,
    gpu: "Adreno 640",
    gpuFrequency: 700,
    performanceScore: 75,
    powerEfficiency: 7,
    thermalRating: "warm",
  },
}

// Processor comparison data for visualizations
export const processorBenchmarks = {
  // Relative CPU performance (single-core)
  singleCore: {
    rk3326: 100,
    h700: 130,
    rk3566: 180,
    rk3568: 195,
    t618: 280,
    t820: 520,
    dimensity8300: 850,
    sd855plus: 580,
  },
  // Relative CPU performance (multi-core)
  multiCore: {
    rk3326: 280,
    h700: 380,
    rk3566: 550,
    rk3568: 620,
    t618: 1100,
    t820: 2100,
    dimensity8300: 3800,
    sd855plus: 2400,
  },
  // GPU compute score
  gpuScore: {
    rk3326: 15,
    h700: 18,
    rk3566: 38,
    rk3568: 40,
    t618: 48,
    t820: 85,
    dimensity8300: 150,
    sd855plus: 95,
  },
  // Power efficiency (performance per watt)
  efficiency: {
    rk3326: 65,
    h700: 70,
    rk3566: 55,
    rk3568: 52,
    t618: 48,
    t820: 75,
    dimensity8300: 90,
    sd855plus: 60,
  },
}

// Emulation capability by processor
export const processorEmulationTiers: Record<
  string,
  {
    perfect: string[]
    excellent: string[]
    good: string[]
    playable: string[]
    limited: string[]
  }
> = {
  rk3326: {
    perfect: ["nes", "snes", "gb", "gbc", "gba", "genesis", "gg", "sms", "pce"],
    excellent: ["ps1"],
    good: [],
    playable: ["n64", "psp"],
    limited: ["dc", "saturn"],
  },
  h700: {
    perfect: ["nes", "snes", "gb", "gbc", "gba", "genesis", "gg", "sms", "pce", "ps1"],
    excellent: ["n64", "psp"],
    good: ["dc"],
    playable: ["saturn"],
    limited: [],
  },
  rk3566: {
    perfect: ["nes", "snes", "gb", "gbc", "gba", "genesis", "gg", "sms", "pce", "ps1"],
    excellent: ["n64", "psp", "dc"],
    good: ["saturn", "nds"],
    playable: [],
    limited: ["gc", "ps2"],
  },
  t618: {
    perfect: ["nes", "snes", "gb", "gbc", "gba", "genesis", "gg", "sms", "pce", "ps1", "n64"],
    excellent: ["psp", "dc", "nds"],
    good: ["saturn", "gc"],
    playable: ["ps2", "wii"],
    limited: ["3ds"],
  },
  t820: {
    perfect: ["nes", "snes", "gb", "gbc", "gba", "genesis", "gg", "sms", "pce", "ps1", "n64", "psp", "dc"],
    excellent: ["saturn", "nds", "gc"],
    good: ["ps2", "wii", "3ds"],
    playable: [],
    limited: ["switch"],
  },
  dimensity8300: {
    perfect: [
      "nes",
      "snes",
      "gb",
      "gbc",
      "gba",
      "genesis",
      "gg",
      "sms",
      "pce",
      "ps1",
      "n64",
      "psp",
      "dc",
      "saturn",
      "nds",
    ],
    excellent: ["gc", "ps2", "wii", "3ds"],
    good: ["wiiu"],
    playable: ["switch"],
    limited: [],
  },
}

export function getProcessorById(id: string): Processor | undefined {
  return processors[id]
}

export function compareProcessors(id1: string, id2: string) {
  const p1 = processors[id1]
  const p2 = processors[id2]
  if (!p1 || !p2) return null

  return {
    cpuAdvantage: p1.performanceScore - p2.performanceScore,
    efficiencyAdvantage: p1.powerEfficiency - p2.powerEfficiency,
    processAdvantage: parseInt(p2.processNode) - parseInt(p1.processNode), // Lower is better
    coreAdvantage: p1.cores - p2.cores,
  }
}
