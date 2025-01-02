import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Redirect } from "../types";

export class UrlFetch extends OpenAPIRoute {
	schema = {
		tags: ["Redirects"],
		summary: "Get the URL for a redirect by slug",
		request: {
			params: z.object({
				slug: Str({ description: "Redirect slug" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the URL for a redirect",
				content: {
					"application/json": {
						schema: z.object({
							redirect: z.object({
								redirect: Redirect,
							}),
						}),
					},
				},
			},
			"404": {
				description: "Redirect not found",
			},
		},
	};

	async handle(c) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { slug } = data.params;
		c.env.ANALYTICS.writeDataPoint({
			blobs: ["urlFetch_request", slug],
			indexes: ["urlFetch"],
		});
		const val = await c.env.GDIO_REDIRECTS.get(slug);
		if (val === null) {
			return new Response(null, { status: 404 });
		}
		return {
			success: true,
			redirect: {
				slug: slug,
				url: val,
			},
		};
	}
}
