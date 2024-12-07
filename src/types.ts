import { Str } from "chanfana";
import { z } from "zod";

export const Redirect = z.object({
	slug: Str({ example: "hello" }),
	url: Str({ example: "https://dave.io" }),
});
