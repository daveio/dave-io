<template>
  <UCard class="mb-8 border-2 border-dashed border-purple-400/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
    <div class="text-center py-6">
      <h3 class="text-2xl font-bold text-purple-300 mb-2">Ask A Robot. Robots Don't Judge.</h3>
      <p class="text-gray-300 mb-4">
        See that button at the bottom right? I'm working on an AI assistant to help answer your questions about gender
        identity, pronouns, creating inclusive spaces, and all that gender-adjacent junk. And there are even bigger
        plans in the works too...
      </p>
      <UButton color="purple" variant="outline" disabled>
        <UIcon name="i-mdi-robot-excited" class="mr-2" />
        Launch Chat (Coming Soon)
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
// No props needed for this placeholder component
</script>
