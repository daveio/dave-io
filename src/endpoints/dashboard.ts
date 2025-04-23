import { OpenAPIRoute, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export class Dashboard extends OpenAPIRoute {
	schema = {
		tags: ["Dashboard"],
		summary: "Get dashboard data by name",
		request: {
			params: z.object({
				name: Str({ description: "Dashboard name to retrieve" }),
			}),
		},
		responses: {
			"200": {
				description: "Dashboard data",
				content: {
					"application/json": {
						schema: z.object({
							dashboard: z.string(),
							data: z.record(z.any()),
							timestamp: z.number(),
						}),
					},
				},
			},
			"404": {
				description: "Dashboard not found",
				content: {
					"application/json": {
						schema: z.object({
							error: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name } = data.params;

		c.env.ANALYTICS.writeDataPoint({
			blobs: ["dashboard_request", name],
			indexes: ["dashboard"],
		});

		// Execute different code paths based on dashboard name
		switch (name) {
			case "status":
				return c.json({
					dashboard: name,
					data: { status: "operational", uptime: "99.9%" },
					timestamp: Date.now(),
				});
			case "metrics":
				return c.json({
					dashboard: name,
					data: {
						requests: 1250,
						errors: 12,
						latency: "120ms",
					},
					timestamp: Date.now(),
				});
			case "summary":
				return c.json({
					dashboard: name,
					data: {
						service: "api",
						version: "1.0.0",
						environment: "production",
					},
					timestamp: Date.now(),
				});
			default:
				return c.json({ error: `Dashboard '${name}' not found` }, 404);
		}
	}
}
