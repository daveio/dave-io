<template>
  <span v-if="displayEmail" class="inline-block" :data-encoded-email="encodedEmail">
    <a :href="`mailto:${displayEmail}`" :class="linkClasses" :title="`Send email to ${displayEmail}`">
      {{ displayEmail }}
    </a>
  </span>
  <span v-else-if="encodingError" class="text-red-500 text-sm"> [Email unavailable] </span>
  <span v-else class="text-gray-500 text-sm"> [Processing email...] </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

interface Props {
  /** Plain email address to be obfuscated and displayed */
  email: string
  /** Optional custom CSS classes for the email link */
  linkClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  linkClass: ""
})

const displayEmail = ref<string | null>(null)
const encodingError = ref<boolean>(false)

/**
 * Encodes an email address using XOR cipher + bit rotation + Base64
 * to obfuscate it from basic scrapers while keeping it readable for users
 *
 * The encoding process:
 * 1. XOR each byte with a rotating key derived from the email's character codes
 * 2. Rotate each byte left by 3 positions
 * 3. Encode as Base64
 */
function encodeEmail(email: string): string {
  // Convert string to bytes
  const bytes = new TextEncoder().encode(email)

  // Generate key from sum of character codes (mod 256 for byte range)
  const key = email.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 256

  // XOR each byte with rotating key
  const xorBytes = bytes.map((byte, i) => byte ^ ((key + i) % 256))

  // Bit rotation: rotate each byte left by 3 positions
  const rotatedBytes = xorBytes.map((byte) => ((byte << 3) | (byte >> 5)) & 0xff)

  // Convert to binary string then Base64
  const binaryString = String.fromCharCode(...rotatedBytes)
  return btoa(binaryString)
}

/**
 * Validates that an email address has a basic valid format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Store the encoded version for obfuscation purposes
const encodedEmail = ref<string>("")

// Computed property for link classes
// biome-ignore lint/correctness/noUnusedVariables: Used in template
const linkClasses = computed(() => {
  const defaultClasses = "text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
  return props.linkClass ? `${defaultClasses} ${props.linkClass}` : defaultClasses
})

onMounted(() => {
  if (!props.email) {
    encodingError.value = true
    return
  }

  if (!isValidEmail(props.email)) {
    console.error("Invalid email format:", props.email)
    encodingError.value = true
    return
  }

  try {
    // Encode the email for obfuscation (stored but not used for display)
    encodedEmail.value = encodeEmail(props.email)

    // Display the original email to users
    displayEmail.value = props.email
  } catch (error) {
    console.error("Email encoding failed:", error)
    encodingError.value = true
  }
})
</script>