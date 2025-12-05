// Emulation Systems Database for ANBERNIC Product Explorer
import type { EmulationSystem } from "./types"

export const emulationSystems: EmulationSystem[] = [
  // Generation 3 (8-bit era)
  {
    id: "nes",
    name: "Nintendo Entertainment System",
    shortName: "NES",
    manufacturer: "Nintendo",
    releaseYear: 1983,
    generation: 3,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#E60012",
  },
  {
    id: "sms",
    name: "Sega Master System",
    shortName: "SMS",
    manufacturer: "Sega",
    releaseYear: 1985,
    generation: 3,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#0066CC",
  },
  {
    id: "gb",
    name: "Game Boy",
    shortName: "GB",
    manufacturer: "Nintendo",
    releaseYear: 1989,
    generation: 3,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#8B956D",
  },
  {
    id: "gbc",
    name: "Game Boy Color",
    shortName: "GBC",
    manufacturer: "Nintendo",
    releaseYear: 1998,
    generation: 3,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#6A5ACD",
  },
  {
    id: "gg",
    name: "Sega Game Gear",
    shortName: "GG",
    manufacturer: "Sega",
    releaseYear: 1990,
    generation: 3,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#1A1A1A",
  },

  // Generation 4 (16-bit era)
  {
    id: "snes",
    name: "Super Nintendo",
    shortName: "SNES",
    manufacturer: "Nintendo",
    releaseYear: 1990,
    generation: 4,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#7B68EE",
  },
  {
    id: "genesis",
    name: "Sega Genesis/Mega Drive",
    shortName: "Genesis",
    manufacturer: "Sega",
    releaseYear: 1988,
    generation: 4,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#1E90FF",
  },
  {
    id: "pce",
    name: "PC Engine/TurboGrafx-16",
    shortName: "PCE",
    manufacturer: "NEC",
    releaseYear: 1987,
    generation: 4,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#FF6347",
  },
  {
    id: "gba",
    name: "Game Boy Advance",
    shortName: "GBA",
    manufacturer: "Nintendo",
    releaseYear: 2001,
    generation: 4,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#4169E1",
  },

  // Generation 5 (32/64-bit era)
  {
    id: "ps1",
    name: "PlayStation",
    shortName: "PS1",
    manufacturer: "Sony",
    releaseYear: 1994,
    generation: 5,
    difficulty: "easy",
    minimumTier: "entry",
    color: "#003087",
  },
  {
    id: "saturn",
    name: "Sega Saturn",
    shortName: "Saturn",
    manufacturer: "Sega",
    releaseYear: 1994,
    generation: 5,
    difficulty: "hard",
    minimumTier: "mid",
    color: "#4B0082",
  },
  {
    id: "n64",
    name: "Nintendo 64",
    shortName: "N64",
    manufacturer: "Nintendo",
    releaseYear: 1996,
    generation: 5,
    difficulty: "medium",
    minimumTier: "mid",
    color: "#228B22",
  },

  // Generation 6 (128-bit era)
  {
    id: "dc",
    name: "Sega Dreamcast",
    shortName: "DC",
    manufacturer: "Sega",
    releaseYear: 1998,
    generation: 6,
    difficulty: "medium",
    minimumTier: "mid",
    color: "#FF8C00",
  },
  {
    id: "ps2",
    name: "PlayStation 2",
    shortName: "PS2",
    manufacturer: "Sony",
    releaseYear: 2000,
    generation: 6,
    difficulty: "very-hard",
    minimumTier: "upper-mid",
    color: "#003087",
  },
  {
    id: "gc",
    name: "Nintendo GameCube",
    shortName: "GC",
    manufacturer: "Nintendo",
    releaseYear: 2001,
    generation: 6,
    difficulty: "hard",
    minimumTier: "upper-mid",
    color: "#663399",
  },
  {
    id: "xbox",
    name: "Xbox",
    shortName: "Xbox",
    manufacturer: "Microsoft",
    releaseYear: 2001,
    generation: 6,
    difficulty: "very-hard",
    minimumTier: "flagship",
    color: "#107C10",
  },

  // Portable Generation 6
  {
    id: "psp",
    name: "PlayStation Portable",
    shortName: "PSP",
    manufacturer: "Sony",
    releaseYear: 2004,
    generation: 6,
    difficulty: "medium",
    minimumTier: "mid",
    color: "#000000",
  },
  {
    id: "nds",
    name: "Nintendo DS",
    shortName: "NDS",
    manufacturer: "Nintendo",
    releaseYear: 2004,
    generation: 6,
    difficulty: "medium",
    minimumTier: "mid",
    color: "#C0C0C0",
  },

  // Generation 7
  {
    id: "wii",
    name: "Nintendo Wii",
    shortName: "Wii",
    manufacturer: "Nintendo",
    releaseYear: 2006,
    generation: 7,
    difficulty: "hard",
    minimumTier: "flagship",
    color: "#FFFFFF",
  },
  {
    id: "3ds",
    name: "Nintendo 3DS",
    shortName: "3DS",
    manufacturer: "Nintendo",
    releaseYear: 2011,
    generation: 7,
    difficulty: "hard",
    minimumTier: "flagship",
    color: "#CC0000",
  },
  {
    id: "psvita",
    name: "PlayStation Vita",
    shortName: "Vita",
    manufacturer: "Sony",
    releaseYear: 2011,
    generation: 7,
    difficulty: "very-hard",
    minimumTier: "ultra",
    color: "#003087",
  },

  // Generation 8
  {
    id: "wiiu",
    name: "Nintendo Wii U",
    shortName: "Wii U",
    manufacturer: "Nintendo",
    releaseYear: 2012,
    generation: 8,
    difficulty: "very-hard",
    minimumTier: "ultra",
    color: "#009AC7",
  },
  {
    id: "switch",
    name: "Nintendo Switch",
    shortName: "Switch",
    manufacturer: "Nintendo",
    releaseYear: 2017,
    generation: 8,
    difficulty: "very-hard",
    minimumTier: "ultra",
    color: "#E60012",
  },
]

export const emulationSystemsById = Object.fromEntries(emulationSystems.map((sys) => [sys.id, sys]))

export function getSystemsByGeneration(generation: number): EmulationSystem[] {
  return emulationSystems.filter((s) => s.generation === generation)
}

export function getSystemsByDifficulty(difficulty: EmulationSystem["difficulty"]): EmulationSystem[] {
  return emulationSystems.filter((s) => s.difficulty === difficulty)
}

export function getSystemsPlayableOnTier(tier: string): EmulationSystem[] {
  const tierOrder = ["entry", "mid", "upper-mid", "flagship", "ultra"]
  const tierIndex = tierOrder.indexOf(tier)
  return emulationSystems.filter((s) => tierOrder.indexOf(s.minimumTier) <= tierIndex)
}

// Compatibility descriptions for UI
export const compatibilityDescriptions = {
  perfect: "100% compatible - All games run flawlessly at full speed",
  excellent: "95%+ compatible - Nearly all games work perfectly",
  good: "80-95% compatible - Most games work well, some may need tweaks",
  playable: "50-80% compatible - Many games playable, varies by title",
  limited: "Under 50% compatible - Only simple games work",
  none: "Not supported on this device",
}

// Color coding for ratings
export const ratingColors = {
  perfect: "#a6e3a1", // green
  excellent: "#94e2d5", // teal
  good: "#89b4fa", // blue
  playable: "#f9e2af", // yellow
  limited: "#fab387", // peach
  none: "#f38ba8", // red
}
