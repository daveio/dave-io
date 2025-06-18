<template>
  <div>
    <Subtitle />
    <ProfileInfo />
    <SocialLinks />
    <ExtraLinks />
  </div>
</template>

<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ExtraLinks from "../ui/ExtraLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ProfileInfo from "../ui/ProfileInfo.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import SocialLinks from "../ui/SocialLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Subtitle from "../ui/Subtitle.vue"
</script>