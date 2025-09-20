<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
    <!-- Grid Background Pattern -->
    <div class="absolute inset-0 opacity-30">
      <div class="grid-bg"></div>
    </div>

    <!-- Header con Búsqueda Avanzada -->
    <div class="relative z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div class="w-full px-6 py-4">
        <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <!-- Title -->
          <div class="flex items-center gap-3">
            <div class="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">Gestión de Almacén</h1>
              <p class="text-sm text-gray-500">Vista de tarjetas profesional</p>
            </div>
          </div>

          <!-- Búsqueda Avanzada -->
          <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <!-- Búsqueda Principal con Autocompletado -->
            <div class="relative" ref="searchContainer">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Buscar productos por nombre o SKU..."
                class="block w-72 pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-sm transition-all duration-200"
                @input="onSearchInput"
                @focus="showDropdown = true"
                @keydown="handleKeyDown"
                autocomplete="off"
              />
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>

              <!-- Dropdown de Autocompletado -->
              <div
                v-if="showDropdown && filteredProducts.length > 0"
                class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto"
              >
                <div class="p-2">
                  <div class="text-xs font-medium text-gray-500 mb-2 px-3">
                    {{ filteredProducts.length }} producto{{ filteredProducts.length !== 1 ? 's' : '' }} encontrado{{ filteredProducts.length !== 1 ? 's' : '' }}
                  </div>
                  <div
                    v-for="(product, index) in filteredProducts"
                    :key="product.id"
                    :class="[
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150',
                      selectedDropdownIndex === index
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    ]"
                    @click="selectProduct(product)"
                    @mouseenter="selectedDropdownIndex = index"
                  >
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 text-sm">
                        {{ product.product_name }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        SKU: {{ product.product_sku }}
                      </div>
                      <div class="text-xs text-blue-600 mt-1 font-medium">
                        📍 {{ product.full_location_code }}
                      </div>
                    </div>
                    <div class="ml-3 text-right">
                      <div class="text-sm font-semibold text-gray-900">
                        Stock: {{ product.stock_actual || 0 }}
                      </div>
                      <div :class="[
                        'text-xs px-2 py-1 rounded-full font-medium',
                        product.stock_actual > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      ]">
                        {{ product.stock_actual > 0 ? 'Disponible' : 'Sin stock' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filtros -->
            <div class="flex gap-2">
              <select
                v-model="statusFilter"
                class="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-sm"
              >
                <option value="">Estado</option>
                <option value="libre">Libre</option>
                <option value="ocupado">Ocupado</option>
                <option value="reservado">Reservado</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>

              <select
                v-model="zoneFilter"
                class="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-sm"
              >
                <option value="">Zona</option>
                <option v-for="zone in availableZones" :key="zone.id" :value="zone.id">
                  {{ zone.code }} - {{ zone.name }}
                </option>
              </select>

              <button
                @click="clearFilters"
                class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="relative z-10 w-full px-6 py-8">
      <!-- Stats Cards -->


      <!-- Warehouse Zones Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
        <div
          v-for="zone in filteredZones"
          :key="zone.id"
          class="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 p-6"
        >
          <!-- Header Zona -->
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: zone.color_hex || '#3B82F6' }"></div>
              <h2 class="text-lg font-semibold text-gray-800">{{ zone.code || zone.name }}</h2>
            </div>
            <span
              class="px-3 py-1 text-xs rounded-full font-medium"
              :class="getOccupancyBadgeClass(zone.occupancy)"
            >
              {{ Math.round(zone.occupancy) }}% ocupado
            </span>
          </div>

          <!-- Barra de ocupación -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getOccupancyBarClass(zone.occupancy)"
              :style="{ width: zone.occupancy + '%' }"
            ></div>
          </div>

          <!-- Aisles -->
          <div class="space-y-6">
            <div
              v-for="aisle in getAislesForZone(zone.id)"
              :key="aisle.id"
            >
              <h3 class="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                {{ aisle.code || aisle.name }}
              </h3>

              <div class="flex flex-wrap gap-4">
                <!-- Shelves -->
                <div
                  v-for="shelf in getShelvesForAisle(aisle.id)"
                  :key="shelf.id"
                  :data-shelf-id="shelf.id"
                  :class="[
                    'bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200',
                    hasHighlightedProduct(shelf.id) ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                  ]"
                  @drop="handleDrop($event, shelf)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <span class="block text-xs text-gray-500 mb-3 text-center font-medium">
                    {{ shelf.code || `Estante ${shelf.id}` }}
                  </span>

                  <!-- Positions Grid -->
                  <div class="grid grid-cols-5 gap-1.5">
                    <div
                      v-for="position in getPositionsForShelf(shelf.id)"
                      :key="position.id"
                      :class="[
                        getPositionClass(position),
                        isHighlightedProduct(position) ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-110 z-10' : ''
                      ]"
                      class="w-9 h-9 rounded-lg text-white text-xs flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200 font-medium shadow-sm relative"
                      :draggable="position.status === 'ocupado'"
                      @dragstart="handleDragStart($event, position)"
                      @click="handlePositionClick(position)"
                      :title="getPositionTooltip(position)"
                    >
                      {{ position.position_number || position.id }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredZones.length === 0" class="text-center py-16">
        <div class="max-w-md mx-auto">
          <div class="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
          <p class="text-gray-500">Prueba ajustando los filtros de búsqueda o limpia los filtros para ver todas las zonas.</p>
        </div>
      </div>
    </div>

    <!-- Product Info Modal -->
    <div
      v-if="selectedPosition"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Posición {{ selectedPosition.position_code }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="selectedPosition.status === 'ocupado'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <p class="text-gray-900">{{ selectedPosition.product_name || 'Sin nombre' }}</p>

            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">SKU</label>
            <p class="text-gray-900 font-mono">{{ selectedPosition.product_sku || 'N/A' }}</p>

            <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Stock</label>
            <p class="text-gray-900 font-semibold">{{ selectedPosition.stock_actual || 0 }} unidades</p>
          </div>

          <div v-else-if="selectedPosition.status === 'reservado'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <p class="text-gray-900">{{ selectedPosition.notes || 'Reservado para mantenimiento' }}</p>
          </div>

          <div v-else>
            <p class="text-gray-500">Posición libre disponible para asignar.</p>
          </div>

          <div class="pt-4 border-t">
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span
              class="inline-flex px-3 py-1 text-xs rounded-full font-medium"
              :class="getStatusBadgeClass(selectedPosition.status)"
            >
              {{ getStatusLabel(selectedPosition.status) }}
            </span>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            v-if="selectedPosition.status === 'libre'"
            @click="assignProduct"
            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Asignar Producto
          </button>
          <button
            v-if="selectedPosition.status === 'ocupado'"
            @click="removeProduct"
            class="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Remover Producto
          </button>
          <button
            @click="closeModal"
            class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type {
  WarehouseVisualizerData,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  ProductLocationDetailed
} from '@/composables/useWarehouseVisualizer'

interface Props {
  warehouseData: WarehouseVisualizerData | null
  filteredLocations: ProductLocationDetailed[]
  loading?: boolean
}

const props = defineProps<Props>()

// State
const searchQuery = ref('')
const statusFilter = ref('')
const zoneFilter = ref('')
const selectedPosition = ref<any>(null)
const draggedProduct = ref<any>(null)

// Autocomplete state
const showDropdown = ref(false)
const selectedDropdownIndex = ref(-1)
const selectedProduct = ref<any>(null)
const highlightedProductId = ref<string | null>(null)

// Refs
const searchInput = ref<HTMLInputElement | null>(null)
const searchContainer = ref<HTMLElement | null>(null)

// Computed Properties
const availableZones = computed(() => {
  // Get zones from warehouseData if available
  const warehouseZones = props.warehouseData?.zones || []

  // Also extract zones from product locations
  const zonesFromLocations = props.filteredLocations.reduce((acc, loc) => {
    const zoneId = loc.zone_id || loc.warehouse_zone_id
    if (zoneId && !acc.find(z => z.id === zoneId)) {
      acc.push({
        id: zoneId,
        code: loc.zone_code || `Z${acc.length + 1}`,
        name: loc.zone_name || `Zona ${acc.length + 1}`,
        warehouse_id: loc.warehouse_id,
        color_hex: getZoneColor(acc.length)
      })
    }
    return acc
  }, [] as any[])

  // Combine both sources, prioritizing warehouseData
  const allZones = [...warehouseZones, ...zonesFromLocations]
  return allZones.reduce((acc, zone) => {
    if (!acc.find(z => z.id === zone.id)) {
      acc.push(zone)
    }
    return acc
  }, [] as any[])
})

const filteredZones = computed(() => {
  let zones = availableZones.value

  // If no zones from data, create default zones for demonstration
  if (zones.length === 0) {
    zones = [
      {
        id: 'demo-zone-1',
        code: 'A',
        name: 'Zona A',
        warehouse_id: props.warehouseData?.warehouse?.id || 'demo-warehouse',
        color_hex: '#3B82F6',
        x_coordinate: 0,
        y_coordinate: 0,
        width: 200,
        length: 150
      },
      {
        id: 'demo-zone-2',
        code: 'B',
        name: 'Zona B',
        warehouse_id: props.warehouseData?.warehouse?.id || 'demo-warehouse',
        color_hex: '#10B981',
        x_coordinate: 250,
        y_coordinate: 0,
        width: 200,
        length: 150
      }
    ]
  }

  if (zoneFilter.value) {
    zones = zones.filter(zone => zone.id === zoneFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    zones = zones.filter(zone => {
      // Buscar en nombre y código de zona
      const zoneMatch = zone.name?.toLowerCase().includes(query) ||
                       zone.code?.toLowerCase().includes(query)

      // Buscar en productos de esta zona
      const productMatch = props.filteredLocations.some(loc => {
        const isInZone = loc.zone_id === zone.id || loc.warehouse_zone_id === zone.id
        const productMatches = (loc.product_name?.toLowerCase().includes(query) ||
                               loc.product_sku?.toLowerCase().includes(query))
        return isInZone && productMatches
      })

      return zoneMatch || productMatch
    })
  }

  return zones.map(zone => ({
    ...zone,
    occupancy: calculateZoneOccupancy(zone.id)
  }))
})

const totalPositions = computed(() => {
  return props.filteredLocations.length
})

const occupiedPositions = computed(() => {
  return props.filteredLocations.filter(loc => loc.stock_actual > 0).length
})

const freePositions = computed(() => {
  return totalPositions.value - occupiedPositions.value
})

const occupancyPercentage = computed(() => {
  if (totalPositions.value === 0) return 0
  return Math.round((occupiedPositions.value / totalPositions.value) * 100)
})

// Filtered products for autocomplete
const filteredProducts = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []

  const query = searchQuery.value.toLowerCase()
  return props.filteredLocations
    .filter(loc =>
      (loc.product_name?.toLowerCase().includes(query) ||
       loc.product_sku?.toLowerCase().includes(query)) &&
      loc.stock_actual > 0
    )
    .slice(0, 10) // Limit to 10 results for performance
    .sort((a, b) => {
      // Priority: exact matches first, then starts with, then contains
      const aName = a.product_name?.toLowerCase() || ''
      const aSku = a.product_sku?.toLowerCase() || ''
      const bName = b.product_name?.toLowerCase() || ''
      const bSku = b.product_sku?.toLowerCase() || ''

      if (aName === query || aSku === query) return -1
      if (bName === query || bSku === query) return 1
      if (aName.startsWith(query) || aSku.startsWith(query)) return -1
      if (bName.startsWith(query) || bSku.startsWith(query)) return 1
      return 0
    })
})

// Helper function to get zone colors
const getZoneColor = (index: number) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
  return colors[index % colors.length]
}

