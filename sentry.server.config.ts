import * as Sentry from "@sentry/nuxt"

// Determine environment based on SENTRY_ENVIRONMENT
// Falls back to 'development' if not set or not 'production'
const environment = process.env.SENTRY_ENVIRONMENT === "production" ? "production" : "development"

// Adjust sample rates based on environment
const isProduction = environment === "production"

Sentry.init({
  dsn: "https://19712a83d2ff473f8f2d24b41aecc886@o374595.ingest.us.sentry.io/4509836115181568",

  // Nitro error handler
  enableNitroErrorHandler: true,

  // Set the environment
  environment,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: isProduction ? 1.0 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: !isProduction,
})
