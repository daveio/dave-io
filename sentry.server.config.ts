import * as Sentry from "@sentry/nuxt"

Sentry.init({
  dsn: "https://9d89cd983c39d62a5982f0f5cefce01b@o374595.ingest.us.sentry.io/4509822235246592",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false
})
