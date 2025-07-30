<template>
  <!-- trunk-ignore-all(trunk-toolbox/todo) -->
  <div class="mt-8 mb-3">
    <div
      class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4">
      <!-- API Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-cog" class="font-bold mr-2 text-peach" />
          About the API
        </span>
        <NuxtLink href="/api" class="break-all link-url text-peach" @click="handleLinkClick('API', '/api')">
          dave.io/api
        </NuxtLink>
      </div>
    </div>
  </div>
  <div class="mt-8">
    <div
      class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4">
      <!-- CV Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-document-text" class="font-bold mr-2 text-blue-400" />
          Check out my CV
        </span>
        <NuxtLink href="/go/cv" class="break-all link-url" @click="handleLinkClick('CV', '/go/cv')">
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
        <NuxtLink href="/go/key" class="break-all link-url" @click="handleLinkClick('CV', '/go/key')">
          dave.io/go/key
        </NuxtLink>
      </div>
      <!-- TODO Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-list-bullet" class="font-bold mr-2 text-green-400" />
          Give me a TODO
        </span>
        <NuxtLink href="/go/todo" class="break-all link-url" @click="handleLinkClick('TODO', '/go/todo')">
          dave.io/go/todo
        </NuxtLink>
      </div>
      <!-- Talk Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-microphone" class="font-bold mr-2 text-purple-400" />
          Enjoy this talk
        </span>
        <NuxtLink href="/go/wat" class="break-all link-url" @click="handleLinkClick('Talk', '/go/wat')">
          dave.io/go/wat
        </NuxtLink>
      </div>
      <!-- Story Link -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-book-open" class="font-bold mr-2 text-indigo-400" />
          Read this story
        </span>
        <NuxtLink href="/go/blit" class="break-all link-url" @click="handleLinkClick('Story', '/go/blit')">
          dave.io/go/blit
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality

// Track link clicks
const handleLinkClick = (_service: string, _url: string) => {
}
</script>
