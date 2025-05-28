import { z } from "zod";
import { ErrorResponseSchema, SlugParamSchema } from "./common";
export const RedirectRouteSchema = {
    tags: ["URL Redirection"],
    summary: "Redirect to stored URL",
    description: "Redirects to a URL stored in KV storage based on the provided slug",
    request: {
        params: SlugParamSchema
    },
    responses: {
        301: {
            description: "Permanent redirect to stored URL",
            headers: z.object({
                location: z.string().url().describe("The destination URL")
            })
        },
        302: {
            description: "Temporary redirect to stored URL",
            headers: z.object({
                location: z.string().url().describe("The destination URL")
            })
        },
        404: {
            description: "Redirect not found",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            }
        }
    }
};
//# sourceMappingURL=redirect.js.map