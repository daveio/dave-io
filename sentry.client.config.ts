import * as Sentry from "@sentry/nuxt"
import { isProduction } from "./shared/util"

// Disable Sentry in production
if (!isProduction()) {
  Sentry.init({
    debug: true,
    dsn: "https://9d89cd983c39d62a5982f0f5cefce01b@o374595.ingest.us.sentry.io/4509822235246592",
    sendDefaultPii: true,
    integrations: [
      Sentry.replayIntegration(),
      Sentry.feedbackIntegration({
        colorScheme: "system",
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
  })
}
