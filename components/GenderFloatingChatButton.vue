<template>
  <div class="fixed bottom-6 right-6 z-50">
    <UTooltip text="Ask me about gender identity! (Coming Soon)" :popper="{ placement: 'top' }">
      <UButton color="primary" size="xl" icon="i-mdi-chat-question" rounded="full"
        class="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse"
        disabled />
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
// No props needed for this floating button
</script>
