<script setup lang="ts">
import * as Sentry from "@sentry/nuxt"

// Head + layout setup
usePageSetup({
  title: "sentry",
  description: "Playground to trigger client/server errors and test Sentry."
})

definePageMeta({
  layout: 'default',
  layoutProps: {
    showHero: false,
    showCurlCommand: false,
    useMonospace: false
  }
})

onMounted(() => {
  console.log("Protected page mounted successfully")
})

function triggerClientError() {
  throw new Error("Nuxt Button Error")
}

function getSentryData() {
  Sentry.startSpan(
    {
      name: "Example Frontend Span",
      op: "test"
    },
    async () => {
      await $fetch("/api/sentry", { method: "GET" }).catch((error) => {
        console.error("Caught error from /api/sentry:", error)
      })
    }
  )
}

function directConsoleLog() {
  console.log("Direct console log message")
}

function sentryLoggerLog() {
  // Using the Sentry logger API; cast to any to avoid TS conflicts
  // @ts-expect-error Sentry class doesn't resolve?
  Sentry.logger.log("Sentry logger log message")
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center">
      <h1 class="text-2xl font-bold bg-gradient-to-r from-red via-peach to-yellow bg-clip-text text-transparent">
        Error Playground
      </h1>
      <p class="text-subtext1 mt-1">This page is for testing error handling with Sentry.</p>
    </div>

    <div class="card bg-base-100 shadow-xl border border-surface2/60">
      <div class="card-body gap-4">
        <div class="alert alert-warning">
          <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          <span>Use these buttons to intentionally trigger errors.</span>
        </div>

        <div class="card-actions justify-start gap-3">
          <button id="errorBtn" type="button" class="btn btn-error" @click="triggerClientError">
            <Icon name="i-heroicons-bug-ant" class="w-5 h-5" />
            Throw Client Error
          </button>

          <button type="button" class="btn btn-warning" @click="getSentryData">
            <Icon name="i-heroicons-cloud-bolt" class="w-5 h-5" />
            Throw Server Error
          </button>

          <button type="button" class="btn btn-info" @click="directConsoleLog">
            <Icon name="i-heroicons-command-line" class="w-5 h-5" />
            Console Log
          </button>

          <button type="button" class="btn btn-success" @click="sentryLoggerLog">
            <Icon name="i-heroicons-bolt" class="w-5 h-5" />
            Sentry Logger Log
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
