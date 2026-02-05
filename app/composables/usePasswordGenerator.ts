import type { ZxcvbnResult } from '@zxcvbn-ts/core'
import { SCIFI_WORDS } from '~/utils/word-corpus'

/**
 * MU/TH/UR 6000 — PASSWORD GENERATION SUBSYSTEM
 *
 * Generates "correct horse battery staple" style passphrases
 * from a science fiction word corpus. Uses Fisher-Yates shuffle
 * with crypto.getRandomValues() for secure randomness.
 */
export function usePasswordGenerator() {
  const wordCount = ref(4)
  const capitalize = ref(true)
  const appendSuffix = ref(true)
  const password = ref('')
  const strength = ref<ZxcvbnResult | null>(null)
  const copied = ref(false)

  const separator = '-'

  // Lazily loaded zxcvbn module (code-split for smaller initial bundle)
  let zxcvbnAsyncFn: ((pw: string) => Promise<ZxcvbnResult>) | null = null

  async function loadZxcvbn() {
    if (zxcvbnAsyncFn) return zxcvbnAsyncFn
    const { zxcvbnAsync } = await import('@zxcvbn-ts/core')
    zxcvbnAsyncFn = zxcvbnAsync
    return zxcvbnAsyncFn
  }

  /** Cryptographically secure random integer in [0, max) */
  function secureRandom(max: number): number {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0]! % max
  }

  /** Fisher-Yates shuffle (in-place) using secure randomness */
  function shuffle(arr: string[]): string[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandom(i + 1)
      const temp = arr[i]!
      arr[i] = arr[j]!
      arr[j] = temp
    }
    return arr
  }

  /** Generate a new passphrase */
  function generate() {
    const pool = [...SCIFI_WORDS]
    shuffle(pool)
    const selected = pool.slice(0, wordCount.value)

    const words = capitalize.value
      ? selected.map(w => w.charAt(0).toUpperCase() + w.slice(1))
      : selected

    let result = words.join(separator)

    if (appendSuffix.value) {
      const suffix = String(secureRandom(1000)).padStart(3, '0')
      result += separator + suffix
    }

    password.value = result
    checkStrength(result)
  }

  /** Run zxcvbn strength analysis */
  async function checkStrength(pw: string) {
    try {
      const check = await loadZxcvbn()
      strength.value = await check(pw)
    }
    catch {
      // zxcvbn not yet initialized (SSR or plugin still loading)
      strength.value = null
    }
  }

  /** Copy password to clipboard */
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(password.value)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    }
    catch {
      // Clipboard API not available
    }
  }

  // Generate on client mount (avoids SSR hydration mismatch from random values)
  onMounted(() => {
    generate()
  })

  // Auto-regenerate when any option changes (not immediate — onMounted handles first run)
  watch([wordCount, capitalize, appendSuffix], () => {
    generate()
  })

  return {
    wordCount,
    capitalize,
    appendSuffix,
    password,
    strength,
    copied,
    generate,
    copyToClipboard,
  }
}
