<template>
  <div class="min-h-screen flex items-center justify-center bg-black">
    <div class="bg-black border-green-400 border-2 rounded-lg p-6 shadow-xl">
      <div class="text-center">
        <img src="/gifs/nedry.gif" alt="You didn't say the magic word" class="mx-auto max-w-lg w-full h-auto" />
        <div class="mt-6 bg-black border-green-400 border rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <Icon name="i-mdi-skull" class="text-green-400 w-5 h-5 mt-0.5 flex-shrink-0" />
            <div class="text-left">
              <h3 class="text-green-400 font-semibold">Access Denied</h3>
              <p class="text-neutral-300 mt-1">You didn't say the magic word!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: "Access Denied - Dave.io",
  meta: [{ name: "description", content: "You didn't say the magic word!" }]
})

// Page logging
const { logPageVisit } = usePageLogging()

onMounted(() => {
  // Log page visit to access denied page
  logPageVisit("/go", {
    title: "Access Denied",
    theme: "jurassic-park",
    reason: "no-magic-word"
  })
})
</script>
