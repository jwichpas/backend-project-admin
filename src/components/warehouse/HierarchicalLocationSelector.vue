<template>
  <div class="space-y-4">
    <!-- Breadcrumb Navigation -->
    <div v-if="selectedPath.length > 0" class="flex items-center space-x-2 text-sm">
      <Building class="h-4 w-4 text-gray-400" />
      <span v-for="(item, index) in selectedPath" :key="index" class="flex items-center">
        <button
          @click="navigateToLevel(index)"
          class="text-blue-600 hover:text-blue-800 font-medium"
        >
          {{ item.name }}
        </button>
        <ChevronRight v-if="index < selectedPath.length - 1" class="h-4 w-4 text-gray-400 mx-1" />
      </span>
    </div>

    <!-- Selection Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Warehouse Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">
          <Warehouse class="inline h-4 w-4 mr-1" />
          Almacén
        </label>
        <select
          v-model="selectedWarehouse"
          @change="onWarehouseChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="{ 'bg-red-50': errors.warehouse }"
        >
          <option value="">Seleccionar almacén</option>
          <option
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :value="warehouse.id"
          >
            {{ warehouse.name }} ({{ warehouse.code }})
          </option>
        </select>
        <p v-if="errors.warehouse" class="text-xs text-red-600">{{ errors.warehouse }}</p>
      </div>

      <!-- Zone Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">
          <Layers class="inline h-4 w-4 mr-1" />
          Zona
        </label>
        <select
          v-model="selectedZone"
          @change="onZoneChange"
          :disabled="!selectedWarehouse"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          :class="{ 'bg-red-50': errors.zone }"
        >
          <option value="">Seleccionar zona</option>
          <option
            v-for="zone in availableZones"
            :key="zone.id"
            :value="zone.id"
          >
            {{ zone.code }} - {{ zone.name }}
          </option>
        </select>
        <p v-if="errors.zone" class="text-xs text-red-600">{{ errors.zone }}</p>
      </div>

      <!-- Aisle Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">
          <Navigation class="inline h-4 w-4 mr-1" />
          Pasillo
        </label>
        <select
          v-model="selectedAisle"
          @change="onAisleChange"
          :disabled="!selectedZone"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          :class="{ 'bg-red-50': errors.aisle }"
        >
          <option value="">Seleccionar pasillo</option>
          <option
            v-for="aisle in availableAisles"
            :key="aisle.id"
            :value="aisle.id"
          >
            {{ aisle.code }} - {{ aisle.name || 'Sin nombre' }}
          </option>
        </select>
        <p v-if="errors.aisle" class="text-xs text-red-600">{{ errors.aisle }}</p>
      </div>

      <!-- Shelf Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">
          <Boxes class="inline h-4 w-4 mr-1" />
          Estante
        </label>
        <select
          v-model="selectedShelf"
          @change="onShelfChange"
          :disabled="!selectedAisle"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          :class="{ 'bg-red-50': errors.shelf }"
        >
          <option value="">Seleccionar estante</option>
          <option
            v-for="shelf in availableShelves"
            :key="shelf.id"
            :value="shelf.id"
          >
            {{ shelf.code }} - {{ shelf.name || 'Sin nombre' }}
          </option>
        </select>
        <p v-if="errors.shelf" class="text-xs text-red-600">{{ errors.shelf }}</p>
      </div>

      <!-- Position Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">
          <MapPin class="inline h-4 w-4 mr-1" />
          Posición
        </label>
        <select
          v-model="selectedPosition"
          @change="onPositionChange"
          :disabled="!selectedShelf"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          :class="{ 'bg-red-50': errors.position }"
        >
          <option value="">Seleccionar posición</option>
          <option
            v-for="position in availablePositions"
            :key="position.id"
            :value="position.id"
          >
            {{ position.location_code }}
            <span v-if="position.is_reserved" class="text-red-500">(Reservada)</span>
          </option>
        </select>
        <p v-if="errors.position" class="text-xs text-red-600">{{ errors.position }}</p>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700">Acciones Rápidas</label>
        <div class="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            @click="clearSelection"
            :disabled="!hasAnySelection"
          >
            <X class="h-4 w-4 mr-1" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="autoSelect"
            :disabled="!selectedWarehouse"
          >
            <Zap class="h-4 w-4 mr-1" />
            Auto
          </Button>
        </div>
      </div>
    </div>

    <!-- Selected Location Summary -->
    <div
      v-if="hasCompleteSelection"
      class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-green-800 mb-2">Ubicación Seleccionada</h3>
          <div class="text-sm text-green-600">
            <div class="grid grid-cols-2 gap-2">
              <div><span class="font-medium">Almacén:</span> {{ selectedWarehouseName }}</div>
              <div><span class="font-medium">Zona:</span> {{ selectedZoneName }}</div>
              <div><span class="font-medium">Pasillo:</span> {{ selectedAisleName }}</div>
              <div><span class="font-medium">Estante:</span> {{ selectedShelfName }}</div>
              <div class="col-span-2"><span class="font-medium">Posición:</span> {{ selectedPositionCode }}</div>
            </div>
          </div>
        </div>
        <CheckCircle class="h-8 w-8 text-green-500" />
      </div>
    </div>

    <!-- Position Details -->
    <div
      v-if="selectedPositionData"
      class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <h3 class="text-sm font-medium text-blue-800 mb-2">Detalles de la Posición</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-blue-600">
        <div>
          <span class="font-medium">Código:</span>
          {{ selectedPositionData.location_code }}
        </div>
        <div>
          <span class="font-medium">Nivel:</span>
          {{ selectedPositionData.level_number }}
        </div>
        <div>
          <span class="font-medium">Posición:</span>
          {{ selectedPositionData.position_number }}
        </div>
        <div>
          <span class="font-medium">Dimensiones:</span>
          {{ selectedPositionData.width }}×{{ selectedPositionData.depth }}×{{ selectedPositionData.height }}m
        </div>
        <div>
          <span class="font-medium">Capacidad:</span>
          {{ selectedPositionData.max_weight_kg || 'N/A' }}kg
        </div>
        <div>
          <span class="font-medium">Estado:</span>
          <span :class="{
            'text-green-600': selectedPositionData.condition === 'EXCELLENT',
            'text-blue-600': selectedPositionData.condition === 'GOOD',
            'text-yellow-600': selectedPositionData.condition === 'FAIR',
            'text-red-600': selectedPositionData.condition === 'NEEDS_REPAIR'
          }">
            {{ getConditionLabel(selectedPositionData.condition) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Availability Grid (if shelf is selected) -->
    <div
      v-if="selectedShelf && availablePositions.length > 0"
      class="mt-6"
    >
      <h3 class="text-sm font-medium text-gray-700 mb-3">Mapa de Posiciones del Estante</h3>
      <div class="grid gap-1" :style="`grid-template-columns: repeat(${maxPositions}, minmax(0, 1fr))`">
        <div
          v-for="position in positionGrid"
          :key="`${position.level}-${position.position}`"
          @click="selectPositionFromGrid(position)"
          class="relative h-8 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
          :class="getPositionGridClass(position)"
          :title="getPositionTooltip(position)"
        >
          <div class="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {{ position.level }}-{{ position.position }}
          </div>
        </div>
      </div>
      <div class="mt-2 flex items-center space-x-4 text-xs text-gray-600">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Disponible</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Reservada</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>Ocupada</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
          <span>Seleccionada</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Building,
  Warehouse,
  Layers,
  Navigation,
  Boxes,
  MapPin,
  ChevronRight,
  X,
  Zap,
  CheckCircle
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import type {
  Warehouse as WarehouseType,
  WarehouseZone,
  WarehouseAisle,
  WarehouseShelf,
  WarehouseShelfPosition
} from '@/composables/useWarehouseManager'

interface Props {
  warehouses: WarehouseType[]
  zones: WarehouseZone[]
  aisles: WarehouseAisle[]
  shelves: WarehouseShelf[]
  positions: WarehouseShelfPosition[]
  modelValue?: {
    warehouseId?: string
    zoneId?: string
    aisleId?: string
    shelfId?: string
    positionId?: string
  }
  required?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: {
    warehouseId?: string
    zoneId?: string
    aisleId?: string
    shelfId?: string
    positionId?: string
  }): void
  (e: 'selection-change', selection: {
    warehouse?: WarehouseType
    zone?: WarehouseZone
    aisle?: WarehouseAisle
    shelf?: WarehouseShelf
    position?: WarehouseShelfPosition
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const selectedWarehouse = ref(props.modelValue?.warehouseId || '')
const selectedZone = ref(props.modelValue?.zoneId || '')
const selectedAisle = ref(props.modelValue?.aisleId || '')
const selectedShelf = ref(props.modelValue?.shelfId || '')
const selectedPosition = ref(props.modelValue?.positionId || '')

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed properties for filtered options
const availableZones = computed(() =>
  selectedWarehouse.value
    ? props.zones.filter(z => z.warehouse_id === selectedWarehouse.value)
    : []
)

const availableAisles = computed(() =>
  selectedZone.value
    ? props.aisles.filter(a => a.warehouse_zone_id === selectedZone.value)
    : []
)

const availableShelves = computed(() =>
  selectedAisle.value
    ? props.shelves.filter(s => s.warehouse_aisle_id === selectedAisle.value)
    : []
)

const availablePositions = computed(() =>
  selectedShelf.value
    ? props.positions.filter(p => p.warehouse_shelf_id === selectedShelf.value)
    : []
)

// Selected data objects
const selectedWarehouseData = computed(() =>
  props.warehouses.find(w => w.id === selectedWarehouse.value)
)

const selectedZoneData = computed(() =>
  availableZones.value.find(z => z.id === selectedZone.value)
)

const selectedAisleData = computed(() =>
  availableAisles.value.find(a => a.id === selectedAisle.value)
)

const selectedShelfData = computed(() =>
  availableShelves.value.find(s => s.id === selectedShelf.value)
)

const selectedPositionData = computed(() =>
  availablePositions.value.find(p => p.id === selectedPosition.value)
)

// Display names
const selectedWarehouseName = computed(() =>
  selectedWarehouseData.value?.name || ''
)

const selectedZoneName = computed(() =>
  selectedZoneData.value ? `${selectedZoneData.value.code} - ${selectedZoneData.value.name}` : ''
)

const selectedAisleName = computed(() =>
  selectedAisleData.value ? `${selectedAisleData.value.code} - ${selectedAisleData.value.name}` : ''
)

const selectedShelfName = computed(() =>
  selectedShelfData.value ? `${selectedShelfData.value.code} - ${selectedShelfData.value.name}` : ''
)

const selectedPositionCode = computed(() =>
  selectedPositionData.value?.location_code || ''
)

// Selection states
const hasAnySelection = computed(() =>
  selectedWarehouse.value || selectedZone.value || selectedAisle.value || selectedShelf.value || selectedPosition.value
)

const hasCompleteSelection = computed(() =>
  selectedWarehouse.value && selectedZone.value && selectedAisle.value && selectedShelf.value && selectedPosition.value
)

// Breadcrumb navigation
const selectedPath = computed(() => {
  const path = []

  if (selectedWarehouseName.value) {
    path.push({ name: selectedWarehouseName.value, level: 'warehouse' })
  }
  if (selectedZoneName.value) {
    path.push({ name: selectedZoneName.value, level: 'zone' })
  }
  if (selectedAisleName.value) {
    path.push({ name: selectedAisleName.value, level: 'aisle' })
  }
  if (selectedShelfName.value) {
    path.push({ name: selectedShelfName.value, level: 'shelf' })
  }
  if (selectedPositionCode.value) {
    path.push({ name: selectedPositionCode.value, level: 'position' })
  }

  return path
})

// Position grid for visual selection
const maxPositions = computed(() => {
  if (!selectedShelfData.value) return 0

  const maxPos = Math.max(
    ...availablePositions.value.map(p => p.position_number)
  )
  return maxPos || 3
})

const positionGrid = computed(() => {
  if (!selectedShelfData.value) return []

  const grid = []
  const levels = selectedShelfData.value.levels

  for (let level = 1; level <= levels; level++) {
    for (let pos = 1; pos <= maxPositions.value; pos++) {
      const position = availablePositions.value.find(p =>
        p.level_number === level && p.position_number === pos
      )

      grid.push({
        level,
        position: pos,
        data: position,
        exists: !!position
      })
    }
  }

  return grid
})

// Event handlers
const onWarehouseChange = () => {
  selectedZone.value = ''
  selectedAisle.value = ''
  selectedShelf.value = ''
  selectedPosition.value = ''
  errors.value.warehouse = ''
  emitChange()
}

const onZoneChange = () => {
  selectedAisle.value = ''
  selectedShelf.value = ''
  selectedPosition.value = ''
  errors.value.zone = ''
  emitChange()
}

const onAisleChange = () => {
  selectedShelf.value = ''
  selectedPosition.value = ''
  errors.value.aisle = ''
  emitChange()
}

const onShelfChange = () => {
  selectedPosition.value = ''
  errors.value.shelf = ''
  emitChange()
}

const onPositionChange = () => {
  errors.value.position = ''
  emitChange()
}

const emitChange = () => {
  const value = {
    warehouseId: selectedWarehouse.value || undefined,
    zoneId: selectedZone.value || undefined,
    aisleId: selectedAisle.value || undefined,
    shelfId: selectedShelf.value || undefined,
    positionId: selectedPosition.value || undefined
  }

  emit('update:modelValue', value)

  emit('selection-change', {
    warehouse: selectedWarehouseData.value,
    zone: selectedZoneData.value,
    aisle: selectedAisleData.value,
    shelf: selectedShelfData.value,
    position: selectedPositionData.value
  })
}

const clearSelection = () => {
  selectedWarehouse.value = ''
  selectedZone.value = ''
  selectedAisle.value = ''
  selectedShelf.value = ''
  selectedPosition.value = ''
  errors.value = {}
  emitChange()
}

const autoSelect = () => {
  if (!selectedWarehouse.value) return

  // Auto-select first available option at each level
  if (availableZones.value.length > 0 && !selectedZone.value) {
    selectedZone.value = availableZones.value[0].id
  }

  if (availableAisles.value.length > 0 && !selectedAisle.value) {
    selectedAisle.value = availableAisles.value[0].id
  }

  if (availableShelves.value.length > 0 && !selectedShelf.value) {
    selectedShelf.value = availableShelves.value[0].id
  }

  if (availablePositions.value.length > 0 && !selectedPosition.value) {
    // Find first available (not reserved) position
    const firstAvailable = availablePositions.value.find(p => !p.is_reserved)
    if (firstAvailable) {
      selectedPosition.value = firstAvailable.id
    }
  }

  emitChange()
}

const navigateToLevel = (index: number) => {
  const levels = ['warehouse', 'zone', 'aisle', 'shelf', 'position']
  const targetLevel = levels[index]

  // Clear selections after the clicked level
  if (index < 1) selectedZone.value = ''
  if (index < 2) selectedAisle.value = ''
  if (index < 3) selectedShelf.value = ''
  if (index < 4) selectedPosition.value = ''

  emitChange()
}

const selectPositionFromGrid = (gridItem: any) => {
  if (gridItem.exists && gridItem.data) {
    selectedPosition.value = gridItem.data.id
    emitChange()
  }
}

const getPositionGridClass = (gridItem: any) => {
  if (!gridItem.exists) {
    return 'bg-gray-100 cursor-not-allowed'
  }

  const position = gridItem.data

  if (selectedPosition.value === position.id) {
    return 'bg-blue-200 border-blue-400 text-blue-800'
  }

  if (position.is_reserved) {
    return 'bg-yellow-100 border-yellow-300 text-yellow-800'
  }

  // Check if position is occupied (you might need to pass this data)
  // For now, assume all are available
  return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
}

const getPositionTooltip = (gridItem: any) => {
  if (!gridItem.exists) {
    return 'Posición no disponible'
  }

  const position = gridItem.data
  return `${position.location_code} - ${getConditionLabel(position.condition)}`
}

const getConditionLabel = (condition: string) => {
  const labels = {
    'EXCELLENT': 'Excelente',
    'GOOD': 'Bueno',
    'FAIR': 'Regular',
    'NEEDS_REPAIR': 'Necesita reparación',
    'OUT_OF_SERVICE': 'Fuera de servicio'
  }
  return labels[condition as keyof typeof labels] || condition
}

// Validation
const validate = () => {
  errors.value = {}

  if (props.required) {
    if (!selectedWarehouse.value) {
      errors.value.warehouse = 'Almacén es requerido'
    }
    if (!selectedZone.value) {
      errors.value.zone = 'Zona es requerida'
    }
    if (!selectedAisle.value) {
      errors.value.aisle = 'Pasillo es requerido'
    }
    if (!selectedShelf.value) {
      errors.value.shelf = 'Estante es requerido'
    }
    if (!selectedPosition.value) {
      errors.value.position = 'Posición es requerida'
    }
  }

  return Object.keys(errors.value).length === 0
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedWarehouse.value = newValue.warehouseId || ''
    selectedZone.value = newValue.zoneId || ''
    selectedAisle.value = newValue.aisleId || ''
    selectedShelf.value = newValue.shelfId || ''
    selectedPosition.value = newValue.positionId || ''
  }
}, { deep: true, immediate: true })

// Expose validate function
defineExpose({
  validate,
  clearSelection
})
</script>