<template>
  <div class="mb-4">
    <div class="social-links-table">
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-bluesky" class="mr-2 text-sky-400 font-bold" />
          Bluesky
        </span>
        <ULink to="https://dave.io/go/bluesky" target="_blank" class="link-url"
          @click="handleLinkClick('Bluesky', 'https://dave.io/go/bluesky')">
          dave.io/go/bluesky
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-book-open" class="mr-2 text-green-400 font-bold" />
          Dreamwidth
        </span>
        <ULink to="https://dave.io/go/dreamwidth" target="_blank" class="link-url"
          @click="handleLinkClick('Dreamwidth', 'https://dave.io/go/dreamwidth')">
          dave.io/go/dreamwidth
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-facebook" class="mr-2 text-blue-500 font-bold" />
          Facebook
        </span>
        <ULink to="https://dave.io/go/facebook" target="_blank" class="link-url"
          @click="handleLinkClick('Facebook', 'https://dave.io/go/facebook')">
          dave.io/go/facebook
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-github" class="mr-2 text-gray-300 font-bold" />
          GitHub
        </span>
        <ULink to="https://dave.io/go/github" target="_blank" class="link-url"
          @click="handleLinkClick('GitHub', 'https://dave.io/go/github')">
          dave.io/go/github
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-instagram" class="mr-2 text-pink-400 font-bold" />
          Instagram
        </span>
        <ULink to="https://dave.io/go/instagram" target="_blank" class="link-url"
          @click="handleLinkClick('Instagram', 'https://dave.io/go/instagram')">
          dave.io/go/instagram
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-linkedin" class="mr-2 text-blue-600 font-bold" />
          LinkedIn
        </span>
        <ULink to="https://dave.io/go/linkedin" target="_blank" class="link-url"
          @click="handleLinkClick('LinkedIn', 'https://dave.io/go/linkedin')">
          dave.io/go/linkedin
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-mastodon" class="mr-2 text-purple-400 font-bold" />
          Mastodon
        </span>
        <ULink to="https://dave.io/go/mastodon" target="_blank" class="link-url"
          @click="handleLinkClick('Mastodon', 'https://dave.io/go/mastodon')">
          dave.io/go/mastodon
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="mr-2 text-indigo-400 font-bold" />
          Pillowfort
        </span>
        <ULink to="https://dave.io/go/pillowfort" target="_blank" class="link-url"
          @click="handleLinkClick('Pillowfort', 'https://dave.io/go/pillowfort')">
          dave.io/go/pillowfort
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-threads" class="mr-2 text-gray-300 font-bold" />
          Threads
        </span>
        <ULink to="https://dave.io/go/threads" target="_blank" class="link-url"
          @click="handleLinkClick('Threads', 'https://dave.io/go/threads')">
          dave.io/go/threads
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-tumblr" class="mr-2 text-blue-400 font-bold" />
          Tumblr
        </span>
        <ULink to="https://dave.io/go/tumblr" target="_blank" class="link-url"
          @click="handleLinkClick('Tumblr', 'https://dave.io/go/tumblr')">
          dave.io/go/tumblr
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-simple-icons-youtube" class="mr-2 text-red-500 font-bold" />
          YouTube
        </span>
        <ULink to="https://dave.io/go/youtube" target="_blank" class="link-url"
          @click="handleLinkClick('YouTube', 'https://dave.io/go/youtube')">
          dave.io/go/youtube
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-x-mark" class="mr-2 text-gray-400 font-bold" />
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

<style scoped>
.social-links-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.links-row {
  display: contents;
}

.link-name {
  font-weight: 500;
  text-align: right;
  padding-right: 5px;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
}

.link-url {
  word-break: break-all;
}

@media (max-width: 800px) {
  .social-links-table {
    grid-template-columns: 0.7fr 1.2fr;
    font-size: 0.95em;
    max-width: 100%;
    gap: 0.5rem 1rem;
  }

  .link-name,
  .link-url {
    min-width: 0;
    word-break: break-all;
  }
}
</style>
