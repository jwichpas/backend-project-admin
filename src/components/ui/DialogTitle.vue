<template>
  <h2
    :class="cn(
      'text-lg font-semibold leading-none tracking-tight',
      $attrs.class as string
    )"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <slot />
  </h2>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>