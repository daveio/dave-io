export default defineNuxtPlugin((nuxtApp) => {
  // Intercept router navigation to force external handling of /go/** routes
  nuxtApp.hook("app:beforeMount", () => {
    const router = nuxtApp.$router

    // Add navigation guard to catch /go/** routes
    if (router && typeof router === "object" && "beforeEach" in router) {
      const routerWithBeforeEach = router as {
        beforeEach: (guard: (to: { path: string; fullPath: string }, from: unknown, next: () => void) => void) => void
      }
      routerWithBeforeEach.beforeEach((to, from, next) => {
        if (to.path.startsWith("/go/")) {
          // Force external navigation for redirect routes
          window.location.href = to.fullPath
          return false // Prevent the router navigation
        }
        next()
      })
    }
  })

  // Also intercept click events on links to /go/** routes
  if (import.meta.client) {
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement
        const link = target.closest("a")

        if (link && link.href) {
          const url = new URL(link.href)
          if (url.pathname.startsWith("/go/")) {
            // Prevent default click behavior and force external navigation
            event.preventDefault()
            window.location.href = link.href
          }
        }
      },
      { capture: true }
    )
  }
})
