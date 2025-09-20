<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Asignación de Ubicaciones</h3>
        <p class="text-muted-foreground text-sm">
          Asigna productos a zonas y estantes de manera eficiente
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="showBulkAssignment = true">
          <Package class="mr-2 h-4 w-4" />
          Asignación Masiva
        </Button>
        <Button @click="showQuickSetup = true">
          <Settings class="mr-2 h-4 w-4" />
          Configuración Rápida
        </Button>
      </div>
    </div>

    <!-- Warehouse Selection -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Seleccionar Almacén</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select
              v-model="selectedWarehouseId"
              @change="onWarehouseChange"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :disabled="unref(warehouseManager.loading)"
            >
              <option value="">
                {{ unref(warehouseManager.loading) ? 'Cargando almacenes...' : 'Seleccionar almacén' }}
              </option>
              <option
                v-for="warehouse in availableWarehouses"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name || warehouse.code || 'Sin nombre' }}
              </option>
            </select>
          </div>
          <div v-if="warehouseStats">
            <label class="text-sm font-medium text-muted-foreground">Estadísticas</label>
            <div class="mt-1 text-sm">
              <div>{{ warehouseStats.zones }} zonas</div>
              <div>{{ warehouseStats.totalPositions }} posiciones</div>
              <div>{{ warehouseStats.occupiedPositions }} ocupadas</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Assignment Section -->
    <div v-if="selectedWarehouseId" class="grid gap-6 lg:grid-cols-2">
      <!-- Available Products -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center justify-between">
            <span>Productos Sin Ubicación ({{ unassignedProducts.length }})</span>
            <Button
              variant="outline"
              size="sm"
              @click="refreshProducts"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <RefreshCw v-else class="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="product in unassignedProducts.slice(0, 20)"
              :key="product.product_id || product.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              :class="{ 'bg-primary/10 border-primary': selectedProducts.includes(product.product_id || product.id) }"
              @click="toggleProductSelection(product.product_id || product.id)"
            >
              <div class="flex-1">
                <div class="font-medium text-sm">{{ product.product_name || product.name }}</div>
                <div class="text-xs text-muted-foreground">{{ product.sku }}</div>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="text-xs">
                  Stock: {{ product.total_stock || 0 }}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="quickAssignProduct(product)"
                  class="h-6 px-2"
                >
                  <MapPin class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div v-if="selectedProducts.length > 0" class="mt-4 p-3 bg-primary/10 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ selectedProducts.length }} productos seleccionados</span>
              <Button size="sm" @click="bulkAssignSelected">
                Asignar Seleccionados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Available Locations -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Ubicaciones Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Zone Filter -->
            <div>
              <label class="text-sm font-medium">Filtrar por Zona</label>
              <select
                v-model="selectedZoneFilter"
                @change="filterLocations"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todas las zonas</option>
                <option
                  v-for="zone in availableZones"
                  :key="zone.id"
                  :value="zone.id"
                >
                  {{ zone.code }} - {{ zone.name }}
                </option>
              </select>
            </div>

            <!-- Available Positions -->
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="position in filteredAvailablePositions.slice(0, 30)"
                :key="position.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                :class="{ 'bg-green-50 border-green-200': selectedLocationId === position.id }"
                @click="selectLocation(position)"
              >
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ position.location_code }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ position.zone_code }} - {{ position.aisle_code }} - {{ position.shelf_code }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge
                    :variant="position.is_occupied ? 'destructive' : 'success'"
                    class="text-xs"
                  >
                    {{ position.is_occupied ? 'Ocupado' : 'Libre' }}
                  </Badge>
                  <Button
                    v-if="!position.is_occupied"
                    variant="ghost"
                    size="sm"
                    @click.stop="openAssignmentDialog(position)"
                    class="h-6 px-2"
                  >
                    <Plus class="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Assignment Dialog -->
    <Dialog v-model:open="showAssignmentDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Producto a Ubicación</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <div v-if="selectedLocation" class="p-3 bg-muted/50 rounded-lg">
            <div class="font-medium">{{ selectedLocation.location_code }}</div>
            <div class="text-sm text-muted-foreground">
              {{ selectedLocation.zone_code }} - {{ selectedLocation.aisle_code }} - {{ selectedLocation.shelf_code }}
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Producto</label>
            <select
              v-model="assignmentForm.product_id"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Seleccionar producto</option>
              <option
                v-for="product in unassignedProducts"
                :key="product.product_id || product.id"
                :value="product.product_id || product.id"
              >
                {{ product.product_name || product.name }} ({{ product.sku }})
              </option>
            </select>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Stock Inicial</label>
              <Input
                v-model.number="assignmentForm.stock_actual"
                type="number"
                min="0"
                step="0.01"
                required
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Capacidad Máxima</label>
              <Input
                v-model.number="assignmentForm.capacity_max"
                type="number"
                min="0"
                step="0.01"
                class="mt-1"
              />
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="is_primary"
              type="checkbox"
              v-model="assignmentForm.es_principal"
              class="rounded border-gray-300"
            />
            <label for="is_primary" class="text-sm font-medium">Ubicación principal del producto</label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="cancelAssignment">
            Cancelar
          </Button>
          <Button @click="confirmAssignment" :disabled="!assignmentForm.product_id || assignmentProcessing">
            <Loader2 v-if="assignmentProcessing" class="mr-2 h-4 w-4 animate-spin" />
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Bulk Assignment Dialog -->
    <Dialog v-model:open="showBulkAssignment">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignación Masiva de Productos</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Estrategia de Asignación</label>
            <select
              v-model="bulkAssignmentStrategy"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="sequential">Secuencial - Asignar en orden de posiciones</option>
              <option value="by_category">Por Categoría - Agrupar productos similares</option>
              <option value="by_size">Por Tamaño - Productos grandes primero</option>
              <option value="random">Aleatorio - Distribución uniforme</option>
            </select>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Zona Objetivo</label>
              <select
                v-model="bulkAssignmentZone"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todas las zonas disponibles</option>
                <option
                  v-for="zone in availableZones"
                  :key="zone.id"
                  :value="zone.id"
                >
                  {{ zone.code }} - {{ zone.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Stock por Defecto</label>
              <Input
                v-model.number="bulkAssignmentStock"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="mt-1"
              />
            </div>
          </div>

          <div class="p-4 bg-muted/50 rounded-lg">
            <div class="text-sm font-medium mb-2">Resumen</div>
            <div class="text-sm text-muted-foreground">
              <div>Productos a asignar: {{ selectedProducts.length || unassignedProducts.length }}</div>
              <div>Posiciones disponibles: {{ availablePositionsCount }}</div>
              <div>Zona objetivo: {{ bulkAssignmentZone ? availableZones.find(z => z.id === bulkAssignmentZone)?.name : 'Todas' }}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="showBulkAssignment = false">
            Cancelar
          </Button>
          <Button @click="executeBulkAssignment" :disabled="bulkProcessing">
            <Loader2 v-if="bulkProcessing" class="mr-2 h-4 w-4 animate-spin" />
            Ejecutar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Quick Setup Dialog -->
    <Dialog v-model:open="showQuickSetup">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuración Rápida de Almacén</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="createQuickSetup" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Número de Zonas</label>
            <Input
              v-model.number="quickSetup.zones"
              type="number"
              min="1"
              max="20"
              required
              class="mt-1"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Pasillos por Zona</label>
              <Input
                v-model.number="quickSetup.aislesPerZone"
                type="number"
                min="1"
                max="10"
                required
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Estantes por Pasillo</label>
              <Input
                v-model.number="quickSetup.shelvesPerAisle"
                type="number"
                min="1"
                max="20"
                required
                class="mt-1"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Niveles por Estante</label>
              <Input
                v-model.number="quickSetup.levelsPerShelf"
                type="number"
                min="1"
                max="8"
                required
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posiciones por Nivel</label>
              <Input
                v-model.number="quickSetup.positionsPerLevel"
                type="number"
                min="1"
                max="10"
                required
                class="mt-1"
              />
            </div>
          </div>

          <div class="p-3 bg-primary/10 rounded-lg">
            <div class="text-sm font-medium">
              Total de posiciones: {{ quickSetup.zones * quickSetup.aislesPerZone * (quickSetup.shelvesPerAisle * 2) * quickSetup.levelsPerShelf * quickSetup.positionsPerLevel }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ quickSetup.zones }} zonas × {{ quickSetup.aislesPerZone }} pasillos × {{ quickSetup.shelvesPerAisle * 2 }} estantes (ambos lados) × {{ quickSetup.levelsPerShelf }} niveles × {{ quickSetup.positionsPerLevel }} posiciones
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showQuickSetup = false">
              Cancelar
            </Button>
            <Button type="button" @click="createQuickSetup" :disabled="quickSetupProcessing">
              <Loader2 v-if="quickSetupProcessing" class="mr-2 h-4 w-4 animate-spin" />
              Crear Estructura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, unref } from 'vue'
import { useWarehouseManager } from '@/composables/useWarehouseManager'
import { useProductLocationTracking } from '@/composables/useProductLocationTracking'
import { useCompaniesStore } from '@/stores/companies'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import {
  Package,
  Settings,
  RefreshCw,
  Loader2,
  MapPin,
  Plus
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'

const warehouseManager = useWarehouseManager()
const locationTracking = useProductLocationTracking()
const companiesStore = useCompaniesStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()

// State
const selectedWarehouseId = ref('')
const selectedProducts = ref<string[]>([])
const selectedLocationId = ref('')
const selectedLocation = ref<any>(null)
const selectedZoneFilter = ref('')
const loading = ref(false)

// Dialogs
const showAssignmentDialog = ref(false)
const showBulkAssignment = ref(false)
const showQuickSetup = ref(false)

// Processing states
const assignmentProcessing = ref(false)
const bulkProcessing = ref(false)
const quickSetupProcessing = ref(false)

// Data
const unassignedProducts = ref<any[]>([])
const availablePositions = ref<any[]>([])
const warehouseStats = ref<any>(null)

// Forms
const assignmentForm = ref({
  product_id: '',
  stock_actual: 0,
  capacity_max: 100,
  es_principal: false
})

const bulkAssignmentStrategy = ref('sequential')
const bulkAssignmentZone = ref('')
const bulkAssignmentStock = ref(0)

const quickSetup = ref({
  zones: 3,
  aislesPerZone: 2,
  shelvesPerAisle: 5,
  levelsPerShelf: 4,
  positionsPerLevel: 3
})

// Computed properties
const availableWarehouses = computed(() => {
  // Use unref to get the actual value whether it's a ref or not
  const warehouses = unref(warehouseManager.activeWarehouses)

  if (!warehouses || !Array.isArray(warehouses)) {
    return []
  }

  // Filter out any undefined or null values and ensure each warehouse has required properties
  return warehouses.filter(warehouse =>
    warehouse &&
    warehouse.id &&
    (warehouse.name || warehouse.code)
  )
})

const availableZones = computed(() => {
  if (!selectedWarehouseId.value) return []
  const zones = unref(warehouseManager.zones)
  if (!zones || !Array.isArray(zones)) return []
  return zones.filter(zone => zone.warehouse_id === selectedWarehouseId.value)
})

const filteredAvailablePositions = computed(() => {
  let positions = availablePositions.value
  if (selectedZoneFilter.value) {
    positions = positions.filter(pos => pos.zone_id === selectedZoneFilter.value)
  }
  return positions
})

const availablePositionsCount = computed(() => {
  return filteredAvailablePositions.value.filter(pos => !pos.is_occupied).length
})

// Methods
const onWarehouseChange = async () => {
  if (!selectedWarehouseId.value || !companiesStore.currentCompany) return

  try {
    loading.value = true

    // Load warehouse structure
    await Promise.all([
      warehouseManager.fetchZones(companiesStore.currentCompany.id, selectedWarehouseId.value),
      warehouseManager.fetchAisles(companiesStore.currentCompany.id),
      warehouseManager.fetchShelves(companiesStore.currentCompany.id),
      warehouseManager.fetchShelfPositions(companiesStore.currentCompany.id)
    ])

    // Load products and available positions
    await Promise.all([
      loadUnassignedProducts(),
      loadAvailablePositions(),
      loadWarehouseStats()
    ])
  } catch (error) {
    console.error('Error loading warehouse data:', error)
  } finally {
    loading.value = false
  }
}

const loadUnassignedProducts = async () => {
  if (!companiesStore.currentCompany) return

  try {
    // Get all products using the function that includes stock
    const { data: products, error: productsError } = await supabase
      .rpc('list_products_full', {
        p_company_id: companiesStore.currentCompany.id
      })

    if (productsError) throw productsError

    // Get products that already have locations
    const { data: assignedProducts, error: assignedError } = await supabase
      .from('product_location')
      .select('product_id')
      .eq('estado', true)

    if (assignedError) throw assignedError

    const assignedProductIds = new Set(assignedProducts?.map(p => p.product_id) || [])

    unassignedProducts.value = (products || []).filter(product =>
      !assignedProductIds.has(product.product_id || product.id)
    )
  } catch (error) {
    console.error('Error loading unassigned products:', error)
    unassignedProducts.value = []
  }
}

const loadAvailablePositions = async () => {
  if (!selectedWarehouseId.value || !companiesStore.currentCompany) return

  try {
    const { data, error } = await supabase
      .from('v_product_locations_detailed')
      .select(`
        shelf_position_id,
        full_location_code,
        zone_code,
        aisle_code,
        shelf_code,
        level_number,
        position_number,
        zone_id
      `)
      .eq('warehouse_id', selectedWarehouseId.value)

    if (error) throw error

    // Get all shelf positions for this warehouse
    const { data: allPositions, error: positionsError } = await supabase
      .from('warehouse_shelf_positions')
      .select(`
        id,
        location_code,
        level_number,
        position_number,
        warehouse_shelf_id,
        warehouse_shelves!inner(
          code,
          warehouse_aisle_id,
          warehouse_aisles!inner(
            code,
            warehouse_zone_id,
            warehouse_zones!inner(
              code,
              name,
              warehouse_id
            )
          )
        )
      `)
      .eq('warehouse_shelves.warehouse_aisles.warehouse_zones.warehouse_id', selectedWarehouseId.value)
      .eq('is_active', true)

    if (positionsError) throw positionsError

    const occupiedPositions = new Set(data?.map(d => d.shelf_position_id) || [])

    availablePositions.value = (allPositions || []).map(position => ({
      id: position.id,
      location_code: position.location_code,
      level_number: position.level_number,
      position_number: position.position_number,
      shelf_code: position.warehouse_shelves.code,
      aisle_code: position.warehouse_shelves.warehouse_aisles.code,
      zone_code: position.warehouse_shelves.warehouse_aisles.warehouse_zones.code,
      zone_name: position.warehouse_shelves.warehouse_aisles.warehouse_zones.name,
      zone_id: position.warehouse_shelves.warehouse_aisles.warehouse_zone_id,
      is_occupied: occupiedPositions.has(position.id)
    }))
  } catch (error) {
    console.error('Error loading available positions:', error)
    availablePositions.value = []
  }
}

const loadWarehouseStats = async () => {
  if (!selectedWarehouseId.value) return

  try {
    const zones = availableZones.value.length
    const totalPositions = availablePositions.value.length
    const occupiedPositions = availablePositions.value.filter(pos => pos.is_occupied).length

    warehouseStats.value = {
      zones,
      totalPositions,
      occupiedPositions,
      occupancyRate: totalPositions > 0 ? (occupiedPositions / totalPositions * 100).toFixed(1) : 0
    }
  } catch (error) {
    console.error('Error calculating warehouse stats:', error)
  }
}

const refreshProducts = async () => {
  await loadUnassignedProducts()
}

const toggleProductSelection = (productId: string) => {
  const index = selectedProducts.value.indexOf(productId)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push(productId)
  }
}

const selectLocation = (position: any) => {
  selectedLocationId.value = position.id
  selectedLocation.value = position
}

const openAssignmentDialog = (position: any) => {
  selectedLocation.value = position
  showAssignmentDialog.value = true
}

const quickAssignProduct = (product: any) => {
  // Find the first available position
  const availablePosition = availablePositions.value.find(pos => !pos.is_occupied)
  if (availablePosition) {
    selectedLocation.value = availablePosition
    assignmentForm.value.product_id = product.product_id || product.id
    assignmentForm.value.stock_actual = product.total_stock || 0
    showAssignmentDialog.value = true
  }
}

const confirmAssignment = async () => {
  if (!assignmentForm.value.product_id || !selectedLocation.value) return

  try {
    assignmentProcessing.value = true

    await locationTracking.createProductLocation({
      product_id: assignmentForm.value.product_id,
      warehouse_id: selectedWarehouseId.value,
      warehouse_zone_id: selectedLocation.value.zone_id,
      warehouse_shelf_position_id: selectedLocation.value.id,
      stock_actual: assignmentForm.value.stock_actual,
      capacity_max: assignmentForm.value.capacity_max,
      location_priority: 1,
      es_principal: assignmentForm.value.es_principal,
      estado: true
    })

    // Refresh data
    await Promise.all([
      loadUnassignedProducts(),
      loadAvailablePositions()
    ])

    cancelAssignment()
  } catch (error) {
    console.error('Error assigning product:', error)
  } finally {
    assignmentProcessing.value = false
  }
}

const cancelAssignment = () => {
  showAssignmentDialog.value = false
  assignmentForm.value = {
    product_id: '',
    stock_actual: 0,
    capacity_max: 100,
    es_principal: false
  }
  selectedLocation.value = null
}

const bulkAssignSelected = () => {
  if (selectedProducts.value.length > 0) {
    showBulkAssignment.value = true
  }
}

const executeBulkAssignment = async () => {
  if (!selectedWarehouseId.value) return

  try {
    bulkProcessing.value = true

    const productsToAssign = selectedProducts.value.length > 0
      ? unassignedProducts.value.filter(p => selectedProducts.value.includes(p.product_id || p.id))
      : unassignedProducts.value

    const availableSpots = availablePositions.value.filter(pos =>
      !pos.is_occupied &&
      (!bulkAssignmentZone.value || pos.zone_id === bulkAssignmentZone.value)
    )

    if (productsToAssign.length > availableSpots.length) {
      alert(`No hay suficientes posiciones disponibles. Productos: ${productsToAssign.length}, Posiciones: ${availableSpots.length}`)
      return
    }

    // Apply assignment strategy
    let sortedProducts = [...productsToAssign]
    let sortedPositions = [...availableSpots]

    switch (bulkAssignmentStrategy.value) {
      case 'sequential':
        // Already sorted
        break
      case 'by_category':
        // Sort by product name/category
        sortedProducts.sort((a, b) => (a.product_name || a.name).localeCompare(b.product_name || b.name))
        break
      case 'by_size':
        // Sort by stock (assuming larger stock = larger products)
        sortedProducts.sort((a, b) => (b.total_stock || 0) - (a.total_stock || 0))
        break
      case 'random':
        sortedProducts = sortedProducts.sort(() => Math.random() - 0.5)
        sortedPositions = sortedPositions.sort(() => Math.random() - 0.5)
        break
    }

    // Execute assignments
    for (let i = 0; i < sortedProducts.length; i++) {
      const product = sortedProducts[i]
      const position = sortedPositions[i]

      if (position) {
        const locationData = {
          product_id: product.product_id || product.id,
          warehouse_id: selectedWarehouseId.value,
          warehouse_zone_id: position.zone_id,
          warehouse_shelf_position_id: position.id,
          stock_actual: bulkAssignmentStock.value || product.total_stock || 0,
          capacity_max: 100,
          location_priority: 1,
          es_principal: i === 0, // First assignment is primary
          estado: true
        }

        await locationTracking.createProductLocation(locationData)
      }
    }

    // Refresh data
    await Promise.all([
      loadUnassignedProducts(),
      loadAvailablePositions()
    ])

    selectedProducts.value = []
    showBulkAssignment.value = false

  } catch (error) {
    console.error('Error executing bulk assignment:', error)
  } finally {
    bulkProcessing.value = false
  }
}

const createQuickSetup = async () => {
  if (!selectedWarehouseId.value) {
    alert('Por favor selecciona un almacén primero')
    return
  }

  if (!companiesStore.currentCompany) {
    alert('No hay una empresa seleccionada')
    return
  }

  try {
    quickSetupProcessing.value = true

    // Configuración del layout del almacén
    const warehouseConfig = {
      totalWidth: 50,     // Ancho total del almacén en metros
      totalLength: 80,    // Largo total del almacén en metros
      zoneSpacing: 5,     // Espaciado entre zonas
      aisleSpacing: 3,    // Espaciado entre pasillos
      shelfSpacing: 1.5,  // Espaciado entre estantes
      shelfWidth: 1.2,    // Ancho del estante
      shelfDepth: 0.6,    // Profundidad del estante
      aisleWidth: 2.5     // Ancho del pasillo
    }

    // Calcular dimensiones por zona
    const zoneWidth = (warehouseConfig.totalWidth - (quickSetup.value.zones - 1) * warehouseConfig.zoneSpacing) / quickSetup.value.zones
    const zoneLength = warehouseConfig.totalLength

    // Create zones with logical coordinates
    for (let z = 1; z <= quickSetup.value.zones; z++) {
      const zoneX = (z - 1) * (zoneWidth + warehouseConfig.zoneSpacing)

      const zoneData = {
        company_id: companiesStore.currentCompany.id,
        warehouse_id: selectedWarehouseId.value,
        code: `Z${z.toString().padStart(2, '0')}`,
        name: `Zona ${z}`,
        width: zoneWidth,
        height: 3,
        length: zoneLength,
        x_coordinate: zoneX,
        y_coordinate: 0,
        z_coordinate: 0,
        rotation_degrees: 0,
        shape_type: 'RECTANGLE',
        color_hex: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][z % 5], // Colores diferentes por zona
        opacity: 0.7
      }

      const zone = await warehouseManager.createZone(zoneData)

      // Calcular ancho disponible para pasillos dentro de la zona
      const aisleLength = zoneLength - 4 // Margen de 2m a cada lado
      const aisleSpacePerAisle = (zoneWidth - warehouseConfig.aisleSpacing) / quickSetup.value.aislesPerZone

      // Create aisles for this zone with calculated positions
      for (let a = 1; a <= quickSetup.value.aislesPerZone; a++) {
        const aisleX = zoneX + 2 + (a - 1) * aisleSpacePerAisle // 2m de margen + espaciado
        const aisleY = 2 // Margen desde el borde de la zona

        const aisleData = {
          company_id: companiesStore.currentCompany.id,
          warehouse_zone_id: zone.id,
          code: `${zoneData.code}-P${a}`,
          name: `Pasillo ${a}`,
          start_x: aisleX,
          start_y: aisleY,
          end_x: aisleX,
          end_y: aisleY + aisleLength,
          width: warehouseConfig.aisleWidth,
          direction: 'VERTICAL' as const, // Pasillos verticales para mejor visualización
          is_main_aisle: a === 1
        }

        const aisle = await warehouseManager.createAisle(aisleData)

        // Calcular espaciado para estantes a lo largo del pasillo
        const shelfSpacePerShelf = (aisleLength - warehouseConfig.shelfSpacing) / quickSetup.value.shelvesPerAisle

        // Create shelves for this aisle with calculated positions
        for (let s = 1; s <= quickSetup.value.shelvesPerAisle; s++) {
          const shelfX = aisleX + warehouseConfig.aisleWidth + 0.5 // Al lado del pasillo
          const shelfY = aisleY + (s - 1) * shelfSpacePerShelf

          const shelfData = {
            company_id: companiesStore.currentCompany.id,
            warehouse_aisle_id: aisle.id,
            code: `${aisleData.code}-E${s.toString().padStart(2, '0')}`,
            name: `Estante ${s}`,
            position_x: shelfX,
            position_y: shelfY,
            position_z: 0,
            width: warehouseConfig.shelfWidth,
            depth: warehouseConfig.shelfDepth,
            height: 2.4,
            levels: quickSetup.value.levelsPerShelf,
            level_height: 0.6,
            max_weight_kg: 1000,
            load_capacity_per_level: 250,
            shelf_type: 'STANDARD',
            material: 'STEEL',
            is_active: true
          }

          const shelf = await warehouseManager.createShelf(shelfData)

          // Create positions for this shelf with calculated coordinates
          for (let level = 1; level <= quickSetup.value.levelsPerShelf; level++) {
            for (let pos = 1; pos <= quickSetup.value.positionsPerLevel; pos++) {
              const positionData = {
                company_id: companiesStore.currentCompany.id,
                warehouse_shelf_id: shelf.id,
                level_number: level,
                position_number: pos,
                width: warehouseConfig.shelfWidth / quickSetup.value.positionsPerLevel,
                depth: warehouseConfig.shelfDepth,
                height: 0.5,
                max_weight_kg: 50,
                max_volume_m3: 0.15,
                is_reserved: false,
                is_active: true,
                condition: 'GOOD'
              }

              await warehouseManager.createShelfPosition(positionData)
            }
          }
        }

        // Crear estantes en el lado opuesto del pasillo también
        for (let s = 1; s <= quickSetup.value.shelvesPerAisle; s++) {
          const shelfX = aisleX - warehouseConfig.shelfWidth - 0.5 // Al otro lado del pasillo
          const shelfY = aisleY + (s - 1) * shelfSpacePerShelf

          const shelfData = {
            company_id: companiesStore.currentCompany.id,
            warehouse_aisle_id: aisle.id,
            code: `${aisleData.code}-E${(s + quickSetup.value.shelvesPerAisle).toString().padStart(2, '0')}`,
            name: `Estante ${s + quickSetup.value.shelvesPerAisle}`,
            position_x: shelfX,
            position_y: shelfY,
            position_z: 0,
            width: warehouseConfig.shelfWidth,
            depth: warehouseConfig.shelfDepth,
            height: 2.4,
            levels: quickSetup.value.levelsPerShelf,
            level_height: 0.6,
            max_weight_kg: 1000,
            load_capacity_per_level: 250,
            shelf_type: 'STANDARD',
            material: 'STEEL',
            is_active: true
          }

          const shelf = await warehouseManager.createShelf(shelfData)

          // Create positions for this shelf
          for (let level = 1; level <= quickSetup.value.levelsPerShelf; level++) {
            for (let pos = 1; pos <= quickSetup.value.positionsPerLevel; pos++) {
              const positionData = {
                company_id: companiesStore.currentCompany.id,
                warehouse_shelf_id: shelf.id,
                level_number: level,
                position_number: pos,
                width: warehouseConfig.shelfWidth / quickSetup.value.positionsPerLevel,
                depth: warehouseConfig.shelfDepth,
                height: 0.5,
                max_weight_kg: 50,
                max_volume_m3: 0.15,
                is_reserved: false,
                is_active: true,
                condition: 'GOOD'
              }

              await warehouseManager.createShelfPosition(positionData)
            }
          }
        }
      }
    }

    showQuickSetup.value = false
    await onWarehouseChange() // Refresh data
    alert('Estructura de almacén creada exitosamente con coordenadas calculadas!')

  } catch (error) {
    console.error('Error creating quick setup:', error)
    alert(`Error al crear la estructura: ${error.message || error}`)
  } finally {
    quickSetupProcessing.value = false
  }
}