// Methods
const calculateZoneOccupancy = (zoneId: string) => {
  // Use zone_id from the actual data structure
  const zoneLocations = props.filteredLocations.filter(loc =>
    loc.zone_id === zoneId || loc.warehouse_zone_id === zoneId
  )
  if (zoneLocations.length === 0) return 0

  const occupied = zoneLocations.filter(loc => (loc.stock_actual || 0) > 0).length
  return (occupied / zoneLocations.length) * 100
}

const getAislesForZone = (zoneId: string) => {
  // Get unique aisles from product locations for this zone
  const aislesFromLocations = props.filteredLocations
    .filter(loc => loc.zone_id === zoneId || loc.warehouse_zone_id === zoneId)
    .reduce((acc, loc) => {
      const aisleId = loc.aisle_id
      if (aisleId && !acc.find(a => a.id === aisleId)) {
        acc.push({
          id: aisleId,
          code: loc.aisle_code || `A${acc.length + 1}`,
          name: loc.aisle_name || `Pasillo ${acc.length + 1}`,
          warehouse_zone_id: zoneId,
          warehouse_id: loc.warehouse_id
        })
      }
      return acc
    }, [] as any[])

  // Also check warehouseData aisles if available
  const warehouseAisles = props.warehouseData?.aisles?.filter(aisle =>
    aisle.warehouse_zone_id === zoneId
  ) || []

  // Combine both sources
  const allAisles = [...aislesFromLocations, ...warehouseAisles]
  const uniqueAisles = allAisles.reduce((acc, aisle) => {
    if (!acc.find(a => a.id === aisle.id)) {
      acc.push(aisle)
    }
    return acc
  }, [] as any[])

  // If still no aisles found, create a default one
  if (uniqueAisles.length === 0) {
    return [{
      id: `default-aisle-${zoneId}`,
      code: 'A1',
      name: 'Pasillo Principal',
      warehouse_zone_id: zoneId,
      warehouse_id: props.warehouseData?.warehouse?.id || ''
    }]
  }

  return uniqueAisles
}

