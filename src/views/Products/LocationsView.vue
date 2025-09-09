<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Ubicaciones de Productos</h1>
        <p class="text-muted-foreground">
          Gestiona las ubicaciones físicas de los productos en almacenes
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar Producto</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Nombre o SKU del producto..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select 
              v-model="selectedWarehouse"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los almacenes</option>
              <option 
                v-for="warehouse in productsStore.warehouses" 
                :key="warehouse.id" 
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Zona</label>
            <select 
              v-model="selectedZone"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div>
            <label class="text-sm font-medium">Solo Principales</label>
            <div class="mt-2">
              <input
                id="principal-only"
                type="checkbox"
                v-model="principalOnly"
                class="rounded border-gray-300"
              />
              <label for="principal-only" class="ml-2 text-sm">
                Solo ubicaciones principales
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Locations Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Ubicaciones ({{ filteredLocations.length }})</span>
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
            <TableRow v-if="productsStore.loading">
              <TableCell colspan="10" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando ubicaciones...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredLocations.length === 0">
              <TableCell colspan="10" class="text-center py-8 text-muted-foreground">
                No se encontraron ubicaciones
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="location in filteredLocations" :key="location.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <MapPin class="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ getProductName(location.product_id) }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code class="bg-muted px-2 py-1 rounded text-sm">
                  {{ getProductSKU(location.product_id) }}
                </code>
              </TableCell>
              <TableCell>{{ getWarehouseName(location) }}</TableCell>
              <TableCell>{{ getZoneName(location.warehouse_zone_id) }}</TableCell>
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
                  v-for="product in productsStore.products" 
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
                  v-for="zone in productsStore.warehouseZones" 
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
                v-model.number="locationForm.position_x"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posición Y</label>
              <Input
                v-model.number="locationForm.position_y"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posición Z (Altura)</label>
              <Input
                v-model.number="locationForm.position_z"
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
                v-model.number="locationForm.capacity_max"
                type="number"
                step="0.01"
                placeholder="Sin límite"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Stock Actual</label>
              <Input
                v-model.number="locationForm.stock_actual"
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
            <Button type="submit" :disabled="productsStore.loading">
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
import { useCompanyStore } from '@/stores/company'
import { useProductsStore, type ProductLocation } from '@/stores/products'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, Edit, Trash2, Loader2 } from 'lucide-vue-next'

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

const companyStore = useCompanyStore()
const productsStore = useProductsStore()

// State
const searchTerm = ref('')
const selectedWarehouse = ref('')
const selectedZone = ref('')
const principalOnly = ref(false)
const showCreateDialog = ref(false)
const editingLocation = ref<ProductLocation | null>(null)
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

// Computed
const filteredZones = computed(() => {
  if (!selectedWarehouse.value) return productsStore.warehouseZones
  return productsStore.warehouseZones.filter(zone => zone.warehouse_id === selectedWarehouse.value)
})

const filteredLocations = computed(() => {
  let locations = productsStore.productLocations

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    locations = locations.filter(location => {
      const product = productsStore.products.find(p => p.id === location.product_id)
      return product && (
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      )
    })
  }

  if (selectedWarehouse.value) {
    // Filter by warehouse through zones
    const warehouseZoneIds = productsStore.warehouseZones
      .filter(zone => zone.warehouse_id === selectedWarehouse.value)
      .map(zone => zone.id)
    
    locations = locations.filter(location => 
      location.warehouse_zone_id && warehouseZoneIds.includes(location.warehouse_zone_id)
    )
  }

  if (selectedZone.value) {
    locations = locations.filter(location => location.warehouse_zone_id === selectedZone.value)
  }

  if (principalOnly.value) {
    locations = locations.filter(location => location.es_principal)
  }

  return locations
})

// Methods
const getProductName = (productId: string): string => {
  return productsStore.products.find(p => p.id === productId)?.name || 'Producto no encontrado'
}

const getProductSKU = (productId: string): string => {
  return productsStore.products.find(p => p.id === productId)?.sku || '-'
}

const getWarehouseName = (location: ProductLocation): string => {
  if (!location.warehouse_zone_id) return '-'
  
  const zone = productsStore.warehouseZones.find(z => z.id === location.warehouse_zone_id)
  if (!zone) return '-'
  
  return productsStore.warehouses.find(w => w.id === zone.warehouse_id)?.name || '-'
}

const getZoneName = (zoneId?: string): string => {
  if (!zoneId) return '-'
  
  const zone = productsStore.warehouseZones.find(z => z.id === zoneId)
  return zone ? `${zone.code} - ${zone.name}` : '-'
}

const editLocation = (location: ProductLocation) => {
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

const deleteLocation = async (location: ProductLocation) => {
  if (confirm(`¿Estás seguro de que deseas eliminar esta ubicación?`)) {
    try {
      const { error } = await supabase
        .from('product_location')
        .delete()
        .eq('id', location.id)

      if (error) throw error

      // Remove from local array
      const index = productsStore.productLocations.findIndex(l => l.id === location.id)
      if (index > -1) {
        productsStore.productLocations.splice(index, 1)
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

      // Update in local array
      const index = productsStore.productLocations.findIndex(l => l.id === editingLocation.value?.id)
      if (index > -1 && data) {
        productsStore.productLocations[index] = data
      }
    } else {
      // Create new location
      const { data, error } = await supabase
        .from('product_location')
        .insert(locationData)
        .select()
        .single()

      if (error) throw error

      // Add to local array
      if (data) {
        productsStore.productLocations.push(data)
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

// Watch for warehouse changes to reset zone filter
watch(selectedWarehouse, () => {
  selectedZone.value = ''
})

onMounted(async () => {
  if (companyStore.selectedCompany) {
    // Load basic data first
    await Promise.all([
      productsStore.fetchProducts(companyStore.selectedCompany.id),
      productsStore.fetchWarehouses(companyStore.selectedCompany.id),
      productsStore.fetchWarehouseZones(companyStore.selectedCompany.id)
    ])
    
    // Load all product locations for the company
    await loadAllProductLocations()
  }
})

const loadAllProductLocations = async () => {
  try {
    if (!companyStore.selectedCompany) return
    
    const { data, error } = await supabase
      .from('product_location')
      .select('*')
      .eq('estado', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    productsStore.productLocations = data || []
  } catch (error) {
    console.error('Error loading product locations:', error)
  }
}
</script>