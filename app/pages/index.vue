<template>
  <div>
    <div class="pt-4 mb-4 flex flex-col items-center">
      <div
        class="rounded-xl p-0.5 w-[420px] h-[70px] flex items-center justify-center bg-rainbow-gradient max-md:w-[98vw] max-md:min-w-0 max-md:max-w-full max-md:h-[60px] max-md:text-base"
      >
        <div class="bg-[#111] rounded-[10px] w-full h-full flex items-center justify-center">
          <span class="font-bold text-lg text-white">Dave Williams</span>
        </div>
      </div>
      <div
        class="text-center text-xl font-extrabold rainbow-gradient-text mb-4 flex items-center justify-center gap-2 pt-4"
      >
        <Icon name="i-heroicons-rocket-launch" class="text-orange-400" />
        <span class="max-md:hidden">Weapons-grade DevOps engineer, developer, and tinkerer</span>
        <span class="md:hidden text-sm">Weapons-grade engineer and tinkerer</span>
        <Icon name="i-heroicons-rocket-launch" class="text-orange-400" />
      </div>
    </div>
    <div class="mb-4">
      <div
        class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto pb-4 max-md:grid-cols-[0.7fr_1.2fr] max-md:text-sm max-md:max-w-full"
      >
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <i class="i-mdi-light-gender-transgender mr-2 text-green w-5 h-5" />
          Email
        </span>
        <Email />
      </div>
    </div>
    <div class="mb-4">
      <div
        class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto pb-4 max-md:grid-cols-[0.7fr_1.2fr] max-md:text-sm max-md:max-w-full"
      >
        <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
          <i class="i-mdi-light-gender-transgender mr-2 text-green w-5 h-5" />
          Pronouns
        </span>
        <NuxtLink to="/gender" class="link-gender break-all"> they/them (learn more) </NuxtLink>
      </div>
    </div>
    <div class="mb-4">
      <div
        class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4"
      >
        <!-- API Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-cog" class="font-bold mr-2 text-peach" />
            About the API
          </span>
          <NuxtLink href="/api" class="break-all link-url text-peach"> dave.io/api </NuxtLink>
        </div>
      </div>
    </div>
    <div class="mb-8">
      <div
        class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4"
      >
        <!-- TODO Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-list-bullet" class="font-bold mr-2 text-violet-400" />
            Give me a TODO
          </span>
          <NuxtLink href="/todo" class="break-all link-url text-violet-400"> dave.io/todo </NuxtLink>
        </div>
      </div>
    </div>
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
          <NuxtLink href="/go/bluesky" class="break-all link-url"> dave.io/go/bluesky </NuxtLink>
        </div>
        <!-- Dreamwidth -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-book-open" class="mr-2 text-green font-bold" />
            Dreamwidth
          </span>
          <NuxtLink href="/go/dreamwidth" class="break-all link-url"> dave.io/go/dreamwidth </NuxtLink>
        </div>
        <!-- Facebook -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-facebook" class="mr-2 text-blue font-bold" />
            Facebook
          </span>
          <NuxtLink href="/go/facebook" class="break-all link-url"> dave.io/go/facebook </NuxtLink>
        </div>
        <!-- GitHub -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-github" class="mr-2 text-subtext1 font-bold" />
            GitHub
          </span>
          <NuxtLink href="/go/github" class="break-all link-url"> dave.io/go/github </NuxtLink>
        </div>
        <!-- Instagram -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-instagram" class="mr-2 text-pink font-bold" />
            Instagram
          </span>
          <NuxtLink href="/go/instagram" class="break-all link-url"> dave.io/go/instagram </NuxtLink>
        </div>
        <!-- LinkedIn -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-linkedin" class="mr-2 text-blue font-bold" />
            LinkedIn
          </span>
          <NuxtLink href="/go/linkedin" class="break-all link-url"> dave.io/go/linkedin </NuxtLink>
        </div>
        <!-- Mastodon -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-mastodon" class="mr-2 text-mauve font-bold" />
            Mastodon
          </span>
          <NuxtLink href="/go/mastodon" class="break-all link-url"> dave.io/go/mastodon </NuxtLink>
        </div>
        <!-- Pillowfort -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2 text-lavender font-bold" />
            Pillowfort
          </span>
          <NuxtLink href="/go/pillowfort" class="break-all link-url"> dave.io/go/pillowfort </NuxtLink>
        </div>
        <!-- Threads -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-threads" class="mr-2 text-subtext1 font-bold" />
            Threads
          </span>
          <NuxtLink href="/go/threads" class="break-all link-url"> dave.io/go/threads </NuxtLink>
        </div>
        <!-- Tumblr -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-tumblr" class="mr-2 text-sapphire font-bold" />
            Tumblr
          </span>
          <NuxtLink href="/go/tumblr" class="break-all link-url"> dave.io/go/tumblr </NuxtLink>
        </div>
        <!-- YouTube -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-simple-icons-youtube" class="mr-2 text-red font-bold" />
            YouTube
          </span>
          <NuxtLink href="/go/youtube" class="break-all link-url"> dave.io/go/youtube </NuxtLink>
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
    <!-- trunk-ignore-all(trunk-toolbox/todo) -->
    <div class="mt-8">
      <div
        class="grid grid-cols-2 gap-y-2 gap-x-4 max-w-3xl mx-auto md:gap-x-4 max-md:text-sm max-md:max-w-full max-md:pl-4"
      >
        <!-- CV Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-document-text" class="font-bold mr-2 text-blue-400" />
            Check out my CV
          </span>
          <NuxtLink href="/go/cv" class="break-all link-url"> dave.io/go/cv </NuxtLink>
        </div>
        <!-- Key Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-key" class="font-bold mr-2 text-yellow-400" />
            <span class="max-md:hidden">Grab my public key</span>
            <span class="md:hidden">My public key</span>
          </span>
          <NuxtLink href="/go/key" class="break-all link-url"> dave.io/go/key </NuxtLink>
        </div>
        <!-- Talk Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-microphone" class="font-bold mr-2 text-purple-400" />
            Enjoy this talk
          </span>
          <NuxtLink href="/go/wat" class="break-all link-url"> dave.io/go/wat </NuxtLink>
        </div>
        <!-- Story Link -->
        <div class="contents">
          <span class="font-medium text-right pr-1 inline-flex justify-end items-center">
            <Icon name="i-heroicons-book-open" class="font-bold mr-2 text-indigo-400" />
            Read this story
          </span>
          <NuxtLink href="/go/blit" class="break-all link-url"> dave.io/go/blit </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Email from "~/components/shared/Email.vue"
import { logger } from "@sentry/nuxt"

usePageSetup({
  title: "home"
})

definePageMeta({
  layoutProps: {
    showHero: true,
    showCurlCommand: true,
    useMonospace: true
  }
})

onMounted(() => {
  logger.info("Page mounted", { log_source: "/" })
})
</script>
