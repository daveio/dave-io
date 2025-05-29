import MainPage from "@/views/MainPage.vue"
import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: MainPage
    },
    {
      path: "/gender",
      name: "gender",
      component: () => import("../views/GenderPage.vue")
    }
  ]
})

export default router
