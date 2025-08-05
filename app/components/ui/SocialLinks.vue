<template>
  <div class="mb-4">
    <div
      class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto max-md:grid-cols-[0.7fr_1.2fr] max-md:text-sm max-md:max-w-full"
    >
      <!-- Bluesky -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-bluesky" class="mr-2 text-sky font-bold" />
          Bluesky
        </span>
        <NuxtLink href="/go/bluesky" class="break-all link-url" @click="handleLinkClick('Bluesky', '/go/bluesky')">
          dave.io/go/bluesky
        </NuxtLink>
      </div>
      <!-- Dreamwidth -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-book-open" class="mr-2 text-green font-bold" />
          Dreamwidth
        </span>
        <NuxtLink
          href="/go/dreamwidth"
          class="break-all link-url"
          @click="handleLinkClick('Dreamwidth', '/go/dreamwidth')"
        >
          dave.io/go/dreamwidth
        </NuxtLink>
      </div>
      <!-- Facebook -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-facebook" class="mr-2 text-blue font-bold" />
          Facebook
        </span>
        <NuxtLink href="/go/facebook" class="break-all link-url" @click="handleLinkClick('Facebook', '/go/facebook')">
          dave.io/go/facebook
        </NuxtLink>
      </div>
      <!-- GitHub -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-github" class="mr-2 text-subtext1 font-bold" />
          GitHub
        </span>
        <NuxtLink href="/go/github" class="break-all link-url" @click="handleLinkClick('GitHub', '/go/github')">
          dave.io/go/github
        </NuxtLink>
      </div>
      <!-- Instagram -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-instagram" class="mr-2 text-pink font-bold" />
          Instagram
        </span>
        <NuxtLink
          href="/go/instagram"
          class="break-all link-url"
          @click="handleLinkClick('Instagram', '/go/instagram')"
        >
          dave.io/go/instagram
        </NuxtLink>
      </div>
      <!-- LinkedIn -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-linkedin" class="mr-2 text-blue font-bold" />
          LinkedIn
        </span>
        <NuxtLink href="/go/linkedin" class="break-all link-url" @click="handleLinkClick('LinkedIn', '/go/linkedin')">
          dave.io/go/linkedin
        </NuxtLink>
      </div>
      <!-- Mastodon -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-mastodon" class="mr-2 text-mauve font-bold" />
          Mastodon
        </span>
        <NuxtLink href="/go/mastodon" class="break-all link-url" @click="handleLinkClick('Mastodon', '/go/mastodon')">
          dave.io/go/mastodon
        </NuxtLink>
      </div>
      <!-- Pillowfort -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2 text-lavender font-bold" />
          Pillowfort
        </span>
        <NuxtLink
          href="/go/pillowfort"
          class="break-all link-url"
          @click="handleLinkClick('Pillowfort', '/go/pillowfort')"
        >
          dave.io/go/pillowfort
        </NuxtLink>
      </div>
      <!-- Threads -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-threads" class="mr-2 text-subtext1 font-bold" />
          Threads
        </span>
        <NuxtLink href="/go/threads" class="break-all link-url" @click="handleLinkClick('Threads', '/go/threads')">
          dave.io/go/threads
        </NuxtLink>
      </div>
      <!-- Tumblr -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-tumblr" class="mr-2 text-sapphire font-bold" />
          Tumblr
        </span>
        <NuxtLink href="/go/tumblr" class="break-all link-url" @click="handleLinkClick('Tumblr', '/go/tumblr')">
          dave.io/go/tumblr
        </NuxtLink>
      </div>
      <!-- YouTube -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-simple-icons-youtube" class="mr-2 text-red font-bold" />
          YouTube
        </span>
        <NuxtLink href="/go/youtube" class="break-all link-url" @click="handleLinkClick('YouTube', '/go/youtube')">
          dave.io/go/youtube
        </NuxtLink>
      </div>
      <!-- Twitter -->
      <div class="contents">
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <Icon name="i-heroicons-x-mark" class="mr-2 text-subtext0 font-bold" />
          Twitter
        </span>
        <span class="text-subtext0">Nope.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality

// Track link clicks
const handleLinkClick = (_service: string, _url: string) => {}
</script>
