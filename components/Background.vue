<template>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse-slow"
  ></div>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)] animate-pulse-slow"
  ></div>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(255,198,119,0.2),transparent_50%)] animate-pulse-slow"
  ></div>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 0.4;
  }
}
</style>
