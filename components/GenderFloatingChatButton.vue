<template>
  <div class="fixed bottom-6 right-6 z-50 group">
    <button
      class="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      disabled title="Ask me about gender identity! (Coming Soon)">
      <Icon name="i-mdi-chat-question" class="w-6 h-6" />
      <!-- Tooltip -->
      <div
        class="absolute bottom-16 right-0 mb-2 px-3 py-2 bg-neutral-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none bg-surface2">
        Ask me about gender identity! (Coming Soon)
        <div
          class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-800">
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
// No props needed for this floating button
</script>
