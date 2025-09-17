<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Ubicaciones de Productos</h1>
        <p class="text-muted-foreground">
          Visualiza y gestiona las ubicaciones físicas de los productos en almacenes
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- View mode selector -->
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-white dark:bg-gray-700 shadow-sm': viewMode === 'table' }"
            @click="setViewMode('table')"
          >
            <List class="h-4 w-4 mr-1" />
            Tabla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-white dark:bg-gray-700 shadow-sm': viewMode === '2d' }"
            @click="setViewMode('2d')"
          >
            <Map class="h-4 w-4 mr-1" />
            Vista 2D
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-white dark:bg-gray-700 shadow-sm': viewMode === '3d' }"
            @click="setViewMode('3d')"
          >
            <Box class="h-4 w-4 mr-1" />
            Vista 3D
          </Button>
        </div>

        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>
    </div>

    <!-- Enhanced Search and Filters -->
    <WarehouseSearchFilters
      :warehouses="warehouseVisualizer.warehouses.value"
      :zones="warehouseVisualizer.zones.value"
      @filters-changed="onFiltersChanged"
      @warehouse-selected="onWarehouseSelected"
      @product-searched="onProductSearched"
    />

    <!-- Main Content Area -->
    <div class="min-h-[600px]">
      <!-- Table View -->
      <Card v-if="viewMode === 'table'">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Ubicaciones ({{ warehouseVisualizer.filteredLocations.value.length }})</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Posición</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="warehouseVisualizer.loading.value">
                <TableCell colspan="10" class="text-center py-8">
                  <div class="flex items-center justify-center">
                    <Loader2 class="h-6 w-6 animate-spin mr-2" />
                    Cargando ubicaciones...
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="warehouseVisualizer.filteredLocations.value.length === 0">
                <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
                  No se encontraron ubicaciones
                </TableCell>
              </TableRow>
              <TableRow v-else v-for="location in warehouseVisualizer.filteredLocations.value" :key="location.id">
                <TableCell>
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <MapPin class="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p class="font-medium">{{ location.product_name || 'Sin nombre' }}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code class="bg-muted px-2 py-1 rounded text-sm">
                    {{ location.product_sku || '-' }}
                  </code>
                </TableCell>
                <TableCell>{{ location.warehouse_name }}</TableCell>
                <TableCell>{{ location.zone_name || '-' }}</TableCell>
                <TableCell>
                  <div class="font-mono text-sm">
                    <span v-if="location.position_x !== null && location.position_y !== null">
                      X:{{ location.position_x }}, Y:{{ location.position_y }}
                      <span v-if="location.position_z !== null">, Z:{{ location.position_z }}</span>
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span v-if="location.capacity_max">
                    {{ location.capacity_max }} unidades
                  </span>
                  <span v-else class="text-muted-foreground">Sin límite</span>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ location.stock_actual }}</span>
                    <Badge
                      v-if="location.capacity_max && location.stock_actual >= location.capacity_max"
                      variant="warning"
                      class="text-xs"
                    >
                      Lleno
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="location.es_principal ? 'success' : 'outline'">
                    {{ location.es_principal ? 'Principal' : 'Secundaria' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="location.estado ? 'success' : 'outline'">
                    {{ location.estado ? 'Activa' : 'Inactiva' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      @click="editLocation(location)"
                    >
                      <Edit class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="deleteLocation(location)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- 2D View -->
      <Warehouse2DViewer
        v-else-if="viewMode === '2d'"
        :locations="warehouseVisualizer.filteredLocations.value"
        :zones="warehouseVisualizer.zones.value.filter(z => !warehouseVisualizer.selectedWarehouse.value || z.warehouse_id === warehouseVisualizer.selectedWarehouse.value)"
        :warehouse-bounds="warehouseVisualizer.warehouseBounds.value"
        :search-query="searchQuery"
        @location-selected="onLocationSelected"
        @zone-selected="onZoneSelected"
      />

      <!-- 3D View -->
      <Warehouse3DViewer
        v-else-if="viewMode === '3d'"
        :locations="warehouseVisualizer.filteredLocations.value"
        :zones="warehouseVisualizer.zones.value.filter(z => !warehouseVisualizer.selectedWarehouse.value || z.warehouse_id === warehouseVisualizer.selectedWarehouse.value)"
        :warehouse-bounds="warehouseVisualizer.warehouseBounds.value"
        :search-query="searchQuery"
        @location-selected="onLocationSelected"
        @zone-selected="onZoneSelected"
      />
    </div>

    <!-- Create/Edit Location Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-2xl" v-slot="{ close }">
        <DialogHeader>
          <DialogTitle>
            {{ editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación' }}
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Producto</label>
              <select
                v-model="locationForm.product_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar producto</option>
                <option
                  v-for="product in warehouseVisualizer.products.value"
                  :key="product.id"
                  :value="product.id"
                >
                  {{ product.name }} ({{ product.sku }})
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium">Zona del Almacén</label>
              <select
                v-model="locationForm.warehouse_zone_id"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin zona específica</option>
                <option
                  v-for="zone in warehouseVisualizer.zones.value"
                  :key="zone.id"
                  :value="zone.id"
                >
                  {{ zone.code }} - {{ zone.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Posición X</label>
              <Input
                v-model="locationForm.position_x"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posición Y</label>
              <Input
                v-model="locationForm.position_y"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posición Z (Altura)</label>
              <Input
                v-model="locationForm.position_z"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Capacidad Máxima</label>
              <Input
                v-model="locationForm.capacity_max"
                type="number"
                step="0.01"
                placeholder="Sin límite"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Stock Actual</label>
              <Input
                v-model="locationForm.stock_actual"
                type="number"
                step="0.01"
                placeholder="0"
                class="mt-1"
              />
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="flex items-center space-x-2">
              <input
                id="es_principal"
                type="checkbox"
                v-model="locationForm.es_principal"
                class="rounded border-gray-300"
              />
              <label for="es_principal" class="text-sm font-medium">
                Ubicación principal del producto
              </label>
            </div>

            <div class="flex items-center space-x-2">
              <input
                id="estado"
                type="checkbox"
                v-model="locationForm.estado"
                class="rounded border-gray-300"
              />
              <label for="estado" class="text-sm font-medium">Ubicación activa</label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="warehouseVisualizer.loading.value">
              {{ editingLocation ? 'Actualizar' : 'Crear' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useProductsStore, type ProductLocation } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { useWarehouseVisualizer, type LocationWithProduct } from '@/composables/useWarehouseVisualizer'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, Edit, Trash2, Loader2, List, Map, Box } from 'lucide-vue-next'

// Components
import WarehouseSearchFilters from '@/components/warehouse/WarehouseSearchFilters.vue'
import Warehouse2DViewer from '@/components/warehouse/Warehouse2DViewer.vue'
import Warehouse3DViewer from '@/components/warehouse/Warehouse3DViewer.vue'

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
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'

const companiesStore = useCompaniesStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const warehouseVisualizer = useWarehouseVisualizer()

// State
const viewMode = ref<'table' | '2d' | '3d'>('table')
const searchQuery = ref('')
const showCreateDialog = ref(false)
const editingLocation = ref<LocationWithProduct | null>(null)
const locationForm = ref({
  product_id: '',
  warehouse_zone_id: '',
  position_x: null as number | null,
  position_y: null as number | null,
  position_z: null as number | null,
  capacity_max: null as number | null,
  stock_actual: 0,
  es_principal: false,
  estado: true
})

// Methods
const setViewMode = (mode: 'table' | '2d' | '3d') => {
  viewMode.value = mode
  warehouseVisualizer.setViewMode(mode)
}

const onFiltersChanged = (filters: any) => {
  // Apply filters through the visualizer
  warehouseVisualizer.setSearchQuery(filters.productQuery || '')
  if (filters.warehouseId) {
    warehouseVisualizer.setSelectedWarehouse(filters.warehouseId)
  }
  // Add more filter logic as needed
}

const onWarehouseSelected = (warehouseId: string) => {
  warehouseVisualizer.setSelectedWarehouse(warehouseId || null)
}

const onProductSearched = (query: string) => {
  searchQuery.value = query
  warehouseVisualizer.setSearchQuery(query)
}

const onLocationSelected = (location: LocationWithProduct) => {
  console.log('Location selected:', location)
}

const onZoneSelected = (zone: any) => {
  console.log('Zone selected:', zone)
}

const getWarehouseName = (location: LocationWithProduct): string => {
  if (!location.warehouse_zone_id) return '-'

  const zone = warehouseVisualizer.zones.value.find(z => z.id === location.warehouse_zone_id)
  if (!zone) return '-'

  return warehouseVisualizer.warehouses.value.find(w => w.id === zone.warehouse_id)?.name || '-'
}

const editLocation = (location: LocationWithProduct) => {
  editingLocation.value = location
  locationForm.value = {
    product_id: location.product_id,
    warehouse_zone_id: location.warehouse_zone_id || '',
    position_x: location.position_x,
    position_y: location.position_y,
    position_z: location.position_z,
    capacity_max: location.capacity_max,
    stock_actual: location.stock_actual,
    es_principal: location.es_principal,
    estado: location.estado
  }
  showCreateDialog.value = true
}

const deleteLocation = async (location: LocationWithProduct) => {
  if (confirm(`¿Estás seguro de que deseas eliminar esta ubicación?`)) {
    try {
      const { error } = await supabase
        .from('product_location')
        .delete()
        .eq('id', location.id)

      if (error) throw error

      // Reload data
      if (companiesStore.currentCompany) {
        await warehouseVisualizer.fetchProductLocations(
          companiesStore.currentCompany.id,
          warehouseVisualizer.selectedWarehouse.value || undefined
        )
      }
    } catch (error) {
      console.error('Error deleting location:', error)
    }
  }
}

const submitForm = async () => {
  try {
    const locationData = {
      ...locationForm.value,
      warehouse_zone_id: locationForm.value.warehouse_zone_id || null
    }

    if (editingLocation.value) {
      // Update existing location
      const { data, error } = await supabase
        .from('product_location')
        .update(locationData)
        .eq('id', editingLocation.value.id)
        .select()
        .single()

      if (error) throw error

      // Reload data
      if (companiesStore.currentCompany) {
        await warehouseVisualizer.fetchProductLocations(
          companiesStore.currentCompany.id,
          warehouseVisualizer.selectedWarehouse.value || undefined
        )
      }
    } else {
      // Create new location
      const { data, error } = await supabase
        .from('product_location')
        .insert(locationData)
        .select()
        .single()

      if (error) throw error

      // Reload data
      if (companiesStore.currentCompany) {
        await warehouseVisualizer.fetchProductLocations(
          companiesStore.currentCompany.id,
          warehouseVisualizer.selectedWarehouse.value || undefined
        )
      }
    }

    cancelForm()
  } catch (error) {
    console.error('Error saving location:', error)
  }
}

const cancelForm = () => {
  showCreateDialog.value = false
  editingLocation.value = null
  locationForm.value = {
    product_id: '',
    warehouse_zone_id: '',
    position_x: null,
    position_y: null,
    position_z: null,
    capacity_max: null,
    stock_actual: 0,
    es_principal: false,
    estado: true
  }
}

const refreshData = async () => {
  if (companiesStore.currentCompany) {
    console.log('🏢 Current company:', companiesStore.currentCompany)

    await warehouseVisualizer.initializeData(companiesStore.currentCompany.id)

    // Debug warehouse data
    console.log('🏭 Warehouses loaded:', warehouseVisualizer.warehouses.value)
    console.log('📦 Zones loaded:', warehouseVisualizer.zones.value)
    console.log('📍 Locations loaded:', warehouseVisualizer.locations.value)
    console.log('🏗️ Selected warehouse data:', warehouseVisualizer.selectedWarehouseData.value)
    console.log('📐 Warehouse bounds:', warehouseVisualizer.warehouseBounds.value)

    // Also load basic products data for the form
    await Promise.all([
      productsStore.fetchProducts(companiesStore.currentCompany.id),
      productsStore.fetchWarehouses(companiesStore.currentCompany.id),
      productsStore.fetchWarehouseZones(companiesStore.currentCompany.id)
    ])
  }
}

onMounted(async () => {
  console.log('LocationsView onMounted - currentCompany:', companiesStore.currentCompany)

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0 && authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)
  }

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length > 0) {
    companiesStore.selectCompany(companiesStore.userCompanies[0].company)
  }

  if (companiesStore.currentCompany) {
    await refreshData()
  } else {
    console.warn('⚠️ No company available to load locations')
  }
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in LocationsView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshData()
    }
  }, { deep: true }
)
</script>
