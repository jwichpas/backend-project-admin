<template>
  <div
    :class="cn('h-px my-1 bg-border', $attrs.class)"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false
})
</script>