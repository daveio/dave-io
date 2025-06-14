<template>
  <div class="curl-section mb-8">
    <UCard class="bg-black/50 border-gray-700 shadow-2xl overflow-hidden">
      <div class="text-center p-4 font-mono text-white text-sm">
        <div class="text-lg font-extrabold mb-4 rainbow-gradient-text">Want to see this animated?</div>
        <div class="text-gray-300">
          <UButton
            variant="ghost"
            size="sm"
            class="font-mono bg-gray-800 hover:bg-gray-700 cursor-pointer"
            @click="copyCurlCommand"
            title="Click to copy to clipboard"
            icon="i-heroicons-clipboard"
          >
            curl https://dave.io | sh
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Import page logging functionality
const { logInteraction } = usePageLogging()

// Copy curl command to clipboard and track the action
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const copyCurlCommand = async () => {
  const command = "curl https://dave.io | sh"
  try {
    await navigator.clipboard.writeText(command)
    logInteraction("copy", "curl-command", { command })
  } catch (_err) {
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
    logInteraction("copy", "curl-command", { command, fallback: true })
  }
}
</script>

<style scoped>
.curl-section {
  margin-top: 10px;
}
</style>
