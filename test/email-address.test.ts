import { mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it } from "vitest"
// @ts-ignore - Vue SFC imports work in Nuxt test environment but TypeScript can't resolve them
import EmailAddress from "../components/ui/EmailAddress.vue"

describe("EmailAddress Component", () => {
  const validEmail = "dave@dave.io"
  const invalidEmail = "not-an-email"

  describe("with valid email", () => {
    it("should render the email address as a clickable link", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { email: validEmail }
      })

      const link = wrapper.find("a")
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe(validEmail)
      expect(link.attributes("href")).toBe(`mailto:${validEmail}`)
      expect(link.attributes("title")).toBe(`Send email to ${validEmail}`)
    })

    it("should include encoded email in data attribute", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { email: validEmail }
      })

      const span = wrapper.find(".email-address")
      expect(span.exists()).toBe(true)

      const encodedData = span.attributes("data-encoded-email")
      expect(encodedData).toBeDefined()
      expect(encodedData).not.toBe("")
      expect(encodedData).not.toBe(validEmail) // Should be encoded, not plain text
    })

    it("should apply default CSS classes", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { email: validEmail }
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
          email: validEmail,
          linkClass: customClass
        }
      })

      const link = wrapper.find("a")
      expect(link.classes()).toContain(customClass)
      // Should still include default classes
      expect(link.classes()).toContain("text-blue-600")
    })
  })

  describe("with invalid email", () => {
    it("should show error message for invalid email format", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { email: invalidEmail }
      })

      const errorSpan = wrapper.find(".text-red-500")
      expect(errorSpan.exists()).toBe(true)
      expect(errorSpan.text()).toBe("[Email unavailable]")

      const link = wrapper.find("a")
      expect(link.exists()).toBe(false)
    })

    it("should show error message for empty email", async () => {
      const wrapper = await mountSuspended(EmailAddress, {
        props: { email: "" }
      })

      const errorSpan = wrapper.find(".text-red-500")
      expect(errorSpan.exists()).toBe(true)
      expect(errorSpan.text()).toBe("[Email unavailable]")
    })
  })

  describe("encoding functionality", () => {
    it("should encode different emails to different strings", async () => {
      const email1 = "test1@example.com"
      const email2 = "test2@example.com"

      const wrapper1 = await mountSuspended(EmailAddress, { props: { email: email1 } })
      const wrapper2 = await mountSuspended(EmailAddress, { props: { email: email2 } })

      const encoded1 = wrapper1.find(".email-address").attributes("data-encoded-email")
      const encoded2 = wrapper2.find(".email-address").attributes("data-encoded-email")

      expect(encoded1).not.toBe(encoded2)
      expect(encoded1).not.toBe(email1)
      expect(encoded2).not.toBe(email2)
    })

    it("should consistently encode the same email", async () => {
      const email = "consistent@test.com"

      const wrapper1 = await mountSuspended(EmailAddress, { props: { email } })
      const wrapper2 = await mountSuspended(EmailAddress, { props: { email } })

      const encoded1 = wrapper1.find(".email-address").attributes("data-encoded-email")
      const encoded2 = wrapper2.find(".email-address").attributes("data-encoded-email")

      expect(encoded1).toBe(encoded2)
    })
  })
})
