import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { Context } from "hono";

export class Ping extends OpenAPIRoute {
  schema = {
    tags: ["Ping"],
    summary: "Ping the API",
    responses: {
      "200": {
        description: "Ping reply",
        content: {
          "application/json": {
            schema: z.object({
              response: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: Context) {
    return c.json({ response: "pong" });
  }
}
