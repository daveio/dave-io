// server/plugins/sentry-cloudflare-plugin.ts
import { sentryCloudflareNitroPlugin } from "@sentry/nuxt/module/plugins"

export default defineNitroPlugin(
  sentryCloudflareNitroPlugin({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "production"
  })
)
