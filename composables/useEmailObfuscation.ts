/**
 * Server-side email obfuscation composable for Nuxt.js
 *
 * This composable encodes email addresses on the server-side during SSR,
 * ensuring that plaintext emails never reach the browser or appear in the
 * client-side JavaScript bundle.
 */

/**
 * Encodes an email address using XOR cipher + bit rotation + Base64
 * to obfuscate it from basic scrapers while keeping it readable for users
 *
 * The encoding process:
 * 1. XOR each byte with a rotating key derived from the email's character codes
 * 2. Rotate each byte left by 3 positions
 * 3. Encode as Base64
 */
function encodeEmailServerSide(email: string): string {
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
 * Decodes an obfuscated email address using XOR cipher + bit rotation + Base64
 *
 * This reverses the encoding process to recover the original email.
 */
function decodeEmailClientSide(encoded: string): string | null {
  try {
    // Decode from base64
    const binaryString = atob(encoded)
    const rotatedBytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      rotatedBytes[i] = binaryString.charCodeAt(i)
    }

    // Reverse bit rotation: rotate each byte right by 3 positions
    const xorBytes = rotatedBytes.map((byte) => ((byte >> 3) | (byte << 5)) & 0xff)

    // Try different keys since we need to brute force the original key
    // The key was generated from the sum of character codes of the original email
    for (let keyBase = 0; keyBase < 256; keyBase++) {
      const testBytes = xorBytes.map((byte, i) => byte ^ ((keyBase + i) % 256))
      const testEmail = new TextDecoder().decode(testBytes)

      // Check if it looks like an email (contains @ and .)
      if (testEmail.includes("@") && testEmail.includes(".") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
        return testEmail
      }
    }

    return null
  } catch (error) {
    console.error("Email decoding failed:", error)
    return null
  }
}

/**
 * Nuxt composable for server-side email obfuscation
 *
 * Usage:
 * const { encodeEmail } = useEmailObfuscation()
 * const encodedEmail = encodeEmail('user@example.com')
 */
export const useEmailObfuscation = () => {
  return {
    encodeEmail: encodeEmailServerSide,
    decodeEmail: decodeEmailClientSide
  }
}
