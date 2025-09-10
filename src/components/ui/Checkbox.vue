<template>
  <label :class="wrapperClass">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
      :class="checkboxClass"
    />
    <span v-if="$slots.default" :class="labelClass">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  modelValue?: boolean
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}

const wrapperClass = computed(() => cn(
  'flex items-center gap-2 cursor-pointer',
  props.disabled && 'cursor-not-allowed opacity-50'
))

const checkboxClass = computed(() => cn(
  'rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    'h-3 w-3': props.size === 'sm',
    'h-4 w-4': props.size === 'default',
    'h-5 w-5': props.size === 'lg',
  }
))

const labelClass = computed(() => cn(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  props.disabled && 'cursor-not-allowed opacity-50'
))
</script>