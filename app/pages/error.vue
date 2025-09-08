<script setup lang="ts">
import * as Sentry from "@sentry/nuxt";
function triggerClientError() {
  throw new Error("Nuxt Button Error");
}
function getSentryData() {
  Sentry.startSpan(
    {
      name: "Example Frontend Span",
      op: "test",
    },
    async () => {
      await $fetch("/api/error");
    },
  );
}
</script>
<template>
  <div>
    <h1>Error Page</h1>
    <p>This page is for testing error handling with Sentry.</p>
    <button id="errorBtn" @click="triggerClientError">
      Throw Client Error
    </button>
    <button type="button" @click="getSentryData">Throw Server Error</button>
  </div>
</template>
