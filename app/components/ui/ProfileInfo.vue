<template>
  <div class="mb-4">
    <div
      class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto pb-4 max-md:grid-cols-[0.7fr_1.2fr] max-md:text-sm max-md:max-w-full">
      <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
        <i class="i-mdi-light-gender-transgender mr-2 text-green w-5 h-5"/>
        Pronouns
      </span>
      <NuxtLink to="/gender" class="link-gender break-all" @click="handleLinkClick('gender', 'https://dave.io/gender')">
        they/them (learn more)
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality

// Track link clicks
const handleLinkClick = (_service: string, _url: string) => {
}
</script>