const getShelvesForAisle = (aisleId: string) => {
  // PRIORIDAD 1: Obtener TODOS los estantes del pasillo desde warehouseData
  const warehouseShelves = props.warehouseData?.shelves?.filter(shelf =>
    shelf.warehouse_aisle_id === aisleId
  ) || []

  // Si tenemos estantes en los datos del almacén, usarlos TODOS
  if (warehouseShelves.length > 0) {
    return warehouseShelves.map(shelf => ({
      ...shelf,
      hasProducts: props.filteredLocations.some(loc =>
        loc.shelf_id === shelf.id ||
        loc.warehouse_shelf_id === shelf.id
      )
    }))
  }

  // FALLBACK: Si no hay estantes en warehouseData, obtener desde product locations
  const shelvesFromLocations = props.filteredLocations
    .filter(loc => loc.aisle_id === aisleId)
    .reduce((acc, loc) => {
      const shelfId = loc.shelf_id
      if (shelfId && !acc.find(s => s.id === shelfId)) {
        acc.push({
          id: shelfId,
          code: loc.shelf_code || `E${acc.length + 1}`,
          name: loc.shelf_name || `Estante ${acc.length + 1}`,
          warehouse_aisle_id: aisleId,
          warehouse_id: loc.warehouse_id,
          hasProducts: true
        })
      }
      return acc
    }, [] as any[])

  // Si tampoco hay estantes en locations, crear estantes por defecto
  if (shelvesFromLocations.length === 0) {
    return Array.from({ length: 3 }, (_, i) => ({
      id: `default-shelf-${aisleId}-${i + 1}`,
      code: `E${i + 1}`,
      name: `Estante ${i + 1}`,
      warehouse_aisle_id: aisleId,
      warehouse_id: props.warehouseData?.warehouse?.id || '',
      hasProducts: false
    }))
  }

  return shelvesFromLocations
}

