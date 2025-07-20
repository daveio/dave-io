import { describe, expect, it } from "vitest"
import { AiWordRequestSchema, AiWordResponseSchema, AiWordSuggestionSchema } from "../server/utils/schemas"

describe("AI Word Schemas", () => {
  describe("AiWordRequestSchema", () => {
    describe("single mode", () => {
      it("should validate single mode with valid word", () => {
        const request = {
          mode: "single",
          word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.mode).toBe("single")
          if (result.data.mode === "single") {
            expect(result.data.word).toBe("happy")
          }
        }
      })

      it("should reject single mode with empty word", () => {
        const request = {
          mode: "single",
          word: ""
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Word is required")
        }
      })

      it("should reject single mode with word too long", () => {
        const request = {
          mode: "single",
          word: "a".repeat(101)
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Word too long")
        }
      })

      it("should reject single mode with missing word", () => {
        const request = {
          mode: "single"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })
    })

    describe("context mode", () => {
      it("should validate context mode with valid text and target_word", () => {
        const request = {
          mode: "context",
          text: "I am very happy about the result.",
          target_word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data.mode).toBe("context")
          if (result.data.mode === "context") {
            expect(result.data.text).toBe("I am very happy about the result.")
            expect(result.data.target_word).toBe("happy")
          }
        }
      })

      it("should reject context mode with empty text", () => {
        const request = {
          mode: "context",
          text: "",
          target_word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Text is required")
        }
      })

      it("should reject context mode with text too long", () => {
        const request = {
          mode: "context",
          text: "a".repeat(5001),
          target_word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Text too long")
        }
      })

      it("should reject context mode with empty target_word", () => {
        const request = {
          mode: "context",
          text: "I am very happy about the result.",
          target_word: ""
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Target word is required")
        }
      })

      it("should reject context mode with target_word too long", () => {
        const request = {
          mode: "context",
          text: "I am very happy about the result.",
          target_word: "a".repeat(101)
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Target word too long")
        }
      })

      it("should reject context mode with missing text", () => {
        const request = {
          mode: "context",
          target_word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })

      it("should reject context mode with missing target_word", () => {
        const request = {
          mode: "context",
          text: "I am very happy about the result."
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })
    })

    describe("invalid mode", () => {
      it("should reject invalid mode", () => {
        const request = {
          mode: "invalid"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })

      it("should reject missing mode", () => {
        const request = {
          word: "happy"
        }

        const result = AiWordRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
      })
    })
  })

  describe("AiWordSuggestionSchema", () => {
    it("should validate suggestion with word only", () => {
      const suggestion = {
        word: "delighted"
      }

      const result = AiWordSuggestionSchema.safeParse(suggestion)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.word).toBe("delighted")
        expect(result.data.confidence).toBeUndefined()
      }
    })

    it("should validate suggestion with word and confidence", () => {
      const suggestion = {
        word: "delighted",
        confidence: 0.95
      }

      const result = AiWordSuggestionSchema.safeParse(suggestion)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.word).toBe("delighted")
        expect(result.data.confidence).toBe(0.95)
      }
    })

    it("should reject suggestion with missing word", () => {
      const suggestion = {
        confidence: 0.95
      }

      const result = AiWordSuggestionSchema.safeParse(suggestion)
      expect(result.success).toBe(false)
    })

    it("should reject suggestion with confidence below 0", () => {
      const suggestion = {
        word: "delighted",
        confidence: -0.1
      }

      const result = AiWordSuggestionSchema.safeParse(suggestion)
      expect(result.success).toBe(false)
    })

    it("should reject suggestion with confidence above 1", () => {
      const suggestion = {
        word: "delighted",
        confidence: 1.1
      }

      const result = AiWordSuggestionSchema.safeParse(suggestion)
      expect(result.success).toBe(false)
    })
  })

  describe("AiWordResponseSchema", () => {
    it("should validate response with 5 suggestions", () => {
      const response = {
        ok: true,
        result: {
          suggestions: [
            { word: "delighted", confidence: 0.95 },
            { word: "pleased", confidence: 0.9 },
            { word: "satisfied", confidence: 0.85 },
            { word: "content", confidence: 0.8 },
            { word: "thrilled", confidence: 0.75 }
          ]
        },
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.ok).toBe(true)
        expect(result.data.result.suggestions).toHaveLength(5)
        expect(result.data.result.suggestions[0]?.word).toBe("delighted")
        expect(result.data.result.suggestions[0]?.confidence).toBe(0.95)
      }
    })

    it("should validate response with 10 suggestions", () => {
      const suggestions = Array.from({ length: 10 }, (_, i) => ({
        word: `word${i + 1}`,
        confidence: 0.9 - i * 0.05
      }))

      const response = {
        ok: true,
        result: {
          suggestions
        },
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.result.suggestions).toHaveLength(10)
      }
    })

    it("should reject response with fewer than 5 suggestions", () => {
      const response = {
        ok: true,
        result: {
          suggestions: [
            { word: "delighted", confidence: 0.95 },
            { word: "pleased", confidence: 0.9 },
            { word: "satisfied", confidence: 0.85 },
            { word: "content", confidence: 0.8 }
          ]
        },
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })

    it("should reject response with more than 10 suggestions", () => {
      const suggestions = Array.from({ length: 11 }, (_, i) => ({
        word: `word${i + 1}`,
        confidence: 0.9 - i * 0.05
      }))

      const response = {
        ok: true,
        result: {
          suggestions
        },
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })

    it("should reject response with missing suggestions", () => {
      const response = {
        ok: true,
        result: {},
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })

    it("should reject response with ok: false", () => {
      const response = {
        ok: false,
        result: {
          suggestions: [
            { word: "delighted", confidence: 0.95 },
            { word: "pleased", confidence: 0.9 },
            { word: "satisfied", confidence: 0.85 },
            { word: "content", confidence: 0.8 },
            { word: "thrilled", confidence: 0.75 }
          ]
        },
        status: { message: "Word alternatives generated successfully" },
        error: null,
        timestamp: "2025-07-11T18:39:32.378Z"
      }

      const result = AiWordResponseSchema.safeParse(response)
      expect(result.success).toBe(false)
    })
  })
})

describe("AI Word Request Edge Cases", () => {
  it("should handle unicode characters in single mode", () => {
    const request = {
      mode: "single",
      word: "café"
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it("should handle unicode characters in context mode", () => {
    const request = {
      mode: "context",
      text: "Je suis très heureux du résultat.",
      target_word: "heureux"
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it("should handle special characters in words", () => {
    const request = {
      mode: "single",
      word: "well-being"
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it("should handle multiline text in context mode", () => {
    const request = {
      mode: "context",
      text: "This is a long paragraph.\n\nI am very happy about the result.\n\nIt's really great!",
      target_word: "happy"
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it("should handle exact length limits", () => {
    const request = {
      mode: "single",
      word: "a".repeat(100) // Exactly 100 chars, should pass
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it("should handle exact text length limits", () => {
    const request = {
      mode: "context",
      text: "a".repeat(5000), // Exactly 5000 chars, should pass
      target_word: "happy"
    }

    const result = AiWordRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })
})
