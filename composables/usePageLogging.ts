/**
 * Composable for client-side page logging
 * Logs page visits and interactions to console in a standardized format
 */
export function usePageLogging() {
  /**
   * Log page visit
   * Format: [PAGE] route | referrer | UA | extras
   */
  const logPageVisit = (route: string, extras?: Record<string, unknown>) => {
    if (typeof window === "undefined") {
      return
    } // Only run on client side

    const referrer = window.document.referrer || "direct"
    const userAgent
      = window.navigator.userAgent.substring(0, 50) + (window.navigator.userAgent.length > 50 ? "..." : "")
    const extrasStr = extras
      ? ` | ${Object.entries(extras)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ")}`
      : ""

    console.log(`[PAGE] ${route} | referrer: ${referrer} | UA: ${userAgent}${extrasStr}`)
  }

  /**
   * Log user interaction
   * Format: [INTERACTION] action | element | extras
   */
  const logInteraction = (action: string, element: string, extras?: Record<string, unknown>) => {
    if (!import.meta.client) {
      return
    } // Only run on client side

    const extrasStr = extras
      ? ` | ${Object.entries(extras)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ")}`
      : ""

    console.log(`[INTERACTION] ${action} | element: ${element}${extrasStr}`)
  }

  /**
   * Log navigation event
   * Format: [NAVIGATION] from -> to | method | extras
   */
  const logNavigation = (
    from: string,
    to: string,
    method: "push" | "replace" | "external" = "push",
    extras?: Record<string, unknown>
  ) => {
    if (!import.meta.client) {
      return
    } // Only run on client side

    const extrasStr = extras
      ? ` | ${Object.entries(extras)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ")}`
      : ""

    console.log(`[NAVIGATION] ${from} -> ${to} | method: ${method}${extrasStr}`)
  }

  return {
    logPageVisit,
    logInteraction,
    logNavigation
  }
}
