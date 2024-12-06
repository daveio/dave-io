import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { Redirect } from "../types";

export class UrlList extends OpenAPIRoute {
  schema = {
    tags: ["Redirects"],
    summary: "Get all redirect URLs",
    request: {
      params: z.object({}),
    },
    responses: {
      "200": {
        description: "Returns all redirects",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                redirects: z.array(
                  z.object({
                    slug: Str(),
                    redirect: Redirect,
                  }),
                ),
              }),
            }),
          },
        },
      },
      "404": {
        description: "No redirects found",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    let val = await c.env.GDIO_REDIRECTS.list();
    if (val === null) {
      return Response.json(
        {
          success: false,
        },
        {
          status: 404,
        },
      );
    } else {
      return {
        success: true,
        redirects: val,
      };
    }
  }
}
