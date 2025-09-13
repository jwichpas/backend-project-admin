<template>
  <div
    v-if="isOpen"
    :class="cn('absolute z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md', align === 'end' ? 'right-0' : 'left-0', $attrs.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  align?: 'start' | 'end'
}

defineProps<Props>()

defineOptions({
  inheritAttrs: false
})

const isOpen = inject('dropdownOpen', false)
</script>