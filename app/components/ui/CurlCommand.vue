<template>
  <div class="curl-section mb-8">
    <div class="bg-surface0/50 border border-surface2 shadow-2xl overflow-hidden rounded-lg">
      <div class="text-center p-4 font-mono text-text text-sm">
        <div class="text-lg font-extrabold mb-4 rainbow-gradient-text">Want to see this animated?</div>
        <div class="text-subtext1">
          <button
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-mono bg-surface1 hover:bg-surface2 rounded-md transition-colors cursor-pointer"
            title="Click to copy to clipboard" @click="copyCurlCommand">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
stroke-linecap="round" stroke-linejoin="round"
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            curl https://dave.io | sh
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality

// Copy curl command to clipboard and track the action
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
.curl-section {
  margin-top: 10px;
}
</style>
