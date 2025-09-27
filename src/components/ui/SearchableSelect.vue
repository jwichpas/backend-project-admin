<template>
  <div class="relative" ref="selectContainer">
    <div class="relative">
      <input
        :id="inputId"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        @focus="showDropdown = true"
        @input="handleInput"
        @keydown="handleKeydown"
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'cursor-pointer': !allowSearch && !disabled }"
        :readonly="!allowSearch"
        @click="!allowSearch && !disabled && (showDropdown = !showDropdown)"
      />
      
      <!-- Loading indicator -->
      <div v-if="loading" class="absolute right-8 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
      </div>
      
      <!-- Dropdown arrow -->
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown :class="{ 'rotate-180': showDropdown }" class="h-4 w-4 text-muted-foreground transition-transform duration-200" />
      </div>
    </div>

    <!-- Dropdown -->
    <div 
      v-if="showDropdown && (filteredOptions.length > 0 || loading || emptyMessage)"
      class="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div v-if="loading" class="px-3 py-2 text-sm text-muted-foreground">
        {{ loadingMessage }}
      </div>
      
      <div v-else-if="filteredOptions.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
        {{ emptyMessage }}
      </div>
      
      <div v-else>
        <div
          v-for="(option, index) in filteredOptions"
          :key="getOptionValue(option)"
          @click="selectOption(option)"
          :class="[
            'px-3 py-2 hover:bg-muted cursor-pointer text-sm',
            { 'bg-muted': index === highlightedIndex }
          ]"
        >
          <div class="flex justify-between items-center">
            <span>{{ getOptionLabel(option) }}</span>
            <span v-if="getOptionDescription(option)" class="text-xs text-muted-foreground ml-2">
              {{ getOptionDescription(option) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  modelValue: string | null
  options: any[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  allowSearch?: boolean
  valueKey?: string
  labelKey?: string
  descriptionKey?: string
  inputId?: string
  searchDelay?: number
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'search', query: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...',
  disabled: false,
  loading: false,
  loadingMessage: 'Cargando...',
  emptyMessage: 'No se encontraron opciones',
  allowSearch: true,
  valueKey: 'value',
  labelKey: 'label',
  descriptionKey: '',
  searchDelay: 300
})

const emit = defineEmits<Emits>()

// State
const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const selectContainer = ref<HTMLElement>()
let searchTimeout: number | null = null

// Computed
const filteredOptions = computed(() => {
  if (!props.allowSearch || !searchQuery.value.trim()) {
    return props.options || []
  }

  const query = searchQuery.value.toLowerCase().trim()
  return (props.options || []).filter(option => {
    const label = getOptionLabel(option)
    const description = props.descriptionKey ? getOptionDescription(option) : ''

    return (
      (label && label.toLowerCase().includes(query)) ||
      (description && description.toLowerCase().includes(query))
    )
  })
})

const selectedOption = computed(() => {
  if (!props.modelValue) return null
  return props.options.find(option => getOptionValue(option) === props.modelValue)
})

// Methods
const getOptionValue = (option: any): string => {
  return typeof option === 'object' ? option[props.valueKey] : option
}

const getOptionLabel = (option: any): string => {
  if (typeof option === 'object') {
    return option[props.labelKey] || ''
  }
  return option || ''
}

const getOptionDescription = (option: any): string => {
  return props.descriptionKey && typeof option === 'object' ? option[props.descriptionKey] : ''
}

const handleInput = () => {
  if (!props.allowSearch) return
  
  showDropdown.value = true
  highlightedIndex.value = -1
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Debounce search
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, props.searchDelay)
}

const selectOption = (option: any) => {
  const value = getOptionValue(option)
  emit('update:modelValue', value)
  searchQuery.value = getOptionLabel(option)
  showDropdown.value = false
  highlightedIndex.value = -1
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      highlightedIndex.value = -1
      break
  }
}

const handleClickOutside = (event: Event) => {
  if (selectContainer.value && !selectContainer.value.contains(event.target as Node)) {
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && selectedOption.value) {
    searchQuery.value = getOptionLabel(selectedOption.value)
  } else if (!newValue) {
    searchQuery.value = ''
  }
}, { immediate: true })

watch(() => props.options, (newOptions) => {
  // Update search query if we find a match for the current value
  if (props.modelValue && newOptions.length > 0) {
    const foundOption = newOptions.find(option => getOptionValue(option) === props.modelValue)
    if (foundOption && !searchQuery.value) {
      searchQuery.value = getOptionLabel(foundOption)
    }
  }
}, { deep: true })

watch(showDropdown, (show) => {
  if (show) {
    emit('focus')
    document.addEventListener('click', handleClickOutside)
    nextTick(() => {
      highlightedIndex.value = -1
    })
  } else {
    emit('blur')
    document.removeEventListener('click', handleClickOutside)
  }
})

// Lifecycle
onMounted(() => {
  // Initialize display value
  if (props.modelValue && selectedOption.value) {
    searchQuery.value = getOptionLabel(selectedOption.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>