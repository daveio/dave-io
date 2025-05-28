import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { getRedirect, trackRedirectClick } from "../kv/redirect";
export class Go extends OpenAPIRoute {
    schema = {
        tags: ["Go"],
        summary: "Redirect to a URL by slug",
        request: {
            params: z
                .object({
                slug: Str({ description: "Redirect slug" })
            })
                .passthrough() // social networks add random GET params
        },
        responses: {
            "302": {
                description: "Redirects to a URL"
            },
            "404": {
                description: "Redirect not found"
            }
        }
    };
    async handle(c) {
        const slug = c.req.param("slug");
        if (!slug) {
            return new Response(null, { status: 404 });
        }
        // Track request in analytics
        c.env.ANALYTICS.writeDataPoint({
            blobs: ["go_redirect_request", slug],
            indexes: ["go"]
        });
        // Get the redirect using the existing KV utility function
        const redirect = await getRedirect(c.env, slug);
        if (!redirect) {
            return new Response(null, { status: 404 });
        }
        // Track the redirect click
        await trackRedirectClick(c.env, slug);
        // Perform the actual redirect
        return Response.redirect(redirect.url, 302);
    }
}
//# sourceMappingURL=go.js.map