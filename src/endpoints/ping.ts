import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

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
							service: z.string(),
							response: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context) {
		c.env.ANALYTICS.writeDataPoint({
			blobs: ["ping_request"],
			indexes: ["ping"],
		});
		return c.json({ service: "api", response: "pong" });
	}
}
