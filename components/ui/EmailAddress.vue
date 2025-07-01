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

function decodeEmail(encoded: string): string | null {
  try {
    // Decode from base64
    const binaryString = atob(encoded)
    const rotatedBytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      rotatedBytes[i] = binaryString.charCodeAt(i)
    }

    // Reverse bit rotation: rotate each byte right by 3 positions
    const xorBytes = rotatedBytes.map((byte) => ((byte >> 3) | (byte << 5)) & 0xFF)

    // Try different keys since we need to brute force the original key
    // The key was generated from the sum of character codes of the original email
    for (let keyBase = 0; keyBase < 256; keyBase++) {
      const testBytes = xorBytes.map((byte, i) => byte ^ (keyBase + i) % 256)
      const testEmail = new TextDecoder().decode(testBytes)

      // Check if it looks like an email (contains @ and .)
      if (testEmail.includes("@") && testEmail.includes(".") && /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(testEmail)) {
        return testEmail
      }
    }

    return null
  } catch (error) {
    console.error("Email decoding failed:", error)
    return null
  }
}

// Computed property for link classes
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
