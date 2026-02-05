<script setup lang="ts">
import type { ZxcvbnResult } from '@zxcvbn-ts/core'

const props = defineProps<{
  strength: ZxcvbnResult | null
}>()

const scoreLabels = ['CRITICAL', 'WEAK', 'MODERATE', 'STRONG', 'MAXIMUM']
const scoreColors = ['bg-error', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success']
const scoreTextColors = ['text-error', 'text-warning', 'text-warning', 'text-success', 'text-success']
const scoreGlows = ['glow-red', '', '', 'glow-green', 'glow-green']

const score = computed(() => props.strength?.score ?? 0)
const label = computed(() => scoreLabels[score.value])
const textColor = computed(() => scoreTextColors[score.value])
const glow = computed(() => scoreGlows[score.value])

const crackTime = computed(() => {
  if (!props.strength) return null
  return props.strength.crackTimesDisplay.offlineSlowHashing1e4PerSecond
})

const crackTimeFast = computed(() => {
  if (!props.strength) return null
  return props.strength.crackTimesDisplay.offlineFastHashing1e10PerSecond
})
</script>

<template>
  <div class="border-2 border-base-300 bg-base-200/50">
    <!-- Section header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-base-300/50 bg-base-200/30">
      <div class="text-[10px] tracking-[0.25em] uppercase text-secondary/60">
        Security Analysis
      </div>
      <div class="text-[10px] tracking-[0.2em] uppercase text-base-content/30">
        MU/TH/UR Assessment
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Loading state -->
      <div v-if="!strength" class="flex items-center justify-between">
        <span class="text-[11px] tracking-[0.2em] uppercase text-base-content/60">
          Security Rating
        </span>
        <span class="text-sm tracking-[0.2em] uppercase text-base-content/30 animate-pulse">
          ANALYZING...
        </span>
      </div>

      <!-- Score label -->
      <div v-else class="flex items-center justify-between">
        <span class="text-[11px] tracking-[0.2em] uppercase text-base-content/60">
          Security Rating
        </span>
        <span
          class="text-sm tracking-[0.2em] uppercase font-bold"
          :class="[textColor, glow]"
        >
          {{ label }}
        </span>
      </div>

      <!-- Strength bar (5 segments) -->
      <div class="flex gap-1">
        <div
          v-for="i in 5"
          :key="i"
          class="h-2 flex-1 transition-all duration-300"
          :class="strength && i <= score + 1 ? scoreColors[score] : 'bg-base-300/50'"
        />
      </div>

      <!-- Crack times -->
      <div v-if="strength" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] tracking-[0.15em] uppercase text-base-content/40">
            Offline Attack (slow hash)
          </span>
          <span class="text-[11px] tracking-[0.1em] text-base-content/70 tabular-nums">
            {{ crackTime }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] tracking-[0.15em] uppercase text-base-content/40">
            Offline Attack (fast hash)
          </span>
          <span class="text-[11px] tracking-[0.1em] text-base-content/70 tabular-nums">
            {{ crackTimeFast }}
          </span>
        </div>
        <div v-if="strength.guessesLog10" class="flex items-center justify-between">
          <span class="text-[10px] tracking-[0.15em] uppercase text-base-content/40">
            Entropy Estimate
          </span>
          <span class="text-[11px] tracking-[0.1em] text-base-content/70 tabular-nums">
            ~{{ Math.round(strength.guessesLog10 * 3.32) }} bits
          </span>
        </div>
      </div>
    </div>

    <!-- Notice -->
    <div class="px-4 pb-3">
      <WarningLabel
        type="notice"
        text="Security classification determined by MU/TH/UR analysis"
      />
    </div>
  </div>
</template>
