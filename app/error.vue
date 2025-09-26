<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-red mb-4">{{ error.statusCode }}</h1>
      <p class="text-subtext1">{{ error.statusMessage }}</p>
      <NuxtLink to="/" class="mt-4 inline-block text-blue hover:text-sapphire"> Return Home </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NuxtError } from "#app"
defineProps<{ error: NuxtError }>()
</script>
