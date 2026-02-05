<script setup lang="ts">
const props = defineProps<{
  type?: 'caution' | 'notice' | 'danger'
  text: string
}>()

const typeStyles = {
  caution: 'border-warning/40 text-warning/70',
  notice: 'border-secondary/40 text-secondary/70',
  danger: 'border-error/40 text-error/70',
}

const typePrefix = {
  caution: 'CAUTION',
  notice: 'NOTICE',
  danger: '⚠ WARNING',
}

const style = computed(() => typeStyles[props.type ?? 'notice'])
const prefix = computed(() => typePrefix[props.type ?? 'notice'])
</script>

<template>
  <div
    class="border px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase opacity-70"
    :class="style"
  >
    <span class="font-bold">{{ prefix }}:</span> {{ text }}
  </div>
</template>