const getPositionsForShelf = (shelfId: string) => {
  // PRIORIDAD 1: Obtener TODAS las posiciones del estante desde warehouseData
  const warehousePositions = props.warehouseData?.shelfPositions?.filter(pos =>
    pos.warehouse_shelf_id === shelfId
  ) || []

  // Si tenemos posiciones en los datos del almacén, usarlas TODAS
  if (warehousePositions.length > 0) {
    return warehousePositions.map(pos => {
      // Buscar si esta posición tiene productos asignados
      const locationWithProduct = props.filteredLocations.find(loc =>
        loc.warehouse_shelf_position_id === pos.id ||
        loc.shelf_position_id === pos.id
      )

      return {
        ...pos,
        position_number: pos.position_number || pos.level_number || 1,
        position_code: pos.location_code || `${pos.level_number}-${pos.position_number}`,
        status: locationWithProduct && (locationWithProduct.stock_actual || 0) > 0 ? 'ocupado' : 'libre',
        stock_actual: locationWithProduct?.stock_actual || 0,
        product_name: locationWithProduct?.product_name || null,
        product_sku: locationWithProduct?.product_sku || null
      }
    })
  }

  // FALLBACK: Buscar posiciones desde product locations
  const positionsFromLocations = props.filteredLocations.filter(loc =>
    loc.shelf_id === shelfId ||
    loc.warehouse_shelf_id === shelfId
  )

  if (positionsFromLocations.length > 0) {
    return positionsFromLocations.map(pos => ({
      ...pos,
      position_number: pos.position_number || pos.level_number || 1,
      position_code: pos.full_location_code || pos.shelf_position_id || pos.id,
      status: (pos.stock_actual || 0) > 0 ? 'ocupado' : 'libre'
    }))
  }

  // ÚLTIMO RECURSO: Crear posiciones virtuales
  return Array.from({ length: 10 }, (_, i) => ({
    id: `${shelfId}-${i + 1}`,
    position_number: i + 1,
    position_code: `${shelfId}-${i + 1}`,
    status: 'libre',
    warehouse_shelf_id: shelfId,
    stock_actual: 0
  }))
}