const filterLocations = () => {
  // Filtering is handled by computed property
}

const refreshWarehouseData = async () => {
  if (companiesStore.currentCompany) {
    console.log('Refreshing warehouse data...')
    await warehouseManager.initializeWarehouseData(companiesStore.currentCompany.id)
  }
}

// Initialize
onMounted(async () => {
  try {
    // Ensure we have a current company
    if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0) {
      // Try to load user companies if not loaded
      if (authStore.user?.id) {
        await companiesStore.fetchUserCompanies(authStore.user.id)
      }
    }

    // Select first company if none selected
    if (!companiesStore.currentCompany && companiesStore.userCompanies.length > 0) {
      companiesStore.selectCompany(companiesStore.userCompanies[0].company)
    }

    // Initialize warehouse data
    if (companiesStore.currentCompany) {
      await warehouseManager.initializeWarehouseData(companiesStore.currentCompany.id)
    }
  } catch (error) {
    console.error('Error initializing ProductLocationAssigner:', error)
  }
})

// Watch for company changes
watch(() => companiesStore.currentCompany, async (newCompany) => {
  if (newCompany) {
    try {
      await warehouseManager.initializeWarehouseData(newCompany.id)
    } catch (error) {
      console.error('Error reloading warehouse data:', error)
    }
  }
})
</script>
