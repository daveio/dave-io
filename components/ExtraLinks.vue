<template>
  <div class="mt-8">
    <div class="extra-links-table">
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-document-text" class="font-bold mr-2 text-blue-400" />
          Check out my CV
        </span>
        <ULink to="https://dave.io/go/cv" target="_blank" class="link-url"
          @click="handleLinkClick('CV', 'https://dave.io/go/cv')">
          dave.io/go/cv
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-key" class="font-bold mr-2 text-yellow-400" />
          <span class="key-text">Grab my public key</span>
        </span>
        <ULink to="https://dave.io/go/key" target="_blank" class="link-url"
          @click="handleLinkClick('CV', 'https://dave.io/go/key')">
          dave.io/go/key
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-list-bullet" class="font-bold mr-2 text-green-400" />
          Give me a TODO
        </span>
        <ULink to="https://dave.io/go/todo" target="_blank" class="link-url"
          @click="handleLinkClick('TODO', 'https://dave.io/go/todo')">
          dave.io/go/todo
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-microphone" class="font-bold mr-2 text-purple-400" />
          Enjoy this talk
        </span>
        <ULink to="https://dave.io/go/wat" target="_blank" class="link-url"
          @click="handleLinkClick('Talk', 'https://dave.io/go/wat')">
          dave.io/go/wat
        </ULink>
      </div>
      <div class="links-row">
        <span class="link-name">
          <UIcon name="i-heroicons-book-open" class="font-bold mr-2 text-indigo-400" />
          Read this story
        </span>
        <ULink to="https://dave.io/go/blit" target="_blank" class="link-url"
          @click="handleLinkClick('Story', 'https://dave.io/go/blit')">
          dave.io/go/blit
        </ULink>
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
.extra-links-table {
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
  .extra-links-table {
    grid-template-columns: 1fr 1fr;
    font-size: 0.95em;
    max-width: 100%;
    gap: 0.5rem 1rem;
    padding-left: 1rem;
  }

  .link-name,
  .link-url {
    min-width: 0;
    word-break: break-all;
  }

  .key-text {
    font-size: 0;
    line-height: 0;
  }

  .key-text::after {
    content: "My public key";
    font-size: 13.3px;
    line-height: normal;
  }
}

/* Desktop text (show original) */
@media (min-width: 801px) {
  .key-text {
    font-size: inherit;
    line-height: inherit;
  }

  .key-text::after {
    display: none;
  }
}
</style>
