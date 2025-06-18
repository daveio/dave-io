<template>
  <!-- trunk-ignore-all(trunk-toolbox/todo) -->
  <div class="mt-8">
    <div
      class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4">
      <!-- CV Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-document-text" class="font-bold mr-2 text-blue-400" />
          Check out my CV
        </span>
        <NuxtLink href="https://dave.io/go/cv" target="_blank" class="break-all link-url"
          @click="handleLinkClick('CV', 'https://dave.io/go/cv')">
          dave.io/go/cv
        </NuxtLink>
      </div>
      <!-- Key Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-key" class="font-bold mr-2 text-yellow-400" />
          <span class="max-md:hidden">Grab my public key</span>
          <span class="md:hidden">My public key</span>
        </span>
        <NuxtLink href="https://dave.io/go/key" target="_blank" class="break-all link-url"
          @click="handleLinkClick('CV', 'https://dave.io/go/key')">
          dave.io/go/key
        </NuxtLink>
      </div>
      <!-- TODO Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-list-bullet" class="font-bold mr-2 text-green-400" />
          Give me a TODO
        </span>
        <NuxtLink href="https://dave.io/go/todo" target="_blank" class="break-all link-url"
          @click="handleLinkClick('TODO', 'https://dave.io/go/todo')">
          dave.io/go/todo
        </NuxtLink>
      </div>
      <!-- Talk Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-microphone" class="font-bold mr-2 text-purple-400" />
          Enjoy this talk
        </span>
        <NuxtLink href="https://dave.io/go/wat" target="_blank" class="break-all link-url"
          @click="handleLinkClick('Talk', 'https://dave.io/go/wat')">
          dave.io/go/wat
        </NuxtLink>
      </div>
      <!-- Story Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-book-open" class="font-bold mr-2 text-indigo-400" />
          Read this story
        </span>
        <NuxtLink href="https://dave.io/go/blit" target="_blank" class="break-all link-url"
          @click="handleLinkClick('Story', 'https://dave.io/go/blit')">
          dave.io/go/blit
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality
const { logInteraction } = usePageLogging()

// Track link clicks
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const handleLinkClick = (service: string, url: string) => {
  logInteraction("click", "terminal-link", { service, url })
}
</script>
