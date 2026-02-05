<script setup lang="ts">
defineProps<{
  password: string
  copied: boolean
}>()

const emit = defineEmits<{
  copy: []
  regenerate: []
}>()
</script>

<template>
  <div class="border-2 border-base-300 bg-base-200/50">
    <!-- Section header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-base-300/50 bg-base-200/30">
      <div class="text-[10px] tracking-[0.25em] uppercase text-secondary/60">
        Generated Credential
      </div>
      <div class="text-[10px] tracking-[0.2em] uppercase text-base-content/30">
        Classification: Personnel
      </div>
    </div>

    <!-- Password output -->
    <div class="p-4 sm:p-6">
      <div
        class="password-text text-base sm:text-lg md:text-xl text-primary glow-amber leading-relaxed min-h-[3rem] flex items-center"
      >
        {{ password }}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2 px-4 py-3 border-t border-base-300/50">
      <button
        class="btn btn-sm btn-primary uppercase tracking-[0.15em] text-[11px] flex-1 sm:flex-none"
        @click="emit('copy')"
      >
        <Icon v-if="!copied" name="lucide:clipboard-copy" size="14" />
        <Icon v-else name="lucide:check" size="14" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>

      <button
        class="btn btn-sm btn-secondary btn-outline uppercase tracking-[0.15em] text-[11px] flex-1 sm:flex-none"
        @click="emit('regenerate')"
      >
        <Icon name="lucide:refresh-cw" size="14" />
        Regenerate
      </button>
    </div>
  </div>
</template>
