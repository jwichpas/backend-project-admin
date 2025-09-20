<template>
  <div class="container mx-auto p-6 max-w-7xl">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestión de Vehículos</h1>
        <p class="text-muted-foreground">
          Administra la flota de vehículos propios y de terceros
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="mr-2 h-4 w-4" />
        Nuevo Vehículo
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total Vehículos</p>
            <p class="text-2xl font-bold">{{ vehicles.length }}</p>
          </div>
          <Truck class="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Vehículos Propios</p>
            <p class="text-2xl font-bold">{{ ownVehicles.length }}</p>
          </div>
          <Car class="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Terceros</p>
            <p class="text-2xl font-bold">{{ thirdPartyVehicles.length }}</p>
          </div>
          <Users class="h-8 w-8 text-orange-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">En Línea</p>
            <p class="text-2xl font-bold text-green-600">
              {{ vehiclesWithStatus.filter(v => v.realtime_status?.status === 'active').length }}
            </p>
          </div>
          <MapPin class="h-8 w-8 text-green-600" />
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por placa, marca o modelo..."
            class="pl-10 w-[300px]"
          />
        </div>
        
        <select
          v-model="filterOwnership"
          class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los vehículos</option>
          <option value="own">Solo propios</option>
          <option value="third_party">Solo terceros</option>
        </select>

        <select
          v-model="filterStatus"
          class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="idle">Inactivos</option>
          <option value="stopped">Detenidos</option>
          <option value="maintenance">Mantenimiento</option>
        </select>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" @click="toggleRealtimeTracking">
          <Radio :class="{ 'animate-pulse text-green-500': realtimeEnabled }" class="mr-2 h-4 w-4" />
          {{ realtimeEnabled ? 'Desactivar' : 'Activar' }} Seguimiento
        </Button>
        <Button variant="outline" @click="refreshData">
          <RefreshCw :class="{ 'animate-spin': loading }" class="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Vehicles Table -->
    <div class="bg-card border border-border rounded-lg">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold">Lista de Vehículos</h3>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Cargando vehículos...</p>
      </div>

      <div v-else-if="filteredVehicles.length === 0" class="p-8 text-center">
        <Truck class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p class="text-muted-foreground mb-4">No se encontraron vehículos</p>
        <Button @click="openCreateDialog">
          <Plus class="mr-2 h-4 w-4" />
          Registrar Primer Vehículo
        </Button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left p-4 font-medium">Estado</th>
              <th class="text-left p-4 font-medium">Placa</th>
              <th class="text-left p-4 font-medium">Marca/Modelo</th>
              <th class="text-left p-4 font-medium">Año</th>
              <th class="text-left p-4 font-medium">Tipo</th>
              <th class="text-left p-4 font-medium">Capacidad</th>
              <th class="text-left p-4 font-medium">Proveedor</th>
              <th class="text-left p-4 font-medium">Ubicación</th>
              <th class="text-right p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id"
              class="border-b border-border hover:bg-muted/50"
            >
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <div
                    :class="getStatusColor(vehicle.realtime_status?.status)"
                    class="w-3 h-3 rounded-full"
                  ></div>
                  <span class="text-sm">
                    {{ getStatusLabel(vehicle.realtime_status?.status) }}
                  </span>
                </div>
              </td>
              
              <td class="p-4 font-medium">{{ vehicle.plate }}</td>
              
              <td class="p-4">
                <div>
                  <p class="font-medium">{{ vehicle.brand || 'N/A' }}</p>
                  <p class="text-sm text-muted-foreground">{{ vehicle.model || '' }}</p>
                </div>
              </td>
              
              <td class="p-4">{{ vehicle.year || 'N/A' }}</td>
              
              <td class="p-4">
                <Badge :variant="vehicle.own ? 'default' : 'secondary'">
                  {{ vehicle.own ? 'Propio' : 'Tercero' }}
                </Badge>
              </td>
              
              <td class="p-4">
                {{ vehicle.capacity_kg ? `${formatNumber(vehicle.capacity_kg)} kg` : 'N/A' }}
              </td>
              
              <td class="p-4">
                {{ vehicle.provider_name || (vehicle.own ? '-' : 'N/A') }}
              </td>
              
              <td class="p-4">
                <div v-if="vehicle.realtime_status?.latitude && vehicle.realtime_status?.longitude" class="text-sm">
                  <p class="flex items-center gap-1">
                    <MapPin class="h-3 w-3" />
                    {{ vehicle.realtime_status.latitude.toFixed(6) }},
                    {{ vehicle.realtime_status.longitude.toFixed(6) }}
                  </p>
                  <p class="text-muted-foreground" v-if="vehicle.realtime_status?.speed_kph">
                    {{ vehicle.realtime_status.speed_kph }} km/h
                  </p>
                </div>
                <span v-else class="text-muted-foreground text-sm">Sin ubicación</span>
              </td>
              
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="viewVehicleDetails(vehicle)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="editVehicle(vehicle)"
                    title="Editar"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="openManageDriversDialog(vehicle)"
                    title="Gestionar conductores"
                  >
                    <Users class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="confirmDelete(vehicle)"
                    title="Eliminar"
                    class="text-red-600 hover:text-red-700"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Vehicle Dialog -->
    <Dialog :open="showVehicleDialog" @update:open="showVehicleDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {{ editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo' }}
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="saveVehicle" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Placa *</label>
              <Input
                v-model="vehicleForm.plate"
                placeholder="ABC-123"
                required
                :class="{ 'border-red-500': !validatePlate(vehicleForm.plate) && vehicleForm.plate }"
              />
              <p v-if="!validatePlate(vehicleForm.plate) && vehicleForm.plate" class="text-xs text-red-500 mt-1">
                Formato inválido (ej: ABC-123)
              </p>
            </div>

            <div>
              <label class="text-sm font-medium">Tipo de Vehículo *</label>
              <select
                v-model="vehicleForm.own"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option :value="true">Propio</option>
                <option :value="false">Tercero</option>
              </select>
            </div>
          </div>

          <div v-if="!vehicleForm.own">
            <label class="text-sm font-medium">Proveedor</label>
            <div class="relative">
              <Input
                v-model="supplierSearchQuery"
                placeholder="Buscar proveedor por nombre o documento..."
                @input="filterSuppliers"
                @focus="showSupplierDropdown = true"
                class="pr-10"
              />
              <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <!-- Dropdown de resultados -->
              <div
                v-if="showSupplierDropdown && filteredSuppliers.length > 0"
                class="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="supplier in filteredSuppliers.slice(0, 10)"
                  :key="supplier.id"
                  @click="selectSupplier(supplier)"
                  class="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                >
                  <div class="font-medium">{{ supplier.name || supplier.fullname }}</div>
                  <div class="text-sm text-muted-foreground">{{ supplier.doc_type }} {{ supplier.doc_number }}</div>
                  <div v-if="supplier.email" class="text-xs text-muted-foreground">{{ supplier.email }}</div>
                </div>
              </div>

              <!-- Proveedor seleccionado -->
              <div v-if="selectedSupplier" class="mt-2 p-3 bg-muted rounded-md border border-border">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ selectedSupplier.name || selectedSupplier.fullname }}</div>
                    <div class="text-sm text-muted-foreground">{{ selectedSupplier.doc_type }} {{ selectedSupplier.doc_number }}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="clearSupplierSelection"
                    class="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Marca</label>
              <Input
                v-model="vehicleForm.brand"
                placeholder="Toyota, Volvo, etc."
              />
            </div>

            <div>
              <label class="text-sm font-medium">Modelo</label>
              <Input
                v-model="vehicleForm.model"
                placeholder="Hilux, FH16, etc."
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Año</label>
              <Input
                v-model="vehicleForm.year"
                type="number"
                min="1990"
                :max="new Date().getFullYear() + 1"
                placeholder="2020"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Capacidad (kg)</label>
              <Input
                v-model="vehicleForm.capacity_kg"
                type="number"
                min="0"
                step="0.01"
                placeholder="1000.00"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" @click="showVehicleDialog = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="formLoading">
              <Loader2 v-if="formLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ editingVehicle ? 'Actualizar' : 'Crear' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Vehicle Details Dialog -->
    <Dialog :open="showDetailsDialog" @update:open="showDetailsDialog = $event">
      <DialogContent class="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Detalles del Vehículo</DialogTitle>
        </DialogHeader>

        <div v-if="selectedVehicle" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="font-semibold text-lg">Información Básica</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Placa:</span>
                  <span class="font-medium">{{ selectedVehicle.plate }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Marca:</span>
                  <span>{{ selectedVehicle.brand || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Modelo:</span>
                  <span>{{ selectedVehicle.model || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Año:</span>
                  <span>{{ selectedVehicle.year || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tipo:</span>
                  <Badge :variant="selectedVehicle.own ? 'default' : 'secondary'">
                    {{ selectedVehicle.own ? 'Propio' : 'Tercero' }}
                  </Badge>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Capacidad:</span>
                  <span>{{ selectedVehicle.capacity_kg ? `${formatNumber(selectedVehicle.capacity_kg)} kg` : 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="font-semibold text-lg">Estado Actual</h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Estado:</span>
                  <div class="flex items-center gap-2">
                    <div
                      :class="getStatusColor(selectedVehicle.realtime_status?.status)"
                      class="w-3 h-3 rounded-full"
                    ></div>
                    <span>{{ getStatusLabel(selectedVehicle.realtime_status?.status) }}</span>
                  </div>
                </div>
                <div v-if="selectedVehicle.realtime_status?.latitude" class="flex justify-between">
                  <span class="text-muted-foreground">Ubicación:</span>
                  <span class="text-sm">
                    {{ selectedVehicle.realtime_status.latitude.toFixed(6) }},
                    {{ selectedVehicle.realtime_status.longitude.toFixed(6) }}
                  </span>
                </div>
                <div v-if="selectedVehicle.realtime_status?.speed_kph" class="flex justify-between">
                  <span class="text-muted-foreground">Velocidad:</span>
                  <span>{{ selectedVehicle.realtime_status.speed_kph }} km/h</span>
                </div>
                <div v-if="selectedVehicle.realtime_status?.updated_at" class="flex justify-between">
                  <span class="text-muted-foreground">Última actualización:</span>
                  <span class="text-sm">{{ formatDate(selectedVehicle.realtime_status.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Position History -->
          <div v-if="vehiclePositionLogs.length > 0">
            <h3 class="font-semibold text-lg mb-4">Historial Reciente</h3>
            <div class="max-h-60 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="text-left p-2">Fecha/Hora</th>
                    <th class="text-left p-2">Ubicación</th>
                    <th class="text-left p-2">Velocidad</th>
                    <th class="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in vehiclePositionLogs.slice(0, 10)" :key="log.id" class="border-b">
                    <td class="p-2">{{ formatDate(log.reported_at) }}</td>
                    <td class="p-2">{{ log.latitude.toFixed(6) }}, {{ log.longitude.toFixed(6) }}</td>
                    <td class="p-2">{{ log.speed_kph || 0 }} km/h</td>
                    <td class="p-2">
                      <div class="flex items-center gap-2">
                        <div :class="getStatusColor(log.status)" class="w-2 h-2 rounded-full"></div>
                        {{ getStatusLabel(log.status) }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Vehicle Driver Assignment Dialog -->
    <VehicleDriverAssignmentDialog
      :open="showDriverAssignmentDialog"
      :vehicle="vehicleToManage"
      @update:open="showDriverAssignmentDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useVehicles, type Vehicle, type CreateVehicleData, type UpdateVehicleData } from '@/composables/useVehicles'
import {
  Plus,
  Search,
  Truck,
  Car,
  Users,
  MapPin,
  Radio,
  RefreshCw,
  Loader2,
  Eye,
  Edit,
  Trash2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import VehicleDriverAssignmentDialog from '@/components/vehicles/VehicleDriverAssignmentDialog.vue'

// Stores and composables
const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const {
  vehicles,
  vehiclePositionLogs,
  ownVehicles,
  thirdPartyVehicles,
  vehiclesWithStatus,
  loading,
  error,
  fetchVehicles,
  fetchVehicleStatuses,
  fetchVehiclePositionLogs,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  validatePlate
} = useVehicles()

// State
const searchQuery = ref('')
const filterOwnership = ref('')
const filterStatus = ref('')
const showVehicleDialog = ref(false)
const showDetailsDialog = ref(false)
const editingVehicle = ref<Vehicle | null>(null)
const selectedVehicle = ref<Vehicle | null>(null)
const formLoading = ref(false)
const realtimeEnabled = ref(false)
const realtimeInterval = ref<NodeJS.Timeout | null>(null)

// Suppliers for third-party vehicles
const suppliers = computed(() => salesStore.activeSuppliers || [])

// Supplier search functionality
const supplierSearchQuery = ref('')
const showSupplierDropdown = ref(false)
const filteredSuppliers = ref<any[]>([])
const selectedSupplier = ref<any>(null)

// Vehicle form
const vehicleForm = ref<CreateVehicleData>({
  plate: '',
  provider_party_id: null,
  brand: null,
  model: null,
  year: null,
  own: true,
  capacity_kg: null
})

// Filtered vehicles
const filteredVehicles = computed(() => {
  let filtered = [...vehicles.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(vehicle =>
      vehicle.plate.toLowerCase().includes(query) ||
      vehicle.brand?.toLowerCase().includes(query) ||
      vehicle.model?.toLowerCase().includes(query) ||
      vehicle.provider_name?.toLowerCase().includes(query)
    )
  }

  // Ownership filter
  if (filterOwnership.value === 'own') {
    filtered = filtered.filter(vehicle => vehicle.own)
  } else if (filterOwnership.value === 'third_party') {
    filtered = filtered.filter(vehicle => !vehicle.own)
  }

  // Status filter
  if (filterStatus.value) {
    filtered = filtered.filter(vehicle => {
      const status = vehiclesWithStatus.value.find(v => v.id === vehicle.id)?.realtime_status?.status
      return status === filterStatus.value
    })
  }

  return filtered
})

// Methods
const refreshData = async () => {
  if (!companiesStore.currentCompany) return

  await Promise.all([
    fetchVehicles(companiesStore.currentCompany.id),
    fetchVehicleStatuses(companiesStore.currentCompany.id),
    salesStore.fetchSuppliers(companiesStore.currentCompany.id)
  ])
}

const openCreateDialog = () => {
  editingVehicle.value = null
  vehicleForm.value = {
    plate: '',
    provider_party_id: null,
    brand: null,
    model: null,
    year: null,
    own: true,
    capacity_kg: null
  }
  // Reset supplier selection
  supplierSearchQuery.value = ''
  selectedSupplier.value = null
  showSupplierDropdown.value = false
  filteredSuppliers.value = []
  showVehicleDialog.value = true
}

const editVehicle = (vehicle: Vehicle) => {
  editingVehicle.value = vehicle
  vehicleForm.value = {
    plate: vehicle.plate,
    provider_party_id: vehicle.provider_party_id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    own: vehicle.own,
    capacity_kg: vehicle.capacity_kg
  }
  // Set selected supplier if editing third-party vehicle
  if (!vehicle.own && vehicle.provider_party_id) {
    const supplier = suppliers.value.find(s => s.id === vehicle.provider_party_id)
    if (supplier) {
      selectedSupplier.value = supplier
      supplierSearchQuery.value = `${supplier.name || supplier.fullname} - ${supplier.doc_number}`
    }
  } else {
    selectedSupplier.value = null
    supplierSearchQuery.value = ''
  }
  showSupplierDropdown.value = false
  showVehicleDialog.value = true
}

const saveVehicle = async () => {
  if (!companiesStore.currentCompany) return

  try {
    formLoading.value = true

    if (editingVehicle.value) {
      await updateVehicle({
        id: editingVehicle.value.id,
        ...vehicleForm.value
      } as UpdateVehicleData)
    } else {
      await createVehicle(companiesStore.currentCompany.id, vehicleForm.value)
    }

    showVehicleDialog.value = false
  } catch (err) {
    console.error('Error saving vehicle:', err)
  } finally {
    formLoading.value = false
  }
}

const viewVehicleDetails = async (vehicle: Vehicle) => {
  selectedVehicle.value = vehicle
  
  // Fetch position logs for this vehicle
  if (vehicle.id) {
    await fetchVehiclePositionLogs(vehicle.id, 50)
  }
  
  showDetailsDialog.value = true
}

const confirmDelete = (vehicle: Vehicle) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el vehículo ${vehicle.plate}?`)) {
    deleteVehicle(vehicle.id)
  }
}

const showDriverAssignmentDialog = ref(false)
const vehicleToManage = ref<Vehicle | null>(null)

const openManageDriversDialog = (vehicle: Vehicle) => {
  vehicleToManage.value = vehicle
  showDriverAssignmentDialog.value = true
}

const toggleRealtimeTracking = () => {
  if (realtimeEnabled.value) {
    // Disable realtime tracking
    if (realtimeInterval.value) {
      clearInterval(realtimeInterval.value)
      realtimeInterval.value = null
    }
    realtimeEnabled.value = false
  } else {
    // Enable realtime tracking
    realtimeEnabled.value = true
    if (companiesStore.currentCompany) {
      realtimeInterval.value = setInterval(() => {
        fetchVehicleStatuses(companiesStore.currentCompany!.id)
      }, 30000) // Update every 30 seconds
    }
  }
}

// Supplier search functions
const filterSuppliers = () => {
  if (!supplierSearchQuery.value || supplierSearchQuery.value.length < 2) {
    filteredSuppliers.value = []
    return
  }

  const query = supplierSearchQuery.value.toLowerCase()
  filteredSuppliers.value = suppliers.value.filter(supplier =>
    (supplier.name || supplier.fullname || '').toLowerCase().includes(query) ||
    (supplier.doc_number || '').toLowerCase().includes(query) ||
    (supplier.razon_social || '').toLowerCase().includes(query)
  )
}

const selectSupplier = (supplier: any) => {
  selectedSupplier.value = supplier
  vehicleForm.value.provider_party_id = supplier.id
  supplierSearchQuery.value = `${supplier.name || supplier.fullname} - ${supplier.doc_number}`
  showSupplierDropdown.value = false
  filteredSuppliers.value = []
}

const clearSupplierSelection = () => {
  selectedSupplier.value = null
  vehicleForm.value.provider_party_id = null
  supplierSearchQuery.value = ''
  showSupplierDropdown.value = false
  filteredSuppliers.value = []
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showSupplierDropdown.value = false
  }
}

// Helper functions
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'idle':
      return 'bg-yellow-500'
    case 'stopped':
      return 'bg-red-500'
    case 'maintenance':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'idle':
      return 'Inactivo'
    case 'stopped':
      return 'Detenido'
    case 'maintenance':
      return 'Mantenimiento'
    default:
      return 'Sin datos'
  }
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-PE').format(value)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString))
}

// Lifecycle
onMounted(async () => {
  await refreshData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (realtimeInterval.value) {
    clearInterval(realtimeInterval.value)
  }
  document.removeEventListener('click', handleClickOutside)
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in VehiclesView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshData()

      // Restart realtime tracking if it was enabled
      if (realtimeEnabled.value) {
        toggleRealtimeTracking() // Disable
        setTimeout(() => {
          toggleRealtimeTracking() // Re-enable with new company
        }, 100)
      }
    }
  }, { deep: true }
)
</script>