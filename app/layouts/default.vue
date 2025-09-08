<template>
  <div
    class="min-h-screen bg-gradient-to-br from-base via-mantle to-base flex flex-col justify-center py-12 px-4 relative overflow-hidden wrapper-all"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgb(180_190_254/0.3),transparent_50%)] animate-pulse-slow"
    />
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(245_169_184/0.3),transparent_50%)] animate-pulse-slow"
    />
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgb(238_212_159/0.2),transparent_50%)] animate-pulse-slow"
    />
    <div class="max-w-3xl mx-auto w-full relative z-10">
      <div>
        <div v-if="showHero" class="text-center mb-8">
          <div class="mb-4">
            <h1 class="text-5xl font-bold bg-rainbow-gradient bg-clip-text text-transparent mb-2 font-display">
              dave.io
            </h1>
            <div class="mt-6 h-1 w-32 bg-gradient-to-r from-blue to-mauve mx-auto rounded-full" />
          </div>
          <span class="font-subtitle text-md sm:text-lg font-light text-subtext1">
            because "just a website" is boring
          </span>
        </div>
        <div
          ref="interfaceContainer"
          class="pb-6 card border border-surface2 shadow-2xl backdrop-blur-sm w-full terminal-container flex flex-col rounded-lg bg-surface0/50"
        >
          <!-- Interface header with window controls -->
          <div
            class="terminal-header flex items-center justify-start px-4 py-2 bg-surface1/95 backdrop-blur-sm border-b border-surface2 sticky top-0 z-10 rounded-t-lg"
          >
            <div class="flex space-x-2">
              <div class="w-3 h-3 rounded-full bg-red" />
              <div class="w-3 h-3 rounded-full bg-yellow" />
              <div class="w-3 h-3 rounded-full bg-green animate-pulse" />
            </div>
            <div class="text-center flex-1 text-sm text-subtext0 font-mono">
              {{ title || "dave.io" }} ::
              <NuxtLink v-if="showFishLink" to="https://github.com/fish-shell/fish-shell" class="link-url">
                fish</NuxtLink
              >
              <span v-if="!showFishLink">{{ subtitle }}</span> ::
              {{ dimensions || "13×37" }}
            </div>
          </div>

          <!-- Interface content - scrollable -->
          <div
            ref="interfaceContent"
            :class="['terminal-content text-text p-4 text-sm flex-1 overflow-y-auto', useMonospace ? 'font-mono' : '']"
          >
            <slot />
          </div>
        </div>
      </div>
      <div class="curl-section mb-8">
        <div v-if="showCurlCommand" class="bg-surface0/50 border border-surface2 shadow-2xl overflow-hidden rounded-lg">
          <div class="text-center p-4 font-mono text-text text-sm">
            <div class="text-lg font-extrabold mb-4 rainbow-gradient-text">Want to see this animated?</div>
            <div class="text-subtext1">
              <button
                class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-mono bg-surface1 hover:bg-surface2 rounded-md transition-colors cursor-pointer"
                title="Click to copy to clipboard"
                @click="copyCurlCommand"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                curl https://dave.io | sh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  dimensions?: string
  showCurlCommand?: boolean
  showEmail?: boolean
  showFishLink?: boolean
  showHero?: boolean
  subtitle?: string
  title?: string
  useMonospace?: boolean
}

withDefaults(defineProps<Props>(), {
  title: "dave.io",
  subtitle: "because 'just a website' is boring",
  dimensions: "13×37",
  showFishLink: true,
  showHero: false,
  showCurlCommand: false,
  showEmail: true,
  useMonospace: false
})

usePageSetup({
  title: "home",
  keywords: [
    "dave.io",
    "Dave Williams",
    "personal site",
    "portfolio",
    "blog",
    "projects",
    "web development",
    "programming",
    "technology",
    "software engineer"
  ],
  description: "Personal site of Dave Williams",
  image: "/images/social.webp"
})

const copyCurlCommand = async () => {
  const command = "curl https://dave.io | sh"
  try {
    await navigator.clipboard.writeText(command)
  } catch {
    // Fallback for older browsers or when clipboard API fails
    const textArea = document.createElement("textarea")
    textArea.value = command
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand("copy")
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
</script>

<style scoped>
.terminal-container {
  max-height: 90vh;
}

.terminal-content {
  max-height: calc(90vh - 3rem);
  /* Subtract header height */
}

@media (max-width: 800px) {
  .terminal-container {
    min-height: auto;
    max-height: none;
    border-radius: 0.75rem;
  }

  .terminal-content {
    padding: 1rem 0.5rem;
    max-height: none;
  }
}

.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 0.4;
  }
}

.curl-section {
  margin-top: 10px;
}
</style>
