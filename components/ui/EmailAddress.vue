<template>
  <span v-if="displayEmail" class="inline-block" :data-encoded-email="props.encodedEmail">
    <a :href="`mailto:${displayEmail}`" class="link-url" :title="`Send email to ${displayEmail}`">
      {{ displayEmail }}
    </a>
  </span>
  <span v-else-if="decodingError" class="text-red-500 text-sm"> [Email unavailable] </span>
  <span v-else class="text-gray-500 text-sm"> [Decoding email...] </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

interface Props {
  /** Base64-encoded obfuscated email address (pre-encoded server-side) */
  encodedEmail: string
  /** Optional custom CSS classes for the email link */
  linkClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  linkClass: ""
})

const displayEmail = ref<string | null>(null)
const decodingError = ref<boolean>(false)

// Import the decoding function from the composable
const { decodeEmail } = useEmailObfuscation()

// Computed property for link classes
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const linkClasses = computed(() => {
  const defaultClasses = "text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
  return props.linkClass ? `${defaultClasses} ${props.linkClass}` : defaultClasses
})

onMounted(() => {
  if (!props.encodedEmail) {
    decodingError.value = true
    return
  }

  try {
    // Decode the server-side encoded email for display
    const decodedEmail = decodeEmail(props.encodedEmail)

    if (decodedEmail) {
      displayEmail.value = decodedEmail
    } else {
      console.error("Failed to decode email - invalid format or encoding")
      decodingError.value = true
    }
  } catch (error) {
    console.error("Email decoding failed:", error)
    decodingError.value = true
  }
})
</script>
