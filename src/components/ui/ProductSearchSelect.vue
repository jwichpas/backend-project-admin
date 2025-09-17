<template>
  <div ref="componentRef" class="relative w-full">
    <!-- Input de búsqueda -->
    <div class="relative">
      <Input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="cn(
          'pr-10',
          hasError && 'border-destructive focus-visible:ring-destructive'
        )"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        autocomplete="off"
      />

      <!-- Icono de búsqueda o loading -->
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin text-muted-foreground" />
        <Search v-else class="h-4 w-4 text-muted-foreground" />
      </div>

      <!-- Botón para limpiar -->
      <Button
        v-if="selectedProduct"
        variant="ghost"
        size="icon"
        class="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6"
        @click="clearSelection"
        tabindex="-1"
      >
        <X class="h-3 w-3" />
      </Button>
    </div>

    <!-- Dropdown con resultados -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && (filteredProducts.length > 0 || searchQuery.length > 0)"
        class="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-60 overflow-hidden"
      >
        <!-- Header con contador -->
        <div v-if="searchQuery.length > 0" class="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/50">
          {{ filteredProducts.length }} resultado{{ filteredProducts.length !== 1 ? 's' : '' }}
          {{ searchQuery.length >= minChars ? '' : `(mínimo ${minChars} caracteres)` }}
        </div>

        <!-- Lista de productos -->
        <div class="overflow-y-auto max-h-48">
          <!-- Mensaje cuando no hay suficientes caracteres -->
          <div
            v-if="searchQuery.length < minChars && searchQuery.length > 0"
            class="px-3 py-4 text-sm text-muted-foreground text-center"
          >
            <Search class="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Escribe al menos {{ minChars }} caracteres para buscar</p>
          </div>

          <!-- No hay resultados -->
          <div
            v-else-if="searchQuery.length >= minChars && filteredProducts.length === 0 && !isLoading"
            class="px-3 py-4 text-sm text-muted-foreground text-center"
          >
            <Package class="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No se encontraron productos</p>
            <p class="text-xs mt-1">Intenta con otros términos de búsqueda</p>
          </div>

          <!-- Resultados -->
          <div
            v-for="(product, index) in filteredProducts"
            :key="product.id"
            :class="cn(
              'px-3 py-2 cursor-pointer text-sm border-b border-border/50 last:border-b-0 transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground focus:outline-none',
              index === highlightedIndex && 'bg-accent text-accent-foreground'
            )"
            @click="selectProduct(product)"
            @mouseenter="highlightedIndex = index"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium truncate" v-html="highlightMatch(product.name, searchQuery)"></p>
                  <Badge variant="outline" class="text-xs">
                    {{ product.sku }}
                  </Badge>
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span v-if="product.brand_name" class="truncate">{{ product.brand_name }}</span>
                  <span v-if="product.category_name" class="truncate">• {{ product.category_name }}</span>
                  <span v-if="product.unit_code" class="text-primary">{{ product.unit_code }}</span>
                </div>
              </div>
              <div v-if="showStock" class="text-right ml-2">
                <div class="text-xs font-medium">
                  Stock: {{ formatStock(product.current_stock || 0) }}
                </div>
                <div v-if="product.min_stock" class="text-xs text-muted-foreground">
                  Min: {{ formatStock(product.min_stock) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Indicador de más resultados -->
          <div
            v-if="hasMoreResults"
            class="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/30"
          >
            Mostrando primeros {{ maxResults }} resultados. Refina tu búsqueda para ver más.
          </div>
        </div>

        <!-- Footer con acciones rápidas -->
        <div v-if="searchQuery.length >= minChars" class="border-t bg-muted/30 px-3 py-2">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Navegar: ↑↓ • Seleccionar: Enter</span>
            <span v-if="allowCreate">
              <Button variant="ghost" size="sm" class="h-6 text-xs">
                + Crear producto
              </Button>
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Producto seleccionado (solo lectura) -->
    <div
      v-if="selectedProduct && !isOpen"
      class="mt-2 p-3 bg-muted/50 rounded-lg border"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium truncate">{{ selectedProduct.name }}</p>
            <Badge variant="outline">{{ selectedProduct.sku }}</Badge>
          </div>
          <div class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span v-if="selectedProduct.brand_name">{{ selectedProduct.brand_name }}</span>
            <span v-if="selectedProduct.category_name">• {{ selectedProduct.category_name }}</span>
            <span class="text-primary">{{ selectedProduct.unit_code }}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="clearSelection"
          class="text-muted-foreground hover:text-foreground"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Error state -->
    <p v-if="hasError" class="text-sm text-destructive mt-1">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { cn } from '@/lib/utils'

// Icons
import { Search, Loader2, X, Package } from 'lucide-vue-next'

// Components
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

interface Product {
  id: string
  name: string
  sku: string
  unit_code: string
  brand_name?: string
  category_name?: string
  current_stock?: number
  min_stock?: number
  active: boolean
}

interface Props {
  modelValue?: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
  minChars?: number
  maxResults?: number
  showStock?: boolean
  allowCreate?: boolean
  companyId?: string
  errorMessage?: string
}

interface Emits {
  'update:modelValue': [value: string | null]
  'product-selected': [product: Product | null]
  'create-product': [searchQuery: string]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar producto por nombre, SKU o código...',
  disabled: false,
  required: false,
  minChars: 2,
  maxResults: 50,
  showStock: true,
  allowCreate: false,
  errorMessage: ''
})

const emit = defineEmits<Emits>()

const productsStore = useProductsStore()

// Refs
const componentRef = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const highlightedIndex = ref(-1)
const selectedProduct = ref<Product | null>(null)

// Computed
const hasError = computed(() => !!props.errorMessage)

const filteredProducts = computed(() => {
  if (searchQuery.value.length < props.minChars) return []

  const query = searchQuery.value.toLowerCase().trim()
  const products = productsStore.activeProducts || []

  const filtered = products.filter(product => {
    const searchableText = [
      product.name,
      product.sku,
      product.brand?.name,
      product.category?.name
    ].filter(Boolean).join(' ').toLowerCase()

    // Búsqueda por palabras individuales
    const queryWords = query.split(' ').filter(word => word.length > 0)
    return queryWords.every(word => searchableText.includes(word))
  })

  return filtered.slice(0, props.maxResults)
})

const hasMoreResults = computed(() => {
  if (searchQuery.value.length < props.minChars) return false
  const totalMatches = productsStore.activeProducts?.filter(product => {
    const searchableText = [
      product.name,
      product.sku,
      product.brand?.name,
      product.category?.name
    ].filter(Boolean).join(' ').toLowerCase()

    const query = searchQuery.value.toLowerCase().trim()
    const queryWords = query.split(' ').filter(word => word.length > 0)
    return queryWords.every(word => searchableText.includes(word))
  }).length || 0

  return totalMatches > props.maxResults
})

// Custom debounce function
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(null, args), delay)
  }
}

