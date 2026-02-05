<script setup lang="ts">
const wordCount = defineModel<number>('wordCount', { required: true })
const capitalize = defineModel<boolean>('capitalize', { required: true })
const appendSuffix = defineModel<boolean>('appendSuffix', { required: true })
</script>

<template>
  <div class="border-2 border-base-300 bg-base-200/50">
    <!-- Section header -->
    <div class="px-4 py-2 border-b border-base-300/50 bg-base-200/30">
      <div class="text-[10px] tracking-[0.25em] uppercase text-secondary/60">
        Generation Parameters
      </div>
    </div>

    <div class="p-4 space-y-5">
      <!-- Word count slider -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="word-count" class="text-[11px] tracking-[0.2em] uppercase text-base-content/60">
            Word Count
          </label>
          <span class="text-sm text-primary font-bold tabular-nums glow-amber">
            {{ wordCount }}
          </span>
        </div>
        <input
          id="word-count"
          v-model.number="wordCount"
          type="range"
          :min="1"
          :max="10"
          :step="1"
          class="range range-primary range-sm w-full"
        >
        <div class="flex justify-between px-0.5 mt-1">
          <span
            v-for="n in 10"
            :key="n"
            class="text-[9px] text-base-content/30 tabular-nums"
          >
            {{ n }}
          </span>
        </div>
      </div>

      <!-- Toggles -->
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Capitalize toggle -->
        <label class="flex items-center gap-3 cursor-pointer flex-1">
          <input
            v-model="capitalize"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
          >
          <div>
            <span class="text-[11px] tracking-[0.2em] uppercase text-base-content/60 block">
              Capitalize Words
            </span>
            <span class="text-[9px] tracking-[0.15em] uppercase text-base-content/30">
              First letter uppercase
            </span>
          </div>
        </label>

        <!-- Suffix toggle -->
        <label class="flex items-center gap-3 cursor-pointer flex-1">
          <input
            v-model="appendSuffix"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
          >
          <div>
            <span class="text-[11px] tracking-[0.2em] uppercase text-base-content/60 block">
              Numeric Suffix
            </span>
            <span class="text-[9px] tracking-[0.15em] uppercase text-base-content/30">
              Append 3-digit code
            </span>
          </div>
        </label>
      </div>
    </div>

    <!-- Warning -->
    <div class="px-4 pb-3">
      <WarningLabel
        type="caution"
        text="Adjust parameters within specified tolerances"
      />
    </div>
  </div>
</template>
