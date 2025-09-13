<template>
  <div class="warehouse-2d-viewer h-full w-full bg-gray-50 rounded-lg border overflow-hidden">
    <!-- Controls -->
    <div class="bg-white border-b p-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Zoom:</label>
          <input
            v-model.number="zoomLevel"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            class="w-24"
          />
          <span class="text-sm text-gray-500">{{ Math.round(zoomLevel * 100) }}%</span>
        </div>
        <Button variant="outline" size="sm" @click="resetView">
          <RotateCcw class="h-4 w-4 mr-1" />
          Resetear Vista
        </Button>
      </div>
      
      <div class="flex items-center gap-2">
        <Badge v-if="selectedLocation" variant="outline" class="bg-blue-50">
          {{ selectedLocation.product?.name || 'Producto seleccionado' }}
        </Badge>
        <Button
          v-if="selectedLocation"
          variant="ghost"
          size="sm"
          @click="selectedLocation = null"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 2D Visualization -->
    <div class="relative h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
      <!-- No data message -->
      <div 
        v-if="!warehouseBounds && locations.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center text-gray-500 dark:text-gray-400">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2">No hay almacenes configurados</h3>
          <p class="text-sm mb-4">Para ver la vista 2D, necesitas tener al menos un almacén con dimensiones configuradas.</p>
          <p class="text-xs">Verifica que tengas almacenes con ubicaciones de productos en tu base de datos.</p>
        </div>
      </div>
      
      <div
        v-else
        ref="containerRef"
        class="absolute inset-0 cursor-move"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @wheel="handleWheel"
      >
        <svg
          :width="containerSize.width"
          :height="containerSize.height"
          :viewBox="viewBox"
          class="w-full h-full"
        >
          <!-- Grid -->
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Warehouse boundary -->
          <rect
            v-if="warehouseBounds"
            :x="0"
            :y="0"
            :width="warehouseBounds.width"
            :height="warehouseBounds.length"
            fill="none"
            stroke="#374151"
            stroke-width="2"
            stroke-dasharray="5,5"
          />

          <!-- Warehouse zones -->
          <g v-for="zone in zones" :key="zone.id" class="zone-group">
            <rect
              :x="zone.x_coordinate || 0"
              :y="zone.y_coordinate || 0"
              :width="zone.width || 10"
              :height="zone.length || 10"
              :fill="zone.color_hex || '#3B82F6'"
              :fill-opacity="zone.opacity || 0.2"
              :stroke="zone.color_hex || '#3B82F6'"
              stroke-width="1.5"
              rx="2"
              class="zone-rect cursor-pointer hover:fill-opacity-30"
              @click="selectZone(zone)"
            />
            <text
              :x="(zone.x_coordinate || 0) + (zone.width || 10) / 2"
              :y="(zone.y_coordinate || 0) + (zone.length || 10) / 2"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="8"
              font-weight="600"
              :fill="zone.color_hex || '#3B82F6'"
              class="zone-label pointer-events-none"
            >
              {{ zone.code }}
            </text>
          </g>

          <!-- Product locations -->
          <g v-for="location in locations" :key="location.id" class="location-group">
            <circle
              :cx="location.position_x || 0"
              :cy="location.position_y || 0"
              :r="getLocationRadius(location)"
              :fill="getLocationColor(location)"
              :stroke="selectedLocation?.id === location.id ? '#ef4444' : getLocationStrokeColor(location)"
              :stroke-width="selectedLocation?.id === location.id ? 3 : 1.5"
              class="location-marker cursor-pointer hover:stroke-width-2 transition-all"
              @click="selectLocation(location)"
            />
            
            <!-- Stock indicator -->
            <text
              v-if="location.stock_actual > 0"
              :x="location.position_x || 0"
              :y="(location.position_y || 0) + 1"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="6"
              font-weight="600"
              fill="white"
              class="stock-indicator pointer-events-none"
            >
              {{ location.stock_actual }}
            </text>
          </g>

          <!-- Highlight selected location -->
          <g v-if="selectedLocation" class="selection-highlight">
            <circle
              :cx="selectedLocation.position_x || 0"
              :cy="selectedLocation.position_y || 0"
              :r="getLocationRadius(selectedLocation) + 3"
              fill="none"
              stroke="#ef4444"
              stroke-width="2"
              stroke-dasharray="3,3"
              class="selection-ring"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0"
                to="360"
                :dur="2"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>
      </div>

      <!-- Location details panel -->
      <div
        v-if="selectedLocation"
        class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border"
      >
        <div class="flex items-start justify-between mb-3">
          <h4 class="font-semibold text-gray-900">Detalles de Ubicación</h4>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click="selectedLocation = null"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        
        <div class="space-y-2 text-sm">
          <div>
            <span class="font-medium text-gray-700">Producto:</span>
            <p class="text-gray-900">{{ selectedLocation.product?.name || 'Sin nombre' }}</p>
          </div>
          <div>
            <span class="font-medium text-gray-700">SKU:</span>
            <code class="bg-gray-100 px-1 py-0.5 rounded text-xs">
              {{ selectedLocation.product?.sku || '-' }}
            </code>
          </div>
          <div>
            <span class="font-medium text-gray-700">Zona:</span>
            <p class="text-gray-900">{{ selectedLocation.zone?.name || 'Sin zona' }}</p>
          </div>
          <div>
            <span class="font-medium text-gray-700">Posición:</span>
            <p class="text-gray-900 font-mono text-xs">
              X:{{ selectedLocation.position_x || 0 }}, Y:{{ selectedLocation.position_y || 0 }}
            </p>
          </div>
          <div>
            <span class="font-medium text-gray-700">Stock:</span>
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ selectedLocation.stock_actual }}</span>
              <Badge
                v-if="selectedLocation.capacity_max && selectedLocation.stock_actual >= selectedLocation.capacity_max"
                variant="warning"
                class="text-xs"
              >
                Lleno
              </Badge>
            </div>
          </div>
          <div v-if="selectedLocation.capacity_max">
            <span class="font-medium text-gray-700">Capacidad:</span>
            <p class="text-gray-900">{{ selectedLocation.capacity_max }} unidades</p>
          </div>
          <div>
            <span class="font-medium text-gray-700">Estado:</span>
            <Badge :variant="selectedLocation.es_principal ? 'success' : 'outline'">
              {{ selectedLocation.es_principal ? 'Principal' : 'Secundaria' }}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { X, RotateCcw } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import type { LocationWithProduct, WarehouseZone } from '@/composables/useWarehouseVisualizer'

