import { sentryCloudflareNitroPlugin } from "@sentry/nuxt/module/plugins"
import { isProduction } from "~~/shared/util"

// Disable Sentry in production - export no-op plugin
export default isProduction()
  ? defineNitroPlugin(() => {})
  : defineNitroPlugin(
      sentryCloudflareNitroPlugin({
        debug: true,
        dsn: "https://9d89cd983c39d62a5982f0f5cefce01b@o374595.ingest.us.sentry.io/4509822235246592",
        tracesSampleRate: 1.0,
      }),
    )
