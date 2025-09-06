<template>
  <div class="relative">
    <button
      type="button"
      :class="selectClass"
      @click="isOpen = !isOpen"
      @blur="handleBlur"
    >
      <span class="block truncate text-left">{{ displayValue }}</span>
      <ChevronDown 
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200" 
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
        :class="dropdownClass"
      >
        <div class="max-h-60 overflow-auto py-1">
          <div
            v-for="option in options"
            :key="getOptionValue(option)"
            class="relative cursor-pointer select-none px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            :class="{ 'bg-accent text-accent-foreground': getOptionValue(option) === modelValue }"
            @click="selectOption(option)"
          >
            <span class="block truncate">{{ getOptionLabel(option) }}</span>
            <Check
              v-if="getOptionValue(option) === modelValue"
              class="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface SelectProps {
  modelValue?: string | number | null
  options?: any[]
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
  valueKey?: string
  labelKey?: string
  dropdownClass?: string
}

interface SelectEmits {
  'update:modelValue': [value: string | number | null]
}

const props = withDefaults(defineProps<SelectProps>(), {
  placeholder: 'Seleccionar...',
  disabled: false,
  size: 'default',
  valueKey: 'value',
  labelKey: 'label',
  dropdownClass: 'top-full mt-1',
  options: () => []
})

const emit = defineEmits<SelectEmits>()

const isOpen = ref(false)

const selectClass = computed(() => cn(
  'relative w-full cursor-pointer rounded-md border border-input bg-background text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    'h-10 px-3 py-2 text-sm': props.size === 'default',
    'h-9 px-3 py-1.5 text-sm': props.size === 'sm',
    'h-11 px-4 py-2.5': props.size === 'lg',
  },
  props.disabled && 'cursor-not-allowed opacity-50'
))


const displayValue = computed(() => {
  if (props.modelValue == null) return props.placeholder
  
  const selectedOption = props.options.find(option => 
    getOptionValue(option) === props.modelValue
  )
  
  return selectedOption ? getOptionLabel(selectedOption) : props.placeholder
})

const getOptionValue = (option: any) => {
  if (typeof option === 'string' || typeof option === 'number') return option
  return option[props.valueKey]
}

const getOptionLabel = (option: any) => {
  if (typeof option === 'string' || typeof option === 'number') return option
  return option[props.labelKey]
}

const selectOption = (option: any) => {
  const value = getOptionValue(option)
  emit('update:modelValue', value)
  isOpen.value = false
}

const handleBlur = async (e: FocusEvent) => {
  // Small delay to allow option clicks to register
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>