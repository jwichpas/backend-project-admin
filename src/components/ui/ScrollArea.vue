<template>
  <div 
    :class="cn('relative overflow-hidden', $attrs.class as string)"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <div class="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>

<style scoped>
/* Custom scrollbar styles for webkit browsers */
:deep(.overflow-auto) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

:deep(.overflow-auto::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.overflow-auto::-webkit-scrollbar-track) {
  background: transparent;
  border-radius: 9999px;
}

:deep(.overflow-auto::-webkit-scrollbar-thumb) {
  background: hsl(var(--border));
  border-radius: 9999px;
  transition: background-color 0.2s;
}

:deep(.overflow-auto::-webkit-scrollbar-thumb:hover) {
  background: hsl(var(--muted-foreground) / 0.5);
}

:deep(.overflow-auto::-webkit-scrollbar-corner) {
  background: transparent;
}

/* Hide scrollbar by default and show on hover for better UX */
@media (pointer: fine) {
  :deep(.overflow-auto::-webkit-scrollbar) {
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .relative:hover :deep(.overflow-auto::-webkit-scrollbar) {
    opacity: 1;
  }
}
</style>