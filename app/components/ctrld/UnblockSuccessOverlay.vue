<template>
  <Teleport to="body">
    <Transition name="overlay" @after-enter="startAutoClose" @before-leave="clearAutoClose">
      <div v-if="isVisible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-base/95 backdrop-blur-sm">
        <div class="max-w-4xl mx-auto p-8 text-center">
          <!-- Success icon -->
          <div class="mb-8 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-32 w-32 text-success animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Main message -->
          <div class="alert alert-success mb-8">
            <div class="text-3xl font-bold">
              Success! The website has been unblocked{{ permanent ? " permanently" : " for 15 minutes" }}.
            </div>
          </div>

          <!-- Instructions - Extra large and clear -->
          <div class="space-y-6 text-left">
            <h2 class="text-4xl font-bold text-center mb-8">Important: Follow these steps</h2>

            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex items-start gap-6">
                  <div class="badge badge-primary badge-lg text-2xl p-6">1</div>
                  <div class="flex-1">
                    <h3 class="text-3xl font-bold mb-2">Quit Your Browser Completely</h3>
                    <p class="text-2xl text-subtext0">
                      Don't just close this window - completely quit your browser application.
                    </p>
                    <div class="mt-4 p-4 bg-surface0 rounded-lg">
                      <p class="text-xl">
                        <strong>On Windows:</strong> Press Alt+F4 or use File → Exit<br />
                        <strong>On Mac:</strong> Press Cmd+Q or use Safari/Chrome → Quit<br />
                        <strong>On Mobile:</strong> Swipe up to close the app completely
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex items-start gap-6">
                  <div class="badge badge-primary badge-lg text-2xl p-6">2</div>
                  <div class="flex-1">
                    <h3 class="text-3xl font-bold mb-2">Reopen Your Browser</h3>
                    <p class="text-2xl text-subtext0">
                      After quitting, open your browser again and try visiting the website.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl">
              <div class="card-body">
                <div class="flex items-start gap-6">
                  <div class="badge badge-primary badge-lg text-2xl p-6">3</div>
                  <div class="flex-1">
                    <h3 class="text-3xl font-bold mb-2">Still Blocked?</h3>
                    <p class="text-2xl text-subtext0">
                      If the website is still blocked after reopening your browser, press the refresh button (F5 or
                      Cmd+R) and it should work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Domain info -->
          <div class="mt-8 p-6 bg-surface0 rounded-lg">
            <p class="text-2xl">
              <strong>Unblocked domain:</strong>
              <span class="text-green font-mono">{{ domain }}</span>
            </p>
            <p v-if="!permanent" class="text-xl text-yellow mt-2">
              ⏰ This is temporary - the block will return in 15 minutes
            </p>
          </div>

          <!-- Close button -->
          <div class="mt-8 flex justify-center gap-4">
            <button class="btn btn-primary btn-lg text-2xl px-8 py-4" @click="handleClose">
              I Understand - Close This Message
            </button>
            <button v-if="autoCloseTimer" class="btn btn-ghost btn-lg text-xl" @click="clearAutoClose">
              Keep showing ({{ autoCloseCountdown }}s)
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue"

defineProps<{
  domain: string
  permanent: boolean
}>()

const emit = defineEmits<{
  (e: "close"): void
}>()

const isVisible = ref(true)
const autoCloseTimer = ref<number | undefined>()
const autoCloseCountdown = ref(30)

const startAutoClose = () => {
  autoCloseCountdown.value = 30
  autoCloseTimer.value = window.setInterval(() => {
    autoCloseCountdown.value--
    if (autoCloseCountdown.value <= 0) {
      handleClose()
    }
  }, 1000)
}

const clearAutoClose = () => {
  if (autoCloseTimer.value) {
    window.clearInterval(autoCloseTimer.value)
    autoCloseTimer.value = undefined
  }
}

const handleClose = () => {
  clearAutoClose()
  isVisible.value = false
  setTimeout(() => {
    emit("close")
  }, 300)
}

onBeforeUnmount(() => {
  clearAutoClose()
})
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
