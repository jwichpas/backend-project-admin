<template>
  <div 
    class="relative inline-block" 
    ref="dropdownRef"
    @click.stop
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

provide('dropdownOpen', isOpen)
provide('dropdownToggle', toggle)
provide('dropdownClose', close)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>