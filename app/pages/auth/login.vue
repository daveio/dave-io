<template>
  <div class="login-container">
    <h1>Protected Access</h1>
    <form @submit.prevent="handleLogin">
      <div v-if="step === 'credentials'">
        <input v-model="email" type="email" placeholder="Email address" required />
        <input v-model="phone" type="tel" placeholder="Phone number (optional)" />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send OTP Code' }}
        </button>
      </div>

      <div v-else-if="step === 'verify'">
        <p>Enter the 6-digit code sent to {{ email || phone }}</p>
        <input v-model="otpCode" type="text" placeholder="000000" maxlength="6" required />
        <button @click="verifyOTP" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const email = ref('')
const phone = ref('')
const otpCode = ref('')
const step = ref('credentials')
const loading = ref(false)

async function handleLogin() {
  loading.value = true

  try {
    const credentials = email.value ?
      { email: email.value } :
      { phone: phone.value }

    const { error } = await supabase.auth.signInWithOtp({
      ...credentials,
      options: {
        shouldCreateUser: false // Only allow existing authorized users
      }
    })

    if (error) {
      if (error.message.includes('User not found')) {
        alert('Email/phone not authorized. Contact administrator.')
        return
      }
      throw error
    }

    step.value = 'verify'
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function verifyOTP() {
  loading.value = true

  try {
    const credentials = email.value ?
      { email: email.value, token: otpCode.value, type: 'email' } :
      { phone: phone.value, token: otpCode.value, type: 'sms' }

    const { error } = await supabase.auth.verifyOtp(credentials)
    if (error) throw error

    await navigateTo("/pandorica")
  } catch (error) {
    alert('Invalid code: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>
