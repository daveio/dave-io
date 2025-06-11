import { createApiResponse } from "~/server/utils/response"
import { AiTicketTitleRequestSchema, type AiTicketTitleResponse } from "~/server/utils/schemas"

export default defineEventHandler(async (event): Promise<AiTicketTitleResponse> => {
  const { AI } = event.context.cloudflare.env

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

  const aiResponse = await AI.run("@cf/meta/llama-3.2-90b-vision-instruct", {
    messages,
    max_tokens: 100,
    temperature: 0.3
  })
  
// TODO: Use a cheaper model if an image is not supplied.

  const title = aiResponse.response?.trim() || "Untitled Task"

  return createApiResponse({
    ok: true,
    title,
    timestamp: new Date().toISOString()
  })
})
