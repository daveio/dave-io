/// <reference types="@cloudflare/workers-types" />
/**
 * This is a stub class for the RouterOSCache Durable Object
 * It's included solely to allow the migration to delete it
 */
export class RouterOSCache {
  state: DurableObjectState;
  env: Record<string, unknown>;

  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    this.state = state;
    this.env = env;
  }

  async fetch(_request: Request): Promise<Response> {
    return new Response("This is a stub class for migration purposes", { status: 410 });
  }
}
