<script setup lang="ts">
useHead({
  title: 'MU/TH/UR 6000 — Password Generation Subsystem',
  htmlAttrs: { lang: 'en' },
})

const {
  wordCount,
  capitalize,
  appendSuffix,
  password,
  strength,
  copied,
  generate,
  copyToClipboard,
} = usePasswordGenerator()
</script>

<template>
  <div class="min-h-screen bg-base-100 flex flex-col">
    <HeaderBar />

    <main class="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
      <!-- Danger warning -->
      <WarningLabel
        type="danger"
        text="Store credentials in secure location — unauthorized access subject to corporate disciplinary action"
      />

      <!-- Password display -->
      <PasswordDisplay
        :password="password"
        :copied="copied"
        @copy="copyToClipboard"
        @regenerate="generate"
      />

      <!-- Controls -->
      <PasswordControls
        v-model:word-count="wordCount"
        v-model:capitalize="capitalize"
        v-model:append-suffix="appendSuffix"
      />

      <!-- Strength meter -->
      <StrengthMeter :strength="strength" />

      <!-- Additional warnings for flavor -->
      <div class="space-y-2 pt-2">
        <WarningLabel
          type="notice"
          text="Generated passphrases use cryptographically secure randomness"
        />
        <WarningLabel
          type="caution"
          text="Do not reuse credentials across multiple systems"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t-2 border-base-300">
      <div class="hazard-stripe h-1" />
      <div class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-2">
        <div class="text-[9px] tracking-[0.25em] uppercase text-base-content/30">
          USCSS Nostromo — Commercial Towing Vehicle — Crew: 7
        </div>
        <div class="text-[9px] tracking-[0.25em] uppercase text-base-content/20">
          Interface 2037 by Weyland-Yutani Corp
        </div>
      </div>
    </footer>
  </div>
</template>
