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
import ExtraLinks from "./ExtraLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import ProfileInfo from "./ProfileInfo.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import SocialLinks from "./SocialLinks.vue"
// biome-ignore lint/correctness/noUnusedImports: Vue components used in template
import Subtitle from "./Subtitle.vue"
</script>