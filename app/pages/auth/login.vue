<template>
  <div class="login-container">
    <h1>Protected Access</h1>

    <!-- Error Display -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button class="dismiss-button" @click="errorMessage = ''">×</button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <p>{{ successMessage }}</p>
    </div>

    <form @submit.prevent="handleLogin">
      <div v-if="step === 'credentials'">
        <input v-model="email" type="email" placeholder="Email address" :disabled="loading" @input="clearError">
        <input v-model="phone" type="tel" placeholder="Phone number (optional)" :disabled="loading" @input="clearError">
        <p class="form-hint">Enter either email or phone number</p>
        <button type="submit" :disabled="loading || (!email && !phone)">
          {{ loading ? 'Sending...' : 'Send OTP Code' }}
        </button>
      </div>

      <div v-else-if="step === 'verify'">
        <p>Enter the 6-digit code sent to <strong>{{ email || phone }}</strong></p>
        <input ref="otpInput" v-model="otpCode" type="text" placeholder="000000" maxlength="6" pattern="[0-9]{6}"
          inputmode="numeric" autocomplete="one-time-code" :disabled="loading" required @input="clearError"
          @paste="handleOtpPaste">
        <div class="form-actions">
          <button type="button" :disabled="loading || otpCode.length !== 6" @click="verifyOTP">
            {{ loading ? 'Verifying...' : 'Verify Code' }}
          </button>
          <button type="button" :disabled="loading" class="secondary-button" @click="resetForm">
            Use Different Credentials
          </button>
        </div>
        <p class="form-hint">Didn't receive the code? Check your spam folder or try again.</p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { SupabaseAuthError } from "../../../types/auth"

const supabase = useSupabaseClient()
const email = ref('')
const phone = ref('')
const otpCode = ref('')
const step = ref<'credentials' | 'verify'>('credentials')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const otpInput = ref<HTMLInputElement | null>(null)

// Clear error message when user types
const clearError = () => {
  errorMessage.value = ''
}

// Handle OTP paste for better mobile experience
const handleOtpPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') || ''
  const cleaned = pastedText.replace(/\D/g, '').slice(0, 6)
  if (cleaned.length === 6) {
    event.preventDefault()
    otpCode.value = cleaned
    // Auto-submit if valid 6-digit code is pasted
    nextTick(() => {
      if (otpCode.value.length === 6) {
        verifyOTP()
      }
    })
  }
}

// Auto-focus OTP input when switching to verify step
watch(step, (newStep) => {
  if (newStep === 'verify') {
    nextTick(() => {
      otpInput.value?.focus()
    })
  }
})

// Reset form to initial state
const resetForm = () => {
  step.value = 'credentials'
  otpCode.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

// Safely normalize any error to our expected format
const normalizeAuthError = (error: any): SupabaseAuthError => {
  // Handle null/undefined errors
  if (!error) {
    return { message: 'An unexpected error occurred' }
  }

  // If error is already in correct format, use it
  if (typeof error === 'object' && typeof error.message === 'string') {
    return {
      message: error.message,
      status: typeof error.status === 'number' ? error.status : undefined,
      code: typeof error.code === 'string' ? error.code : undefined
    }
  }

  // If error is a string, treat it as the message
  if (typeof error === 'string') {
    return { message: error }
  }

  // Fallback for any other error type
  return { message: error?.toString() || 'An unexpected error occurred' }
}

// Handle user-friendly error messages
const getErrorMessage = (error: SupabaseAuthError): string => {
  if (error.message.includes('User not found')) {
    return 'This email/phone is not authorized. Please contact your administrator for access.'
  }
  if (error.message.includes('Invalid phone number')) {
    return 'Please enter a valid phone number including country code (e.g., +1234567890)'
  }
  if (error.message.includes('Email rate limit exceeded')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }
  if (error.message.includes('Invalid OTP')) {
    return 'Invalid verification code. Please check and try again.'
  }
  if (error.message.includes('Token has expired')) {
    return 'Verification code has expired. Please request a new one.'
  }

  // Generic error fallback
  return error.message || 'An unexpected error occurred. Please try again.'
}

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Validate input
    if (!email.value && !phone.value) {
      errorMessage.value = 'Please enter either an email address or phone number'
      return
    }

    // Prepare credentials
    const credentials = email.value
      ? { email: email.value.trim() }
      : { phone: phone.value.trim() }

    const { error } = await supabase.auth.signInWithOtp({
      ...credentials,
      options: {
        shouldCreateUser: false // Only allow existing authorized users
      }
    })

    if (error) {
      errorMessage.value = getErrorMessage(normalizeAuthError(error))
      return
    }

    // Success - move to verification step
    successMessage.value = 'Verification code sent! Check your email/SMS.'
    step.value = 'verify'

    // Clear success message after 5 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)

  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again later.'
  } finally {
    loading.value = false
  }
}

async function verifyOTP() {
  loading.value = true
  errorMessage.value = ''

  try {
    // Validate OTP
    if (otpCode.value.length !== 6) {
      errorMessage.value = 'Please enter a valid 6-digit code'
      return
    }

    const credentials = email.value
      ? { email: email.value.trim(), token: otpCode.value, type: 'email' as const }
      : { phone: phone.value.trim(), token: otpCode.value, type: 'sms' as const }

    const { error } = await supabase.auth.verifyOtp(credentials)

    if (error) {
      errorMessage.value = getErrorMessage(normalizeAuthError(error))
      return
    }

    // Success - redirect to protected page
    successMessage.value = 'Login successful! Redirecting...'
    await navigateTo("/pandorica")

  } catch (error) {
    console.error('Verification error:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again later.'
  } finally {
    loading.value = false
  }
}

// Check if user is already logged in
onMounted(async () => {
  const user = useSupabaseUser()
  if (user.value) {
    // User is already logged in, redirect
    await navigateTo('/pandorica')
  }
})
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 4rem auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

button {
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #2563eb;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #6b7280;
}

.secondary-button:hover:not(:disabled) {
  background-color: #4b5563;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.error-message,
.success-message {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  position: relative;
}

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}

.success-message {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.dismiss-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  padding: 0.25rem;
  width: auto;
  height: auto;
  cursor: pointer;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .login-container {
    color: #e5e7eb;
  }

  input {
    background-color: #374151;
    border-color: #4b5563;
    color: #e5e7eb;
  }

  input:disabled {
    background-color: #1f2937;
  }

  .error-message {
    background-color: #7f1d1d;
    border-color: #991b1b;
    color: #fee2e2;
  }

  .success-message {
    background-color: #14532d;
    border-color: #166534;
    color: #bbf7d0;
  }
}
</style>
