<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click="handleOverlayClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/80" />
      
      <!-- Dialog content -->
      <div class="relative" @click.stop>
        <slot :close="() => emit('update:open', false)" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  open?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('update:open', false)
  }
}

// Close on Escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) {
    emit('update:open', false)
  }
}

// Add/remove event listener when dialog opens/closes
import { watch } from 'vue'

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>