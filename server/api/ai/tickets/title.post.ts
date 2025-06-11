import { createApiResponse } from "~/server/utils/response"
import { AiTicketTitleRequestSchema, type AiTicketTitleResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketTitleResponse> => {
  // Use type assertion to fix the unknown type
  const { AI } = event.context.cloudflare.env as { AI: any }

  const body = await readBody(event)
  const validatedInput = AiTicketTitleRequestSchema.parse(body)

  let prompt = ""

  if (validatedInput.description && validatedInput.image) {
    prompt = `Generate a concise, one-line title for a Linear ticket based on the following description and image:

Description:
${validatedInput.description}

Image filename: ${validatedInput.image.filename}

The title should be short, clear, and actionable. Use basic Markdown formatting if appropriate. Respond with just the title, nothing else.`
  } else if (validatedInput.description) {
    prompt = `Generate a concise, one-line title for a Linear ticket based on the following description:

${validatedInput.description}

The title should be short, clear, and actionable. Use basic Markdown formatting if appropriate. Respond with just the title, nothing else.`
  } else if (validatedInput.image) {
    prompt = `Generate a concise, one-line title for a Linear ticket based on this image (filename: ${validatedInput.image.filename}).

The title should be short, clear, and actionable. Use basic Markdown formatting if appropriate. Respond with just the title, nothing else.`
  }

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
    ? "@cf/meta/llama-3.2-90b-vision-instruct" // Use vision model when image is present
    : "@cf/meta/llama-3.2-90b-instruct"        // Use cheaper text-only model when no image

  const aiResponse = await AI.run(model, {
    messages,
    max_tokens: 100,
    temperature: 0.3
  })

  const title = aiResponse.response?.trim() || "Untitled Task"

  // Use type assertion to ensure return type matches expected type
  return createApiResponse({ title }, "Title generated successfully", null) as AiTicketTitleResponse
})
