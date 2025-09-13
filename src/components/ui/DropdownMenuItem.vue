<template>
  <div
    :class="cn('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', $attrs.class)"
    @click="handleClick"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '@/lib/utils'

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const close = inject('dropdownClose', () => {})

const handleClick = (event: MouseEvent) => {
  emit('click', event)
  close()
}

defineOptions({
  inheritAttrs: false
})
</script>