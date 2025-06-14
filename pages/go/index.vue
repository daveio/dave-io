<template>
  <div class="min-h-screen flex items-center justify-center bg-black">
    <UCard class="bg-black border-green-400 border-2">
      <div class="text-center">
        <img src="/gifs/nedry.gif" alt="You didn't say the magic word" class="mx-auto max-w-lg w-full h-auto" />
        <UAlert
          color="error"
          variant="soft"
          title="Access Denied"
          description="You didn't say the magic word!"
          class="mt-6 bg-black border-green-400"
        >
          <template #icon>
            <UIcon name="i-mdi-skull" class="text-green-400" />
          </template>
        </UAlert>
      </div>
    </UCard>
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
