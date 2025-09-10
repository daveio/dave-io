<template>
  <!-- trunk-ignore-all(trunk-toolbox/todo) -->
  <div class="space-y-6">
    <!-- Heading -->
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4 bg-gradient-to-r from-green via-teal to-cyan bg-clip-text text-transparent">
        TODO
      </h1>
      <p class="text-lg text-subtext0">Just describe what you want me to do and I'll take it from there.</p>
    </div>

    <TodoForm />

    <!-- Back Button -->
    <BackToHomeButton from="todo" />
  </div>
</template>

<script lang="ts" setup>
import BackToHomeButton from "~/components/shared/BackToHomeButton.vue"
import TodoForm from "~/components/todo/TodoForm.vue"

usePageSetup({
  title: "todo",
  keywords: ["linear", "ticket", "todo", "feature request", "bug report"],
  description: "Send me a Linear ticket the easy way"
})
</script>

<style scoped>
/* Additional page-specific styles can go here if needed */
</style>
