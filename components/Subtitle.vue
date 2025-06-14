<template>
  <div class="pt-4 mb-4 flex flex-col items-center">
    <div class="gradient-border-box mb-4">
      <div class="box-content flex items-center justify-center h-full w-full">
        <span class="font-bold text-lg text-white">Dave Williams</span>
      </div>
    </div>
    <div
      class="text-center text-xl font-extrabold rainbow-gradient-text mb-4 flex items-center justify-center gap-2 pt-4"
    >
      <UIcon name="i-heroicons-rocket-launch" class="text-orange-400" />
      <span class="tagline-text">Weapons-grade DevOps engineer, developer, and tinkerer</span>
      <UIcon name="i-heroicons-rocket-launch" class="text-orange-400" />
    </div>
  </div>
</template>

<style scoped>
.gradient-border-box {
  border-radius: 12px;
  padding: 2px;
  width: 420px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f87171, #f472b6);
}

.box-content {
  background: #111;
  border-radius: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 800px) {
  .gradient-border-box {
    width: 98vw;
    min-width: 0;
    max-width: 100%;
    height: 60px;
    font-size: 1rem;
  }

  /* Mobile text replacements using pseudoelements */
  .tagline-text {
    font-size: 0;
    line-height: 0;
  }

  .tagline-text::after {
    content: "Weapons-grade engineer and tinkerer";
    font-size: 0.8rem;
    line-height: 1.5rem;
    font-weight: 800;
    background: linear-gradient(90deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

/* Desktop text (show original) */
@media (min-width: 801px) {
  .tagline-text {
    font-size: inherit;
    line-height: inherit;
  }

  .tagline-text::after {
    display: none;
  }
}
</style>
