import { ref } from "vue"
import { defineStore } from "pinia"

// Tracks the most recently visited route for use across the app.
export const useLatestPageStore = defineStore("latestPage", () => {
  const latestPath = ref<string | null>(null)

  const setLatestPath = (path: string) => {
    latestPath.value = path
  }

  return {
    latestPath,
    setLatestPath,
  }
})
