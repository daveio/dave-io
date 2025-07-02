import { getAIBinding, getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiResponse } from "~/server/utils/response"
import { AiTicketDescriptionRequestSchema } from "~/server/utils/schemas"
import type { AiTicketDescriptionResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketDescriptionResponse> => {
  const env = getCloudflareEnv(event)
  const AI = getAIBinding(env)

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

  // Use a cheaper text-only model since this endpoint never needs vision capabilities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiResponse = await AI.run("@cf/meta/llama-3.2-3b-instruct" as any, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    max_tokens: 1000,
    temperature: 0.4
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const description = (aiResponse as any).response?.trim() || "No description generated"

  // Use type assertion to ensure return type matches expected type
  return createApiResponse({
    result: { description },
    message: "Description generated successfully",
    error: null
  }) as AiTicketDescriptionResponse
})
