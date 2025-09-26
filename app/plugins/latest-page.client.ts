import type { RouteLocationNormalized, RouteLocationNormalizedLoaded, Router } from "vue-router"
import { useLatestPageStore } from "~~/stores/latest-page"

export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router as Router | undefined
  if (!router) {
    return
  }

  const latestPageStore = useLatestPageStore()
  const initialRoute: RouteLocationNormalizedLoaded | undefined = router.currentRoute.value

  if (initialRoute) {
    latestPageStore.setLatestPath(initialRoute.fullPath)
  }

  router.afterEach((to: RouteLocationNormalized) => {
    latestPageStore.setLatestPath(to.fullPath)
  })
})
