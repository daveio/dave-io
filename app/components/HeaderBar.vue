<template>
  <header class="border-b-2 border-base-300">
    <!-- Hazard stripe top bar -->
    <div class="hazard-stripe h-1.5" />

    <!-- Weyland-Yutani branding -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-base-300/50">
      <div class="text-[10px] tracking-[0.3em] uppercase text-base-content/40">
        Weyland-Yutani Corporation — Building Better Worlds
      </div>
      <div class="text-[10px] tracking-[0.2em] uppercase text-base-content/30">
        CREW ACCESS TERMINAL
      </div>
    </div>

    <!-- Main title -->
    <div class="px-4 py-4 sm:py-6">
      <div class="text-[10px] tracking-[0.25em] uppercase text-secondary/60 mb-1">
        USCSS Nostromo — Reg. 180924609
      </div>
      <h1 class="text-xl sm:text-2xl tracking-[0.15em] uppercase text-primary glow-amber crt-flicker">
        MU/TH/UR 6000
      </h1>
      <div class="text-xs tracking-[0.2em] uppercase text-base-content/50 mt-1">
        Password Generation Subsystem v2.4.1
      </div>
    </div>

    <!-- Status bar -->
    <div class="flex gap-4 px-4 py-1.5 border-t border-base-300/50 text-[10px] tracking-[0.15em] uppercase">
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-1.5 h-1.5 bg-success animate-pulse" />
        <span class="text-success/70">System Online</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-1.5 h-1.5 bg-primary" />
        <span class="text-base-content/40">Security Protocol Active</span>
      </div>
      <div class="hidden sm:flex items-center gap-1.5">
        <span class="inline-block w-1.5 h-1.5 bg-secondary" />
        <span class="text-base-content/40">Entropy Source: Nominal</span>
      </div>
    </div>
  </header>
</template>
