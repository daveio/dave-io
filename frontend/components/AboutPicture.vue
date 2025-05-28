<script lang="ts" setup>
import BaseIcon from "./BaseIcon.vue"
</script>
<template>
  <div class="w-[200px]">
    <img src="@/assets/self-2.jpg" alt="Dave Williams" class="rounded-2xl" />
    <p class="text-4xl text-center font-header">Dave Williams</p>
    <p class="text-center font-header">they / them</p>
    <div class="pt-3 text-center">
      <div class="pr-2 inline">
        <BaseIcon link="https://go.dave.io/mastodon" name="i-fa6-brands-mastodon" />
      </div>
      <div class="inline">
        <BaseIcon link="https://go.dave.io/bsky" name="i-ph-butterfly-fill" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/threads" name="i-heroicons-at-symbol-20-solid" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/tumblr" name="i-fa6-brands-square-tumblr" />
      </div>
      <br />
      <div class="inline">
        <BaseIcon link="https://go.dave.io/x" name="i-fa6-brands-square-x-twitter" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/facebook" name="i-fa6-brands-facebook" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/github" name="i-fa6-brands-github" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/linkedin" name="i-fa6-brands-linkedin" />
      </div>
      <br />
      <div class="inline">
        <BaseIcon link="https://go.dave.io/keybase" name="i-fa6-brands-keybase" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/skype" name="i-fa6-brands-skype" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/soundcloud" name="i-fa6-brands-soundcloud" />
      </div>
      <div class="pl-2 inline">
        <BaseIcon link="https://go.dave.io/radio" name="i-lucide-radio-tower" />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
p {
  padding-top: 0.5em;
}
</style>
