<template>
  <input 
    :value="displayValue"
    @input="handleInput"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      $attrs.class as string
    )"
    v-bind="{ ...$attrs, class: undefined }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string | number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  return String(props.modelValue)
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Check if the input has type="number" or has number modifier
  const isNumberInput = target.type === 'number' || target.hasAttribute('data-number')
  
  if (isNumberInput) {
    // For number inputs, emit the numeric value or null for empty strings
    if (value === '' || value === null) {
      emit('update:modelValue', null)
    } else {
      const numericValue = Number(value)
      emit('update:modelValue', isNaN(numericValue) ? value : numericValue)
    }
  } else {
    // For regular inputs, emit the string value
    emit('update:modelValue', value)
  }
}
</script>