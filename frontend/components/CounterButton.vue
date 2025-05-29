<script lang="ts" setup>
import { ref } from "vue"
const _count = ref(0)
</script>

<template>
  <button @click="_count++">You clicked me {{ _count }} times.</button>
</template>

<style lang="css" scoped></style>
