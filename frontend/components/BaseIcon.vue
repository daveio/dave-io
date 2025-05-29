<script lang="ts" setup>
import { computed } from "vue"

const props = defineProps({
  name: {
    type: String,
    default: "i-line-md-iconify1"
  },
  tag: {
    type: String,
    default: "span"
  },
  width: {
    type: String,
    default: ""
  },
  height: {
    type: String,
    default: ""
  },
  link: {
    type: String,
    default: ""
  }
})

const addUnit = (val: string) => {
  if (val && !(val.endsWith("px") || val.endsWith("em"))) {
    return `${val}px`
  }
  return val
}

const _iconStyle = computed(() => {
  const width = addUnit(props.width) || addUnit(props.height) || "20px"
  const height = addUnit(props.height) || width
  const display = "inline-block"
  return {
    width,
    height,
    display
  }
})
</script>

<template>
  <a v-if="link" :href="link"
    ><component :is="tag" :class="name" :style="_iconStyle"> </component
  ></a>
  <component v-else :is="tag" :class="name" :style="_iconStyle"> </component>
</template>

<style lang="css" scoped></style>
