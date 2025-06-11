import { createApiResponse } from "~/server/utils/response"
import { AiTicketDescriptionRequestSchema, type AiTicketDescriptionResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketDescriptionResponse> => {
  const { AI } = event.context.cloudflare.env

  const body = await readBody(event)
  const validatedInput = AiTicketDescriptionRequestSchema.parse(body)

  const prompt = `Generate a detailed description for a Linear ticket with the title: "${validatedInput.title}"

The description should:
- Provide clear context and background
- Include specific actionable steps or requirements
- Use proper Markdown formatting
- Include any relevant technical details
- Be structured and easy to understand
- Not include images in the output

Format the response as a proper ticket description that a developer could work from.`

  const messages = [
    {
      role: "user" as const,
      content: prompt
    }
  ]

  const aiResponse = await AI.run("@cf/meta/llama-3.2-90b-vision-instruct", {
    messages,
    max_tokens: 1000,
    temperature: 0.4
  })

  const description = aiResponse.response?.trim() || "No description generated"

  return createApiResponse({
    ok: true,
    description,
    timestamp: new Date().toISOString()
  })
})