// Highlight functions
const hasHighlightedProduct = (shelfId: string) => {
  if (!highlightedProductId.value) return false

  const positions = getPositionsForShelf(shelfId)
  return positions.some(pos => pos.product_id === highlightedProductId.value)
}

const isHighlightedProduct = (position: any) => {
  return highlightedProductId.value && position.product_id === highlightedProductId.value
}

const getPositionClass = (position: any) => {
  const status = position.status || (position.stock_actual > 0 ? 'ocupado' : 'libre')

  switch (status) {
    case 'ocupado':
      return 'bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
    case 'reservado':
      return 'bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600'
    case 'mantenimiento':
      return 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    default:
      return 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  }
}

const getPositionTooltip = (position: any) => {
  const status = position.status || (position.stock_actual > 0 ? 'ocupado' : 'libre')

  switch (status) {
    case 'ocupado':
      return `Ocupado - ${position.product_name || 'Producto'} (Stock: ${position.stock_actual || 0})`
    case 'reservado':
      return 'Reservado - mantenimiento'
    case 'mantenimiento':
      return 'En mantenimiento'
    default:
      return `Libre - ${position.position_code || position.id}`
  }
}

const getOccupancyBadgeClass = (occupancy: number) => {
  if (occupancy >= 80) return 'bg-red-100 text-red-600'
  if (occupancy >= 60) return 'bg-amber-100 text-amber-600'
  if (occupancy >= 40) return 'bg-blue-100 text-blue-600'
  return 'bg-emerald-100 text-emerald-600'
}

const getOccupancyBarClass = (occupancy: number) => {
  if (occupancy >= 80) return 'bg-gradient-to-r from-red-500 to-red-600'
  if (occupancy >= 60) return 'bg-gradient-to-r from-amber-500 to-amber-600'
  if (occupancy >= 40) return 'bg-gradient-to-r from-blue-500 to-blue-600'
  return 'bg-gradient-to-r from-emerald-500 to-emerald-600'
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'ocupado':
      return 'bg-red-100 text-red-600'
    case 'reservado':
      return 'bg-amber-100 text-amber-600'
    case 'mantenimiento':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-emerald-100 text-emerald-600'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ocupado': return 'Ocupado'
    case 'reservado': return 'Reservado'
    case 'mantenimiento': return 'Mantenimiento'
    default: return 'Libre'
  }
}

