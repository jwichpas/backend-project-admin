<template>
  <div class="space-y-6 min-h-screen">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Visualizador de Almacenes</h1>
        <p class="text-muted-foreground">
          Visualiza ubicaciones de productos en 2D y 3D con estructura jerárquica completa
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="refreshData">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualizar
        </Button>
        <Button variant="outline" size="sm" @click="showLocationSelector = true">
          <MapPin class="mr-2 h-4 w-4" />
          Selector de Ubicación
        </Button>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col lg:flex-row gap-4 items-start">
      <!-- View Mode Selector -->
      <div class="flex items-center space-x-1 bg-muted p-1 rounded-lg">
        <Button
          v-for="mode in viewModes"
          :key="mode.key"
          variant="ghost"
          size="sm"
          :class="{ 'bg-background shadow-sm': viewMode === mode.key }"
          @click="setViewMode(mode.key)"
        >
          <component :is="mode.icon" class="mr-2 h-4 w-4" />
          {{ mode.label }}
        </Button>
      </div>


      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-4 flex-1">
        <!-- Warehouse Selector -->
        <div class="min-w-48">
          <select
            v-model="selectedWarehouseId"
            @change="onWarehouseChange"
            class="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
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

        <!-- Product Filter -->
        <div class="min-w-48">
          <select
            v-model="selectedProductId"
            @change="onProductChange"
            class="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
          >
            <option value="">Todos los productos</option>
            <option
              v-for="product in products"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }} ({{ product.sku }})
            </option>
          </select>
        </div>

        <!-- Search -->
        <div class="min-w-48">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              v-model="searchQuery"
              @input="onSearchChange"
              type="text"
              placeholder="Buscar productos..."
              class="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <Warehouse class="h-8 w-8 text-blue-500" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Almacenes</p>
            <p class="text-2xl font-bold">{{ warehouses.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <Layers class="h-8 w-8 text-green-500" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Zonas</p>
            <p class="text-2xl font-bold">{{ zones.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <Package class="h-8 w-8 text-purple-500" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Productos</p>
            <p class="text-2xl font-bold">{{ filteredLocations.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <MapPin class="h-8 w-8 text-orange-500" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Ubicaciones</p>
            <p class="text-2xl font-bold">{{ productLocations.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Visualization Area -->
    <div class="bg-card border border-border rounded-lg overflow-hidden" :class="{
      'min-h-[600px]': viewMode === 'table',
      'p-0 bg-transparent border-0': viewMode === 'cards'
    }">
      <!-- Cards View -->
      <WarehouseCardView
        v-if="viewMode === 'cards'"
        :warehouse-data="warehouseData"
        :filtered-locations="filteredLocations"
        :loading="loading"
      />

      <!-- Table View -->
      <div v-else-if="viewMode === 'table'" class="p-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-border">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Producto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ubicación Completa
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-background divide-y divide-border">
              <tr
                v-for="location in filteredLocations"
                :key="location.id"
                class="hover:bg-muted/50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium">{{ location.product_name || 'Sin producto' }}</div>
                      <div class="text-sm text-muted-foreground">{{ location.product_sku || 'N/A' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm">
                    <div class="font-medium">{{ location.full_location_code || 'Sin código' }}</div>
                    <div class="text-muted-foreground">
                      {{ location.warehouse_name }} → {{ location.zone_name }} →
                      {{ location.aisle_name }} → {{ location.shelf_name }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm">
                    <div class="font-medium">{{ location.stock_actual || 0 }}</div>
                    <div class="text-muted-foreground">/ {{ location.capacity_max || 0 }} máx.</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': location.es_principal,
                    'bg-gray-100 text-gray-800': !location.es_principal
                  }">
                    {{ location.es_principal ? 'Principal' : 'Secundaria' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="viewLocationDetails(location)"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- No data state for table -->
          <div
            v-if="filteredLocations.length === 0 && !loading"
            class="text-center py-12"
          >
            <Package class="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p class="text-lg font-medium text-gray-600">No hay productos en esta ubicación</p>
            <p class="text-gray-500">Ajusta los filtros para ver más resultados</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Location Selector Modal -->
    <Modal v-model:open="showLocationSelector">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold">Selector Jerárquico de Ubicación</h2>
          <Button variant="ghost" size="sm" @click="showLocationSelector = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <HierarchicalLocationSelector
          :warehouses="warehouses"
          :zones="zones"
          :aisles="aisles"
          :shelves="shelves"
          :positions="shelfPositions"
          v-model="selectedHierarchicalLocation"
          @selection-change="onHierarchicalSelectionChange"
        />

        <div class="flex justify-end gap-3 mt-6">
          <Button variant="outline" @click="showLocationSelector = false">
            Cancelar
          </Button>
          <Button @click="applyHierarchicalSelection">
            Aplicar Selección
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Location Details Modal -->
    <Modal v-model:open="showLocationDetails">
      <div class="p-6" v-if="selectedLocationDetails">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold">Detalles de Ubicación</h2>
          <Button variant="ghost" size="sm" @click="showLocationDetails = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="space-y-6">
          <!-- Product Info -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Información del Producto</h3>
            <div class="bg-muted/50 rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm font-medium">Nombre</p>
                  <p class="text-sm text-muted-foreground">{{ selectedLocationDetails.product_name }}</p>
                </div>
                <div>
                  <p class="text-sm font-medium">SKU</p>
                  <p class="text-sm text-muted-foreground">{{ selectedLocationDetails.product_sku }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Location Hierarchy -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Jerarquía de Ubicación</h3>
            <div class="space-y-2">
              <div v-for="(level, index) in locationHierarchy" :key="index" class="flex items-center">
                <component :is="level.icon" class="h-4 w-4 mr-2 text-muted-foreground" />
                <span class="text-sm">{{ level.label }}: {{ level.value }}</span>
              </div>
            </div>
          </div>

          <!-- Stock Info -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Información de Stock</h3>
            <div class="bg-muted/50 rounded-lg p-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm font-medium">Stock Actual</p>
                  <p class="text-lg font-bold">{{ selectedLocationDetails.stock_actual || 0 }}</p>
                </div>
                <div>
                  <p class="text-sm font-medium">Capacidad Máxima</p>
                  <p class="text-lg font-bold">{{ selectedLocationDetails.capacity_max || 0 }}</p>
                </div>
                <div>
                  <p class="text-sm font-medium">Utilización</p>
                  <p class="text-lg font-bold">
                    {{ Math.round((selectedLocationDetails.stock_actual || 0) / (selectedLocationDetails.capacity_max || 1) * 100) }}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Position Details -->
          <div v-if="selectedLocationDetails.position_condition">
            <h3 class="text-sm font-medium text-muted-foreground mb-2">Detalles de Posición</h3>
            <div class="bg-muted/50 rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Nivel:</span>
                  {{ selectedLocationDetails.level_number || 'N/A' }}
                </div>
                <div>
                  <span class="font-medium">Posición:</span>
                  {{ selectedLocationDetails.position_number || 'N/A' }}
                </div>
                <div>
                  <span class="font-medium">Condición:</span>
                  {{ selectedLocationDetails.position_condition || 'N/A' }}
                </div>
                <div>
                  <span class="font-medium">Tipo:</span>
                  {{ selectedLocationDetails.es_principal ? 'Principal' : 'Secundaria' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'
import { useWarehouseVisualizer } from '@/composables/useWarehouseVisualizer'
import { useWarehouseManager } from '@/composables/useWarehouseManager'
import {
  RefreshCw,
  MapPin,
  Search,
  Eye,
  X,
  Table,
  Warehouse,
  Layers,
  Package,
  Navigation,
  Boxes,
  Grid3x3
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'

// Warehouse Components
import WarehouseCardView from '@/components/warehouse/WarehouseCardView.vue'
import HierarchicalLocationSelector from '@/components/warehouse/HierarchicalLocationSelector.vue'

const companiesStore = useCompaniesStore()
const authStore = useAuthStore()
const visualizer = useWarehouseVisualizer()
const warehouseManager = useWarehouseManager()

// Modal states
const showLocationSelector = ref(false)
const showLocationDetails = ref(false)
const selectedLocationDetails = ref(null)

// Hierarchical location selector state
const selectedHierarchicalLocation = ref({})

// View modes
const viewModes = [
  { key: 'cards', label: 'Tarjetas', icon: Grid3x3 },
  { key: 'table', label: 'Tabla', icon: Table }
]

// Computed properties from composables
const loading = computed(() => visualizer.loading.value || warehouseManager.loading.value)
const viewMode = computed(() => visualizer.viewMode.value)
const warehouses = computed(() => visualizer.warehouses.value)
const zones = computed(() => visualizer.zones.value)
const aisles = computed(() => warehouseManager.aisles.value)
const shelves = computed(() => warehouseManager.shelves.value)
const shelfPositions = computed(() => warehouseManager.shelfPositions.value)
const productLocations = computed(() => visualizer.productLocations.value)
const products = computed(() => visualizer.products.value)
const filteredLocations = computed(() => visualizer.filteredLocations.value)
const selectedWarehouseData = computed(() => visualizer.selectedWarehouseData.value)

// Combine all warehouse data for the card view
const warehouseData = computed(() => {
  const selectedWarehouse = warehouses.value.find(w => w.id === selectedWarehouseId.value) || warehouses.value[0]
  if (!selectedWarehouse) return null

  // Get all zones for this warehouse from warehouse structure
  const warehouseZones = zones.value.filter(zone => zone.warehouse_id === selectedWarehouse.id)

  // Get aisles for this warehouse
  const warehouseAisles = aisles.value.filter(aisle =>
    warehouseZones.some(zone => zone.id === aisle.warehouse_zone_id)
  )

  // Get shelves for aisles in this warehouse
  const warehouseShelves = shelves.value.filter(shelf =>
    warehouseAisles.some(aisle => aisle.id === shelf.warehouse_aisle_id)
  )

  // Get shelf positions for shelves in this warehouse
  const warehouseShelfPositions = shelfPositions.value.filter(pos =>
    warehouseShelves.some(shelf => shelf.id === pos.warehouse_shelf_id)
  )

  return {
    warehouse: selectedWarehouse,
    zones: warehouseZones,
    aisles: warehouseAisles,
    shelves: warehouseShelves,
    shelfPositions: warehouseShelfPositions,
    productLocations: filteredLocations.value
  }
})

// Local state for filters
const selectedWarehouseId = ref('')
const selectedProductId = ref('')
const searchQuery = ref('')


// Computed for location details hierarchy
const locationHierarchy = computed(() => {
  if (!selectedLocationDetails.value) return []

  const location = selectedLocationDetails.value
  return [
    { icon: Warehouse, label: 'Almacén', value: location.warehouse_name || 'N/A' },
    { icon: Layers, label: 'Zona', value: location.zone_name || 'N/A' },
    { icon: Navigation, label: 'Pasillo', value: location.aisle_name || 'N/A' },
    { icon: Boxes, label: 'Estante', value: location.shelf_name || 'N/A' },
    { icon: MapPin, label: 'Código', value: location.full_location_code || 'N/A' }
  ]
})

// Methods
const setViewMode = (mode: 'cards' | 'table') => {
  visualizer.setViewMode(mode)
}

const onWarehouseChange = () => {
  visualizer.setSelectedWarehouse(selectedWarehouseId.value || null)
}

const onProductChange = () => {
  visualizer.setSelectedProduct(selectedProductId.value || null)
}

const onSearchChange = () => {
  visualizer.setSearchQuery(searchQuery.value)
}

const refreshData = async () => {
  if (companiesStore.currentCompany) {
    await Promise.all([
      visualizer.initializeData(companiesStore.currentCompany.id),
      warehouseManager.initializeWarehouseData(companiesStore.currentCompany.id)
    ])

    // Auto-select first warehouse if none selected
    if (!selectedWarehouseId.value && warehouses.value.length > 0) {
      selectedWarehouseId.value = warehouses.value[0].id
      visualizer.setSelectedWarehouse(warehouses.value[0].id)
    }
  }
}

const viewLocationDetails = (location: any) => {
  selectedLocationDetails.value = location
  showLocationDetails.value = true
}

const onHierarchicalSelectionChange = (selection: any) => {
  console.log('Hierarchical selection changed:', selection)
}

const applyHierarchicalSelection = () => {
  const selection = selectedHierarchicalLocation.value

  if (selection.warehouseId) {
    selectedWarehouseId.value = selection.warehouseId
    visualizer.setSelectedWarehouse(selection.warehouseId)
  }

  showLocationSelector.value = false
}

// Initialize data
onMounted(async () => {
  console.log('WarehouseVisualizerView onMounted - currentCompany:', companiesStore.currentCompany)

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0 && authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)
  }

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length > 0) {
    companiesStore.selectCompany(companiesStore.userCompanies[0].company)
  }

  if (companiesStore.currentCompany) {
    await refreshData()
  }
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in WarehouseVisualizerView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshData()
    }
  }, { deep: true }
)
</script>