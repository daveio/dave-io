import { sentryCloudflareNitroPlugin } from "@sentry/nuxt/module/plugins"
export default defineNitroPlugin(
  sentryCloudflareNitroPlugin({
    dsn: "https://9d89cd983c39d62a5982f0f5cefce01b@o374595.ingest.us.sentry.io/4509822235246592",
    tracesSampleRate: 1.0,
    debug: false,
  }),
)
