<template>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgb(180_190_254/0.3),transparent_50%)] animate-pulse-slow"
  ></div>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(245_169_184/0.3),transparent_50%)] animate-pulse-slow"
  ></div>
  <div
    class="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgb(238_212_159/0.2),transparent_50%)] animate-pulse-slow"
  ></div>
</template>

<style scoped>
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
</style>