// Methods
const debouncedSearch = debounce(() => {
  isLoading.value = false
}, 300)

const handleFocus = () => {
  isOpen.value = true
  highlightedIndex.value = -1
}

const handleBlur = (event: FocusEvent) => {
  // Delay closing to allow for option clicks
  setTimeout(() => {
    if (!searchInput.value?.contains(event.relatedTarget as Node)) {
      isOpen.value = false
    }
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredProducts.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredProducts.value[highlightedIndex.value]) {
        selectProduct(filteredProducts.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      isOpen.value = false
      searchInput.value?.blur()
      break
  }
}

const selectProduct = (product: Product) => {
  selectedProduct.value = product
  searchQuery.value = product.name
  isOpen.value = false
  emit('update:modelValue', product.id)
  emit('product-selected', product)
}

const clearSelection = () => {
  selectedProduct.value = null
  searchQuery.value = ''
  emit('update:modelValue', null)
  emit('product-selected', null)
  nextTick(() => {
    searchInput.value?.focus()
  })
}

const highlightMatch = (text: string, query: string): string => {
  if (!query || query.length < props.minChars) return text

  const words = query.toLowerCase().split(' ').filter(word => word.length > 0)
  let result = text

  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi')
    result = result.replace(regex, '<mark style="background-color: #fef3c7; color: #78350f; padding: 0 0.25rem; border-radius: 0.25rem;">$1</mark>')
  })

  return result
}

const formatStock = (value: number): string => {
  return value.toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// Watchers
watch(searchQuery, (newQuery) => {
  if (newQuery.length >= props.minChars) {
    isLoading.value = true
    debouncedSearch()
  } else {
    isLoading.value = false
  }

  highlightedIndex.value = -1

  // Si el usuario está escribiendo, limpiar selección
  if (selectedProduct.value && newQuery !== selectedProduct.value.name) {
    selectedProduct.value = null
    emit('update:modelValue', null)
    emit('product-selected', null)
  }
})

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    clearSelection()
  } else if (!selectedProduct.value || selectedProduct.value.id !== newValue) {
    // Buscar el producto en el store
    const product = productsStore.activeProducts?.find(p => p.id === newValue)
    if (product) {
      selectedProduct.value = product
      searchQuery.value = product.name
    }
  }
})

// Lifecycle
onMounted(async () => {
  // Cargar productos si no están cargados
  if (props.companyId && (!productsStore.activeProducts || productsStore.activeProducts.length === 0)) {
    await productsStore.fetchProducts(props.companyId)
  }
})

// Click outside handler
const handleClickOutside = (event: Event) => {
  if (componentRef.value && !componentRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

