import * as Sentry from "@sentry/nuxt"
Sentry.init({
  // If set up, you can use the Nuxt runtime config here
  // dsn: useRuntimeConfig().public.sentry.dsn
  // modify depending on your custom runtime config
  dsn: "https://9d89cd983c39d62a5982f0f5cefce01b@o374595.ingest.us.sentry.io/4509822235246592",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  //  session-replay
  // Replay may only be enabled for the client-side
  integrations: [
    Sentry.replayIntegration(),
    //  user-feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
    //  user-feedback
  ],
  //  session-replay
  //  performance
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  //  performance
  //  session-replay
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  //  session-replay
  //  logs
  // Enable logs to be sent to Sentry
  enableLogs: true,
  //  logs
})
