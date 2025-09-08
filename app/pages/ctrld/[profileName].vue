<template>
  <!-- Main container with centered layout -->
  <div class="flex justify-center items-center pt-6">
    <!-- Card container for the unblock domain interface -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Page title -->
        <h1 class="card-title">Unblock Domain</h1>

        <!-- Domain and profile information display -->
        <p>
          You are about to unblock <strong>{{ domain }}</strong> for the <strong>{{ profile }}</strong> profile.
        </p>

        <!-- AI Domain Security Check -->
        <DomainCheck :auth="auth" :domain="domain" />

        <!-- Action buttons and modal confirmation -->
        <UnblockConfirmActions :domain="domain" :auth="auth" :profile="profile" @success="onSuccess" @error="onError" />

        <!-- Status message display with appropriate styling -->
        <div v-if="statusMessage" role="alert" :class="['alert mt-4', statusClass]">
          <!-- Success icon -->
          <svg
            v-if="statusClass === 'alert-success'"
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <!-- Error icon -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ statusMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import type { ctrldProfile } from "~~/shared/types/ctrld"
import DomainCheck from "~/components/ctrld/DomainCheck.vue"
import UnblockConfirmActions from "~/components/ctrld/UnblockConfirmActions.vue"

// Get route information for dynamic parameters
const route = useRoute()

// Computed properties from route parameters and query strings
const profile = computed(() => route.params.profileName as ctrldProfile)
const domain = computed(() => route.query.domain as string)
const auth = computed(() => route.query.auth as string)

// Reactive state for UI interactions
const statusMessage = ref("") // User feedback message
const statusClass = ref("alert-success") // CSS class for status styling

// Validation: Ensure a domain is specified in the query
if (!domain.value) {
  throw createError({
    statusCode: 400,
    statusMessage: "You need to specify a domain"
  })
}

// Validation: Ensure authentication token is provided
if (!auth.value) {
  throw createError({
    statusCode: 401,
    statusMessage: "You need to at least TRY to authenticate"
  })
}

// Set up page metadata and SEO
usePageSetup({
  title: `ControlD for ${profile.value}`,
  description: `Unblock a domain for ${profile.value}`
})

function onSuccess(message: string) {
  statusMessage.value = message
  statusClass.value = "alert-success"
}

function onError(message: string) {
  statusMessage.value = message
  statusClass.value = "alert-error"
}
</script>
