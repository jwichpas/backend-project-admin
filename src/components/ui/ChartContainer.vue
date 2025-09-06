<template>
  <div 
    :class="cn('aspect-auto w-full', $attrs.class as string)"
    :style="{ '--config': JSON.stringify(config) }"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

defineProps<{
  config: ChartConfig
}>()
</script>