// Event Handlers
const handlePositionClick = (position: any) => {
  selectedPosition.value = position
}

const closeModal = () => {
  selectedPosition.value = null
}

// Autocomplete functions
const onSearchInput = () => {
  selectedDropdownIndex.value = -1
  if (searchQuery.value.length >= 2) {
    showDropdown.value = true
  } else {
    showDropdown.value = false
  }
}

const selectProduct = (product: any) => {
  selectedProduct.value = product
  searchQuery.value = product.product_name
  showDropdown.value = false
  highlightedProductId.value = product.id

  // Focus on the shelf containing this product
  scrollToProduct(product)
}

const clearSearch = () => {
  searchQuery.value = ''
  selectedProduct.value = null
  showDropdown.value = false
  highlightedProductId.value = null
  selectedDropdownIndex.value = -1
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (!showDropdown.value || filteredProducts.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedDropdownIndex.value = Math.min(
        selectedDropdownIndex.value + 1,
        filteredProducts.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedDropdownIndex.value = Math.max(selectedDropdownIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedDropdownIndex.value >= 0) {
        selectProduct(filteredProducts.value[selectedDropdownIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      selectedDropdownIndex.value = -1
      break
  }
}

const scrollToProduct = (product: any) => {
  // Find the zone, aisle, and shelf for this product
  const zoneId = product.zone_id || product.warehouse_zone_id
  const aisleId = product.aisle_id
  const shelfId = product.shelf_id || product.warehouse_shelf_id

  if (!zoneId || !aisleId || !shelfId) return

  // Wait for next tick to ensure DOM is updated
  nextTick(() => {
    // Try to find the shelf element by ID
    const shelfElement = document.querySelector(`[data-shelf-id="${shelfId}"]`)
    if (shelfElement) {
      // Smooth scroll to the shelf
      shelfElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })

      // Add pulse animation
      shelfElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-75')
      setTimeout(() => {
        shelfElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-75')
      }, 2000)
    }
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  zoneFilter.value = ''
}

const handleDragStart = (event: DragEvent, position: any) => {
  if (position.status === 'ocupado') {
    draggedProduct.value = position
    event.dataTransfer?.setData('text/plain', JSON.stringify(position))
  }
}

const handleDrop = (event: DragEvent, targetShelf: any) => {
  event.preventDefault()

  const data = event.dataTransfer?.getData('text/plain')
  if (data && draggedProduct.value) {
    console.log('Moving product from', draggedProduct.value, 'to shelf', targetShelf)
    // TODO: Implement actual move logic
    draggedProduct.value = null
  }
}

const assignProduct = () => {
  console.log('Assign product to position:', selectedPosition.value)
  // TODO: Implement product assignment
  closeModal()
}

const removeProduct = () => {
  console.log('Remove product from position:', selectedPosition.value)
  // TODO: Implement product removal
  closeModal()
}

onMounted(() => {
  // Component initialization
  console.log('WarehouseCardView mounted')
  console.log('Props warehouseData:', props.warehouseData)
  console.log('Props filteredLocations:', props.filteredLocations)
  console.log('Available zones:', availableZones.value)

  // Close dropdown when clicking outside
  const handleClickOutside = (event: Event) => {
    if (searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
      showDropdown.value = false
      selectedDropdownIndex.value = -1
    }
  }

  document.addEventListener('click', handleClickOutside)

  // Cleanup on unmount
  const cleanup = () => {
    document.removeEventListener('click', handleClickOutside)
  }

  // Vue 3 doesn't have beforeDestroy, use onBeforeUnmount
  // For now, we'll just handle it manually
  window.addEventListener('beforeunload', cleanup)
})
</script>

<style scoped>
.grid-bg {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  width: 100%;
  height: 100%;
}
</style>
