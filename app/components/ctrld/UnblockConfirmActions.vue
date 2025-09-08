<template>
  <div>
    <div class="card-actions justify-end mt-4 space-x-2">
      <button class="btn btn-primary" :disabled="isSubmitting" @click="handleTempUnblock">
        <span v-if="isSubmitting && !isSubmittingPermanent" class="loading loading-spinner"></span>
        Unblock for 15 mins
      </button>

      <button class="btn btn-error btn-outline" :disabled="isSubmitting" @click="openModal">Unblock Permanently</button>
    </div>

    <dialog :open="modalOpen" class="modal" @close="closeModal">
      <div class="modal-box max-w-xl">
        <h3 class="font-bold text-lg">Confirm Permanent Unblock</h3>
        <p class="py-2">Think before you click! Is this block protecting you?</p>
        <p class="text-sm opacity-70">
          Permanent unblocking will disable protections for this domain on your profile FOREVER. Dave can remove the
          override, but <strong>you can't</strong>.
        </p>

        <div class="modal-action">
          <button class="btn btn-primary" :disabled="isSubmitting" autofocus @click="handleTempUnblock">
            <span v-if="isSubmitting && !isSubmittingPermanent" class="loading loading-spinner"></span>
            Unblock for 15 mins (default)
          </button>

          <button class="btn btn-error" :disabled="countdown > 0 || isSubmitting" @click="confirmPermanent">
            <span v-if="isSubmitting && isSubmittingPermanent" class="loading loading-spinner"></span>
            <span v-else>
              Unblock Permanently<span v-if="countdown > 0"> ({{ countdown }})</span>
            </span>
          </button>

          <button class="btn" :disabled="isSubmitting" @click="closeModal">Cancel</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue"
import type { ctrldProfile, ctrldUnblockRequest } from "~~/shared/types/ctrld"

const props = defineProps<{
  domain: string
  auth: string
  profile: ctrldProfile
}>()

const emit = defineEmits<{
  (e: "success" | "error", message: string): void
}>()

const isSubmitting = ref(false)
const isSubmittingPermanent = ref(false)
const modalOpen = ref(false)
const countdown = ref(15)
let timer: number | undefined

function openModal() {
  modalOpen.value = true
  countdown.value = 15
  startCountdown()
}

function closeModal() {
  modalOpen.value = false
  stopCountdown()
}

function startCountdown() {
  stopCountdown()
  timer = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      stopCountdown()
    }
  }, 1000)
}

function stopCountdown() {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

async function performUnblock(permanent: boolean) {
  try {
    isSubmitting.value = true
    isSubmittingPermanent.value = permanent

    const { error } = await useFetch("/api/ctrld/unblock", {
      method: "POST",
      body: {
        domain: props.domain,
        auth: props.auth,
        profile: props.profile,
        permanent
      } as ctrldUnblockRequest
    })

    if (error.value) {
      throw new Error(error.value.statusMessage || "An unknown error occurred.")
    }

    emit("success", `Successfully unblocked ${props.domain}${permanent ? " permanently" : " for 15 minutes"}.`)

    if (modalOpen.value) {
      closeModal()
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "An unknown error occurred."
    emit("error", `Error: ${message}`)
  } finally {
    isSubmitting.value = false
    isSubmittingPermanent.value = false
  }
}

async function handleTempUnblock() {
  await performUnblock(false)
}

async function confirmPermanent() {
  if (countdown.value > 0) return
  await performUnblock(true)
}

onBeforeUnmount(() => {
  stopCountdown()
})
</script>

<style scoped>
/* Using DaisyUI modal styles; no custom positioning to avoid conflicts */
</style>
