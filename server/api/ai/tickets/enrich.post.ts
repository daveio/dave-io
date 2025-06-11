import { createApiResponse } from "~/server/utils/response"
import { AiTicketEnrichRequestSchema, type AiTicketEnrichResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketEnrichResponse> => {
  const { AI } = event.context.cloudflare.env

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

  const aiResponse = await AI.run("@cf/meta/llama-3.2-90b-vision-instruct", {
    messages,
    max_tokens: 1500,
    temperature: 0.4
  })

// TODO: Use a cheaper model if an image is not supplied.

  const description = aiResponse.response?.trim() || "No enriched description generated"

  return createApiResponse({
    ok: true,
    description,
    timestamp: new Date().toISOString()
  })
})
