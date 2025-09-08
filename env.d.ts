/// <reference types="./worker-configuration.d.ts" />

declare module "h3" {
  interface H3EventContext {
    cf: CfProperties
    cloudflare: {
      request: Request
      env: Env
      context: ExecutionContext
    }
    /** Per-request correlation identifier (CF-Ray or generated). */
    requestId?: string
  }
}

export {}
