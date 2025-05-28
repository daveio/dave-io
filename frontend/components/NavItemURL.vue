<script lang="ts" setup>
import { computed } from "vue"
import BaseIcon from "./BaseIcon.vue"

const _props = defineProps({
  iconName: {
    type: String,
    default: "i-line-md-iconify1"
  },
  linkText: {
    type: String,
    default: "unnamed"
  },
  linkTarget: {
    type: String,
    default: "#"
  }
})
</script>

<template>
  <h1>
    <BaseIcon :name="iconName" /> &nbsp;
    <a :href="linkTarget" target="_blank">
      {{ linkText }}
    </a>
  </h1>
</template>

<style lang="css" scoped></style>
