<template>
  <Card class="mb-6">
    <CardContent class="p-6">
      <div class="space-y-4">
        <!-- Search and main filters row -->
        <div class="grid gap-4 md:grid-cols-6">
          <!-- Product Search -->
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              Buscar Producto
            </label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                v-model="searchForm.productQuery"
                placeholder="Nombre o SKU del producto..."
                class="pl-10"
                @input="onSearchInput"
              />
              <Button
                v-if="searchForm.productQuery"
                variant="ghost"
                size="icon"
                class="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                @click="clearSearch"
              >
                <X class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Warehouse selector -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">Almacén</label>
            <select
              v-model="searchForm.warehouseId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @change="onWarehouseChange"
            >
              <option value="">Todos los almacenes</option>
              <option
                v-for="warehouse in warehouses"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>

          <!-- Zone selector -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">Zona</label>
            <select
              v-model="searchForm.zoneId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @change="onZoneChange"
            >
              <option value="">Todas las zonas</option>
              <option
                v-for="zone in filteredZones"
                :key="zone.id"
                :value="zone.id"
              >
                {{ zone.code }} - {{ zone.name }}
              </option>
            </select>
          </div>

          <!-- Stock status filter -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">Stock</label>
            <select
              v-model="searchForm.stockStatus"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @change="onStockStatusChange"
            >
              <option value="">Todos</option>
              <option value="in_stock">Con stock</option>
              <option value="low_stock">Stock bajo</option>
              <option value="empty">Sin stock</option>
              <option value="full">Lleno</option>
            </select>
          </div>

          <!-- Location type filter -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
            <select
              v-model="searchForm.locationType"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @change="onLocationTypeChange"
            >
              <option value="">Todas</option>
              <option value="principal">Principales</option>
              <option value="secondary">Secundarias</option>
            </select>
          </div>
        </div>

        <!-- Advanced filters (collapsible) -->
        <div class="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            @click="showAdvanced = !showAdvanced"
            class="mb-3"
          >
            <ChevronDown
              :class="[
                'h-4 w-4 mr-1 transition-transform',
                showAdvanced ? 'rotate-180' : ''
              ]"
            />
            {{ showAdvanced ? 'Ocultar' : 'Mostrar' }} Filtros Avanzados
          </Button>

          <div v-if="showAdvanced" class="grid gap-4 md:grid-cols-4">
            <!-- Position range filters -->
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">
                Posición X (metros)
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="searchForm.positionX.min"
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
                <Input
                  v-model="searchForm.positionX.max"
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">
                Posición Y (metros)
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="searchForm.positionY.min"
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
                <Input
                  v-model="searchForm.positionY.max"
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">
                Posición Z (metros)
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="searchForm.positionZ.min"
                  type="number"
                  placeholder="Min"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
                <Input
                  v-model="searchForm.positionZ.max"
                  type="number"
                  placeholder="Max"
                  step="0.1"
                  class="text-xs"
                  @input="onPositionChange"
                />
              </div>
            </div>

            <!-- Capacity filter -->
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">
                Capacidad (unidades)
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="searchForm.capacity.min"
                  type="number"
                  placeholder="Min"
                  class="text-xs"
                  @input="onCapacityChange"
                />
                <Input
                  v-model="searchForm.capacity.max"
                  type="number"
                  placeholder="Max"
                  class="text-xs"
                  @input="onCapacityChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Quick actions and filter summary -->
        <div class="flex items-center justify-between border-t pt-4">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Active filters display -->
            <div v-if="activeFiltersCount > 0" class="flex items-center gap-2 flex-wrap">
              <span class="text-sm text-gray-600">Filtros activos:</span>
              <Badge variant="secondary" class="text-xs">
                {{ activeFiltersCount }} {{ activeFiltersCount === 1 ? 'filtro' : 'filtros' }}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                @click="clearAllFilters"
                class="text-xs h-6"
              >
                <X class="h-3 w-3 mr-1" />
                Limpiar todo
              </Button>
            </div>
            
            <div v-else class="text-sm text-gray-500">
              Sin filtros activos
            </div>
          </div>

          <!-- Quick filter buttons -->
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="applyQuickFilter('principal')"
              :class="{ 'bg-blue-50 border-blue-300': searchForm.locationType === 'principal' }"
            >
              <MapPin class="h-3 w-3 mr-1" />
              Solo Principales
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              @click="applyQuickFilter('low_stock')"
              :class="{ 'bg-amber-50 border-amber-300': searchForm.stockStatus === 'low_stock' }"
            >
              <AlertTriangle class="h-3 w-3 mr-1" />
              Stock Bajo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              @click="applyQuickFilter('empty')"
              :class="{ 'bg-red-50 border-red-300': searchForm.stockStatus === 'empty' }"
            >
              <AlertCircle class="h-3 w-3 mr-1" />
              Sin Stock
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, X, ChevronDown, MapPin, AlertTriangle, AlertCircle } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import type { Warehouse, WarehouseZone } from '@/stores/products'

