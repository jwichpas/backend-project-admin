<template>
  <div
    :class="cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  className: ''
})
</script>