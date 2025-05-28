import { Hono } from "hono";
type Bindings = Env;
declare const app: Hono<{
    Bindings: Bindings;
}, import("hono/types").BlankSchema, "/">;
export default app;
