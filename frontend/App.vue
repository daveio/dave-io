<script setup lang="ts">
import AboutPicture from "@/components/AboutPicture.vue"
import FooterContent from "@/components/FooterContent.vue"
import NavItem from "@/components/NavItem.vue"
import NavItemURL from "@/components/NavItemURL.vue"
import { RouterLink, RouterView } from "vue-router"
</script>
<template>
  <div class="text-white flex flex-col h-screen justify-between">
    <div class="h-screen overflow-auto">
      <header class="flex flex-row space-x-5 pt-5 pb-5 pl-5 font-header bg-opacity-50 bg-slate-700 sticky top-0">
        <NavItem iconName="i-ph-user-fill" linkText="about" linkTarget="/" />
        <NavItem iconName="i-ph-gender-nonbinary-fill" linkText="gender" linkTarget="/gender" />
        <NavItemURL iconName="i-ph-read-cv-logo-fill" linkText="cv / resumé" linkTarget="https://cv.dave.io" />
      </header>
      <div class="flex flex-row justify-center">
        <main class="mb-auto mt-5 w-3/5 flex flex-row justify-left space-x-10">
          <div>
            <AboutPicture />
          </div>
          <div class="pl-10">
            <RouterView />
          </div>
        </main>
      </div>
    </div>
    <footer class="font-footer text-right pb-5 pr-5 bg-opacity-50 bg-slate-700 pt-5">
      <FooterContent />
    </footer>
  </div>
</template>
<style scoped></style>
