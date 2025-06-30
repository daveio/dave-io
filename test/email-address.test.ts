import { mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it } from "vitest"
// @ts-ignore - Vue SFC imports work in Nuxt test environment but TypeScript can't resolve them
import EmailAddress from "../components/ui/EmailAddress.vue"

// Helper function to encode emails for testing (same logic as server-side)
function encodeEmailForTest(email: string): string {
  const bytes = new TextEncoder().encode(email)
  const key = email.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 256
  const xorBytes = bytes.map((byte, i) => byte ^ ((key + i) % 256))
  const rotatedBytes = xorBytes.map((byte) => ((byte << 3) | (byte >> 5)) & 0xff)
  const binaryString = String.fromCharCode(...rotatedBytes)
  return btoa(binaryString)
}

describe("EmailAddress Component", () => {
  const validEmail = "dave@dave.io"
  const validEncodedEmail = encodeEmailForTest(validEmail)
  const invalidEncodedEmail = "invalid-encoded-data"

  describe("with valid encoded email", () => {
    it("should render the email address as a clickable link", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { encodedEmail: validEncodedEmail }
      })

      const link = wrapper.find("a")
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe(validEmail)
      expect(link.attributes("href")).toBe(`mailto:${validEmail}`)
      expect(link.attributes("title")).toBe(`Send email to ${validEmail}`)
    })

    it("should include encoded email in data attribute", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { encodedEmail: validEncodedEmail }
      })

      const span = wrapper.find(".inline-block")
      expect(span.exists()).toBe(true)

      const encodedData = span.attributes("data-encoded-email")
      expect(encodedData).toBeDefined()
      expect(encodedData).toBe(validEncodedEmail)
      expect(encodedData).not.toBe(validEmail) // Should be encoded, not plain text
    })

    it("should apply default CSS classes", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { encodedEmail: validEncodedEmail }
      })

      const link = wrapper.find("a")
      expect(link.classes()).toContain("text-blue-600")
      expect(link.classes()).toContain("hover:text-blue-800")
      expect(link.classes()).toContain("underline")
      expect(link.classes()).toContain("transition-colors")
    })

    it("should apply custom CSS classes when provided", async () => {
      const customClass = "my-custom-class"
      const wrapper = await mountSuspended(EmailAddress, {
        props: {
          encodedEmail: validEncodedEmail,
          linkClass: customClass
        }
      })

      const link = wrapper.find("a")
      expect(link.classes()).toContain(customClass)
      // Should still include default classes
      expect(link.classes()).toContain("text-blue-600")
    })
  })

  describe("with invalid encoded email", () => {
    it("should show error message for invalid encoded email", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { encodedEmail: invalidEncodedEmail }
      })

      const errorSpan = wrapper.find(".text-red-500")
      expect(errorSpan.exists()).toBe(true)
      expect(errorSpan.text()).toBe("[Email unavailable]")

      const link = wrapper.find("a")
      expect(link.exists()).toBe(false)
    })

    it("should show error message for empty encoded email", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { encodedEmail: "" }
      })

      const errorSpan = wrapper.find(".text-red-500")
      expect(errorSpan.exists()).toBe(true)
      expect(errorSpan.text()).toBe("[Email unavailable]")
    })
  })

  describe("decoding functionality", () => {
    it("should decode different encoded emails correctly", async () => {
      const email1 = "test1@example.com"
      const email2 = "test2@example.com"
      const encoded1 = encodeEmailForTest(email1)
      const encoded2 = encodeEmailForTest(email2)

      const wrapper1 = await mountSuspended(EmailAddress, { props: { encodedEmail: encoded1 } })
      const wrapper2 = await mountSuspended(EmailAddress, { props: { encodedEmail: encoded2 } })

      const link1 = wrapper1.find("a")
      const link2 = wrapper2.find("a")

      expect(link1.text()).toBe(email1)
      expect(link2.text()).toBe(email2)
      expect(link1.text()).not.toBe(link2.text())
    })

    it("should consistently decode the same encoded email", async () => {
      const email = "consistent@test.com"
      const encoded = encodeEmailForTest(email)

      const wrapper1 = await mountSuspended(EmailAddress, { props: { encodedEmail: encoded } })
      const wrapper2 = await mountSuspended(EmailAddress, { props: { encodedEmail: encoded } })

      const link1 = wrapper1.find("a")
      const link2 = wrapper2.find("a")

      expect(link1.text()).toBe(email)
      expect(link2.text()).toBe(email)
      expect(link1.text()).toBe(link2.text())
    })
  })
})
