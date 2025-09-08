<template>
  <!-- trunk-ignore-all(trunk-toolbox/todo) -->
  <div class="space-y-6">
    <!-- Heading -->
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4 bg-gradient-to-r from-green via-teal to-cyan bg-clip-text text-transparent">
        TODO
      </h1>
      <p class="text-xl text-subtext1 mb-1">Fill out this form to send me a ticket in Linear.</p>
      <p class="text-lg text-subtext0">Just describe what you want me to do and I'll take it from there.</p>
    </div>

    <!-- Status alerts -->
    <div v-if="status.message" :class="['alert', status.type === 'success' ? 'alert-success' : 'alert-error']">
      <Icon v-if="status.type === 'success'" name="i-heroicons-check-circle" class="w-5 h-5" />
      <Icon v-else name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
      <span>{{ status.message }}</span>
    </div>

    <!-- Form Card -->
    <div class="card bg-base-100 shadow-xl border border-surface2/60">
      <div class="card-body">
        <h2 class="card-title text-green">New Ticket</h2>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <!-- Basic info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Title <span class="text-red-400">*</span></legend>
              <label class="label" for="title">Short summary</label>
              <input id="title" v-model.trim="form.title" type="text" class="input" placeholder="e.g. Add RSS to blog"
                required :disabled="submitting" />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Type</legend>
              <label class="label" for="type">Category</label>
              <select id="type" v-model="form.type" class="select" :disabled="submitting">
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="chore">Chore</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </fieldset>
          </div>

          <!-- Priority & Contact -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Priority</legend>
              <label class="label" for="priority">How urgent?</label>
              <select id="priority" v-model="form.priority" class="select" :disabled="submitting">
                <option value="P1">P1 – Critical</option>
                <option value="P2">P2 – High</option>
                <option value="P3">P3 – Medium</option>
                <option value="P4">P4 – Low</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Your Name</legend>
              <label class="label" for="name">Optional</label>
              <input id="name" v-model.trim="form.name" type="text" class="input" placeholder="Jane Doe"
                :disabled="submitting" />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Email</legend>
              <label class="label" for="email">Optional (so I can reply)</label>
              <input id="email" v-model.trim="form.email" type="email" class="input" placeholder="you@example.com"
                :disabled="submitting" />
            </fieldset>
          </div>

          <!-- Description -->
          <fieldset class="fiqweldset">
            <legend class="fieldset-legend">Details <span class="text-red-400">*</span></legend>
            <label class="label" for="description">What should I do? Include links, context, examples. You can
              optionally use
              <NuxtLink to="https://www.markdownguide.org/cheat-sheet">Markdown
                <Icon name="pepicons-pop-question-circle-filled" class="text-red-400" />
              </NuxtLink>
              here.
            </label>
            <textarea id="description" v-model.trim="form.description" class="textarea h-40 w-full"
              placeholder="Describe the task…" required :disabled="submitting"></textarea>
          </fieldset>

          <!-- Actions -->
          <div class="card-actions justify-end pt-2">
            <button type="submit" class="btn btn-primary" :disabled="!canSubmit || submitting">
              <span v-if="submitting" class="loading loading-spinner mr-2" />
              Submit Ticket
            </button>
          </div>

          <p class="text-xs text-subtext0">
            This form posts to <code class="font-mono">/api/todo</code>. The backend route is stubbed and will accept
            data via POST.
          </p>
        </form>
      </div>
    </div>

    <!-- Back Button -->
    <BackToHomeButton from="todo" />
  </div>
</template>

<script lang="ts" setup>
import BackToHomeButton from "~/components/shared/BackToHomeButton.vue"

usePageSetup({
  title: "todo",
  keywords: ["linear", "ticket", "todo", "feature request", "bug report"],
  description: "Send me a TODO — this creates a Linear ticket on my end"
})

type TodoType = "feature" | "bug" | "chore" | "question" | "other"
type TodoPriority = "P1" | "P2" | "P3" | "P4"

interface TodoFormPayload {
  title: string
  description: string
  type: TodoType
  priority: TodoPriority
  name?: string
  email?: string
}

const form = reactive<TodoFormPayload>({
  title: "",
  description: "",
  type: "feature",
  priority: "P3",
  name: "",
  email: ""
})

interface TodoApiResponse {
  message?: string
  [key: string]: unknown
}

const submitting = ref(false)
const status = reactive<{ type: "success" | "error"; message: string | null }>({ type: "success", message: null })

const canSubmit = computed(() => form.title.trim().length > 2 && form.description.trim().length > 5)

async function onSubmit() {
  status.message = null
  submitting.value = true
  try {
    const payload: TodoFormPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      priority: form.priority,
      name: form.name?.trim() || undefined,
      email: form.email?.trim() || undefined
    }

    const res = (await $fetch("/api/todo", {
      method: "POST",
      body: payload
    })) as TodoApiResponse

    const msg = res.message || "Submitted (stub). I'll wire this to Linear shortly."
    status.type = "success"
    status.message = msg
    // Optionally clear fields on success
    form.title = ""
    form.description = ""
  } catch (e: unknown) {
    status.type = "error"
    status.message =
      (e as { data?: { error?: string } })?.data?.error ||
      (e as Error)?.message ||
      "Submission failed. Please try again."
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Additional page-specific styles can go here if needed */
</style>
