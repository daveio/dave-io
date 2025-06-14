import { getAIBinding, getCloudflareEnv } from "~/server/utils/cloudflare"
import { createApiResponse } from "~/server/utils/response"
import { AiTicketEnrichRequestSchema, type AiTicketEnrichResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketEnrichResponse> => {
  const env = getCloudflareEnv(event)
  const AI = getAIBinding(env)

  const body = await readBody(event)
  const validatedInput = AiTicketEnrichRequestSchema.parse(body)

  let prompt = `Enrich and improve the following Linear ticket:

Title: ${validatedInput.title}`

  if (validatedInput.description) {
    prompt += `

Current Description:
${validatedInput.description}`
  }

  if (validatedInput.image) {
    prompt += `

Additional context provided via image (filename: ${validatedInput.image.filename})`
  }

  prompt += `

Please provide an enriched description that:
- Builds upon the existing information
- Adds relevant technical context and details
- Includes specific implementation steps or requirements
- Uses proper Markdown formatting
- Incorporates insights from any provided image
- Creates a comprehensive ticket description
- Does not include images in the output

Respond with the complete enriched description only.`

  const messages = [
    {
      role: "user" as const,
      content: validatedInput.image
        ? [
            { type: "text" as const, text: prompt },
            {
              type: "image" as const,
              image: validatedInput.image.data
            }
          ]
        : prompt
    }
  ]

  // Select appropriate model based on whether an image is supplied
  const model = validatedInput.image
    ? "@cf/meta/llama-3.2-11b-vision-instruct" // Use vision model when image is present
    : "@cf/meta/llama-3.2-3b-instruct" // Use cheaper text-only model when no image

  // biome-ignore lint/suspicious/noExplicitAny: AI models have varying message formats
  const aiResponse = await AI.run(model as any, {
    // biome-ignore lint/suspicious/noExplicitAny: AI models accept various message formats
    messages: messages as any,
    max_tokens: 1500,
    temperature: 0.4
  })

  // biome-ignore lint/suspicious/noExplicitAny: AI response has dynamic structure
  const description = (aiResponse as any).response?.trim() || "No enriched description generated"

  // Use type assertion to ensure return type matches expected type
  return createApiResponse({
    result: { description },
    message: "Ticket description enriched successfully",
    error: null
  }) as AiTicketEnrichResponse
})