interface Props {
  locations: LocationWithProduct[]
  zones: WarehouseZone[]
  warehouseBounds: { width: number; height: number; length: number } | null
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  locations: () => [],
  zones: () => [],
  searchQuery: ''
})

const emit = defineEmits<{
  locationSelected: [location: LocationWithProduct]
  zoneSelected: [zone: WarehouseZone]
}>()

// State
const containerRef = ref<HTMLElement>()
const containerSize = ref({ width: 800, height: 600 })
const zoomLevel = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })
const selectedLocation = ref<LocationWithProduct | null>(null)

// Computed
const viewBox = computed(() => {
  const bounds = props.warehouseBounds || { width: 100, height: 100, length: 100 }
  const centerX = bounds.width / 2
  const centerY = bounds.length / 2
  
  const viewWidth = bounds.width / zoomLevel.value
  const viewHeight = bounds.length / zoomLevel.value
  
  const x = centerX - viewWidth / 2 + panOffset.value.x
  const y = centerY - viewHeight / 2 + panOffset.value.y
  
  return `${x} ${y} ${viewWidth} ${viewHeight}`
})

// Methods
const updateContainerSize = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
  }
}

const resetView = () => {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
  selectedLocation.value = null
}

const getLocationRadius = (location: LocationWithProduct) => {
  const baseRadius = 3
  const stockMultiplier = Math.min(location.stock_actual / 10, 2)
  return baseRadius + stockMultiplier
}

const getLocationColor = (location: LocationWithProduct) => {
  if (location.es_principal) {
    return '#10B981' // green for primary locations
  } else if (location.stock_actual === 0) {
    return '#94A3B8' // gray for empty locations
  } else if (location.capacity_max && location.stock_actual >= location.capacity_max) {
    return '#F59E0B' // amber for full locations
  }
  return '#3B82F6' // blue for regular locations
}

const getLocationStrokeColor = (location: LocationWithProduct) => {
  if (location.es_principal) {
    return '#059669'
  } else if (location.stock_actual === 0) {
    return '#64748B'
  } else if (location.capacity_max && location.stock_actual >= location.capacity_max) {
    return '#D97706'
  }
  return '#2563EB'
}

const selectLocation = (location: LocationWithProduct) => {
  selectedLocation.value = location
  emit('locationSelected', location)
}

const selectZone = (zone: WarehouseZone) => {
  emit('zoneSelected', zone)
}

// Mouse handling
const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  lastMousePos.value = { x: event.clientX, y: event.clientY }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = (event.clientX - lastMousePos.value.x) / zoomLevel.value
    const deltaY = (event.clientY - lastMousePos.value.y) / zoomLevel.value
    
    panOffset.value.x -= deltaX * 0.5
    panOffset.value.y -= deltaY * 0.5
    
    lastMousePos.value = { x: event.clientX, y: event.clientY }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  zoomLevel.value = Math.max(0.1, Math.min(3, zoomLevel.value + delta))
}

// Watch for search query changes
watch(() => props.searchQuery, (query) => {
  if (query) {
    const foundLocation = props.locations.find(location => {
      const product = location.product
      return product && (
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.sku.toLowerCase().includes(query.toLowerCase())
      )
    })
    
    if (foundLocation) {
      selectedLocation.value = foundLocation
      // Center on found location
      if (props.warehouseBounds) {
        const bounds = props.warehouseBounds
        panOffset.value.x = (foundLocation.position_x || 0) - bounds.width / 2
        panOffset.value.y = (foundLocation.position_y || 0) - bounds.length / 2
      }
    }
  }
})

onMounted(() => {
  updateContainerSize()
  window.addEventListener('resize', updateContainerSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize)
})
</script>

<style scoped>
.warehouse-2d-viewer {
  min-height: 500px;
}

.location-marker {
  transition: stroke-width 0.2s ease;
}

.location-marker:hover {
  stroke-width: 2;
}

.zone-rect:hover {
  fill-opacity: 0.3 !important;
}

.selection-ring {
  transform-origin: center;
}

/* Disable text selection */
svg {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>