export function isProduction() {
  return process.env.SENTRY_ENVIRONMENT === "production"
}
