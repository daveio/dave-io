<template>
  <div class="mb-4">
    <div class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto max-md:grid-cols-[0.7fr_1.2fr] max-md:text-sm max-md:max-w-full">
      <!-- Bluesky -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-bluesky" class="mr-2 text-sky-400 font-bold" />
          Bluesky
        </span>
        <NuxtLink
          href="https://dave.io/go/bluesky"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Bluesky', 'https://dave.io/go/bluesky')"
        >
          dave.io/go/bluesky
        </NuxtLink>
      </div>
      <!-- Dreamwidth -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-book-open" class="mr-2 text-green-400 font-bold" />
          Dreamwidth
        </span>
        <NuxtLink
          href="https://dave.io/go/dreamwidth"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Dreamwidth', 'https://dave.io/go/dreamwidth')"
        >
          dave.io/go/dreamwidth
        </NuxtLink>
      </div>
      <!-- Facebook -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-facebook" class="mr-2 text-blue-500 font-bold" />
          Facebook
        </span>
        <NuxtLink
          href="https://dave.io/go/facebook"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Facebook', 'https://dave.io/go/facebook')"
        >
          dave.io/go/facebook
        </NuxtLink>
      </div>
      <!-- GitHub -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-github" class="mr-2 text-neutral-300 font-bold" />
          GitHub
        </span>
        <NuxtLink
          href="https://dave.io/go/github"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('GitHub', 'https://dave.io/go/github')"
        >
          dave.io/go/github
        </NuxtLink>
      </div>
      <!-- Instagram -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-instagram" class="mr-2 text-pink-400 font-bold" />
          Instagram
        </span>
        <NuxtLink
          href="https://dave.io/go/instagram"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Instagram', 'https://dave.io/go/instagram')"
        >
          dave.io/go/instagram
        </NuxtLink>
      </div>
      <!-- LinkedIn -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-linkedin" class="mr-2 text-blue-600 font-bold" />
          LinkedIn
        </span>
        <NuxtLink
          href="https://dave.io/go/linkedin"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('LinkedIn', 'https://dave.io/go/linkedin')"
        >
          dave.io/go/linkedin
        </NuxtLink>
      </div>
      <!-- Mastodon -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-mastodon" class="mr-2 text-purple-400 font-bold" />
          Mastodon
        </span>
        <NuxtLink
          href="https://dave.io/go/mastodon"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Mastodon', 'https://dave.io/go/mastodon')"
        >
          dave.io/go/mastodon
        </NuxtLink>
      </div>
      <!-- Pillowfort -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2 text-indigo-400 font-bold" />
          Pillowfort
        </span>
        <NuxtLink
          href="https://dave.io/go/pillowfort"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Pillowfort', 'https://dave.io/go/pillowfort')"
        >
          dave.io/go/pillowfort
        </NuxtLink>
      </div>
      <!-- Threads -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-threads" class="mr-2 text-gray-300 font-bold" />
          Threads
        </span>
        <NuxtLink
          href="https://dave.io/go/threads"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Threads', 'https://dave.io/go/threads')"
        >
          dave.io/go/threads
        </NuxtLink>
      </div>
      <!-- Tumblr -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-tumblr" class="mr-2 text-blue-400 font-bold" />
          Tumblr
        </span>
        <NuxtLink
          href="https://dave.io/go/tumblr"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('Tumblr', 'https://dave.io/go/tumblr')"
        >
          dave.io/go/tumblr
        </NuxtLink>
      </div>
      <!-- YouTube -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-youtube" class="mr-2 text-red-500 font-bold" />
          YouTube
        </span>
        <NuxtLink
          href="https://dave.io/go/youtube"
          target="_blank"
          class="break-all link-url"
          @click="handleLinkClick('YouTube', 'https://dave.io/go/youtube')"
        >
          dave.io/go/youtube
        </NuxtLink>
      </div>
      <!-- Twitter -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-x-mark" class="mr-2 text-gray-400 font-bold" />
          Twitter
        </span>
        <span class="text-gray-500">Nope.</span>
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