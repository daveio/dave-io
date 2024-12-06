import { Bool, OpenAPIRoute, Str } from "chanfana";
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
              series: z.object({
                success: Bool(),
                redirect: z.object({
                  redirect: Redirect,
                }),
              }),
            }),
          },
        },
      },
      "404": {
        description: "Redirect not found",
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
    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>();

    // Retrieve the validated slug
    const { slug } = data.params;

    // Implement your own object fetch here

    let val = await c.env.GDIO_REDIRECTS.list();
    console.log(val);

    // // @ts-ignore: check if the object exists
    // if (exists === false) {
    //   return Response.json(
    //     {
    //       success: false,
    //     },
    //     {
    //       status: 404,
    //     },
    //   );
    // }

    return {
      success: true,
      redirect: {
        slug: slug,
        url: val,
      },
    };
  }
}
