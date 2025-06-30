#!/usr/bin/env bun

/**
 * Email Encoding Utility
 *
 * This script encodes email addresses using XOR cipher + bit rotation + Base64
 * to protect them from bot harvesting while allowing human access.
 *
 * Usage:
 *   bun run bin/encode-email.ts <email>
 *   bun run bin/encode-email.ts dave@dave.io
 */

/**
 * Encodes an email address using a multi-layer obfuscation strategy:
 * 1. XOR each byte with a rotating key derived from the email's character codes
 * 2. Rotate each byte left by 3 positions (bit manipulation)
 * 3. Encode the result as Base64
 *
 * @param email - The email address to encode
 * @returns Base64-encoded obfuscated email string
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

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error("❌ Error: Please provide an email address to encode")
    console.log("\n📖 Usage:")
    console.log("  bun run bin/encode-email.ts <email>")
    console.log("  bun run bin/encode-email.ts dave@dave.io")
    process.exit(1)
  }

  const email = args[0]

  if (!email) {
    console.error("❌ Error: No email address provided")
    process.exit(1)
  }

  if (!isValidEmail(email)) {
    console.error(`❌ Error: "${email}" is not a valid email address format`)
    process.exit(1)
  }

  try {
    const encoded = encodeEmail(email)

    console.log("✅ Email successfully encoded!")
    console.log("")
    console.log("📧 Original email:", email)
    console.log("🔐 Encoded email:", encoded)
    console.log("")
    console.log("📋 Usage in Vue component (recommended):")
    console.log(`<EmailAddress email="${email}" />`)
    console.log("")
    console.log("📋 Manual encoded usage (if needed):")
    console.log(`data-encoded-email="${encoded}"`)
  } catch (error) {
    console.error("❌ Error encoding email:", error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  main()
}

export { encodeEmail, isValidEmail }
