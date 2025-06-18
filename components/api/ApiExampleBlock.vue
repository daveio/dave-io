<template>
  <div class="mockup-code bg-base-300 rounded-lg overflow-hidden my-4">
    <pre :data-prefix="prefix" class="text-success"><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
interface Props {
  code: string
  prefix?: string
}

withDefaults(defineProps<Props>(), {
  prefix: "$"
})
</script>
