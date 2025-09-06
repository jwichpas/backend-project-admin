<template>
  <div 
    :class="cn('rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md', $attrs.class as string)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{
  indicator?: 'line' | 'dot' | 'dashed'
}>()
</script>