import * as Sentry from "@sentry/nuxt"

// Determine environment based on SENTRY_ENVIRONMENT
// Falls back to 'development' if not set or not 'production'
const environment = process.env.SENTRY_ENVIRONMENT === "production" ? "production" : "development"

// Adjust sample rates based on environment
const isProduction = environment === "production"

Sentry.init({
  // If set up, you can use your runtime config here
  // dsn: useRuntimeConfig().public.sentry.dsn,
  dsn: "https://19712a83d2ff473f8f2d24b41aecc886@o374595.ingest.us.sentry.io/4509836115181568",

  // Set the environment
  environment,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: isProduction ? 1.0 : 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: isProduction ? 1.0 : 1.0,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // If you don't want to use Session Replay, just remove the line below:
  integrations: [Sentry.replayIntegration(), Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction,
})