interface SearchFilters {
  productQuery: string
  warehouseId: string
  zoneId: string
  stockStatus: 'in_stock' | 'low_stock' | 'empty' | 'full' | ''
  locationType: 'principal' | 'secondary' | ''
  positionX: { min: number | null; max: number | null }
  positionY: { min: number | null; max: number | null }
  positionZ: { min: number | null; max: number | null }
  capacity: { min: number | null; max: number | null }
}

interface Props {
  warehouses: Warehouse[]
  zones: WarehouseZone[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  filtersChanged: [filters: SearchFilters]
  warehouseSelected: [warehouseId: string]
  productSearched: [query: string]
}>()

// State
const showAdvanced = ref(false)
const searchForm = ref<SearchFilters>({
  productQuery: '',
  warehouseId: '',
  zoneId: '',
  stockStatus: '',
  locationType: '',
  positionX: { min: null, max: null },
  positionY: { min: null, max: null },
  positionZ: { min: null, max: null },
  capacity: { min: null, max: null }
})

// Computed
const filteredZones = computed(() => {
  if (!searchForm.value.warehouseId) return props.zones
  return props.zones.filter(zone => zone.warehouse_id === searchForm.value.warehouseId)
})

const activeFiltersCount = computed(() => {
  let count = 0
  
  if (searchForm.value.productQuery) count++
  if (searchForm.value.warehouseId) count++
  if (searchForm.value.zoneId) count++
  if (searchForm.value.stockStatus) count++
  if (searchForm.value.locationType) count++
  
  // Position filters
  if (searchForm.value.positionX.min !== null || searchForm.value.positionX.max !== null) count++
  if (searchForm.value.positionY.min !== null || searchForm.value.positionY.max !== null) count++
  if (searchForm.value.positionZ.min !== null || searchForm.value.positionZ.max !== null) count++
  
  // Capacity filter
  if (searchForm.value.capacity.min !== null || searchForm.value.capacity.max !== null) count++
  
  return count
})

// Methods
const emitFiltersChanged = () => {
  emit('filtersChanged', { ...searchForm.value })
}

const onSearchInput = () => {
  emit('productSearched', searchForm.value.productQuery)
  emitFiltersChanged()
}

const onWarehouseChange = () => {
  // Reset zone when warehouse changes
  searchForm.value.zoneId = ''
  emit('warehouseSelected', searchForm.value.warehouseId)
  emitFiltersChanged()
}

const onZoneChange = () => {
  emitFiltersChanged()
}

const onStockStatusChange = () => {
  emitFiltersChanged()
}

const onLocationTypeChange = () => {
  emitFiltersChanged()
}

const onPositionChange = () => {
  emitFiltersChanged()
}

const onCapacityChange = () => {
  emitFiltersChanged()
}

const clearSearch = () => {
  searchForm.value.productQuery = ''
  onSearchInput()
}

const clearAllFilters = () => {
  searchForm.value = {
    productQuery: '',
    warehouseId: '',
    zoneId: '',
    stockStatus: '',
    locationType: '',
    positionX: { min: null, max: null },
    positionY: { min: null, max: null },
    positionZ: { min: null, max: null },
    capacity: { min: null, max: null }
  }
  emitFiltersChanged()
}

const applyQuickFilter = (filterType: string) => {
  switch (filterType) {
    case 'principal':
      if (searchForm.value.locationType === 'principal') {
        searchForm.value.locationType = ''
      } else {
        searchForm.value.locationType = 'principal'
      }
      break
    case 'low_stock':
      if (searchForm.value.stockStatus === 'low_stock') {
        searchForm.value.stockStatus = ''
      } else {
        searchForm.value.stockStatus = 'low_stock'
      }
      break
    case 'empty':
      if (searchForm.value.stockStatus === 'empty') {
        searchForm.value.stockStatus = ''
      } else {
        searchForm.value.stockStatus = 'empty'
      }
      break
  }
  emitFiltersChanged()
}

// Watch for warehouse changes to reset zone
watch(() => searchForm.value.warehouseId, () => {
  searchForm.value.zoneId = ''
})

// Export the filters for parent component access
defineExpose({
  searchForm,
  clearAllFilters,
  applyQuickFilter
})
</script>