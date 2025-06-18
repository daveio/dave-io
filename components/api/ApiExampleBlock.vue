<template>
  <div class="mockup-code bg-base-300 rounded-lg overflow-hidden my-4">
    <pre :data-prefix="prefix" class="text-success"><code>{{ code }}</code></pre>
    <div v-if="response" class="border-t border-base-content/10 mt-2">
      <pre data-prefix=">" class="text-info"><code>{{ response }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  code: string
  prefix?: string
  response?: string
}

withDefaults(defineProps<Props>(), {
  prefix: "$"
})
</script>