<template>
  <div>
    <div class="text-center space-y-6">
      <div class="bg-surface0/80 border border-surface2 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
        <Icon name="i-mdi-shield-check" class="text-green w-16 h-16 mx-auto mb-4" />
        <h2 class="text-text font-bold text-2xl mb-4">Access Granted!</h2>
        <p class="text-subtext0 leading-relaxed">
          This page is protected by the access control middleware. Since the condition currently returns
          <code class="bg-surface1 px-2 py-1 rounded">true</code>, you can see this content.
        </p>
      </div>

      <div class="bg-surface1/60 border border-surface2 rounded-lg p-6 backdrop-blur-sm">
        <h3 class="text-text font-semibold text-lg mb-3">How to expand this middleware:</h3>
        <ul class="text-subtext0 text-left space-y-2">
          <li>• Add real authentication checks</li>
          <li>• Check user permissions or roles</li>
          <li>• Validate session tokens</li>
          <li>• Implement feature flags</li>
          <li>• Add time-based access controls</li>
        </ul>
      </div>

      <BackToHomeButton from="protected-example" />
    </div>
  </div>
</template>

<script setup lang="ts">
import BackToHomeButton from "~/components/shared/BackToHomeButton.vue"

// Apply the access control middleware to this page
definePageMeta({
  middleware: "protection"
})

usePageSetup({
  title: "pandorica",
  keywords: ["access control", "middleware", "protected", "authentication", "example"],
  description: "Example of a page protected by access control middleware"
})

onMounted(() => {
  // Protected page mounted successfully - no logging needed in production
})
</script>
