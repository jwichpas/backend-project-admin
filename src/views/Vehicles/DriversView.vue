<template>
  <div class="container mx-auto p-6 max-w-7xl">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Gestión de Conductores</h1>
        <p class="text-muted-foreground">
          Administra los conductores y sus licencias de conducir
        </p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="mr-2 h-4 w-4" />
        Nuevo Conductor
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total Conductores</p>
            <p class="text-2xl font-bold">{{ getDriverStatistics.total }}</p>
          </div>
          <UserCheck class="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Activos</p>
            <p class="text-2xl font-bold text-green-600">{{ getDriverStatistics.active }}</p>
          </div>
          <CheckCircle class="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Licencias Vencidas</p>
            <p class="text-2xl font-bold text-red-600">{{ getDriverStatistics.expired }}</p>
          </div>
          <AlertTriangle class="h-8 w-8 text-red-500" />
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Por Vencer</p>
            <p class="text-2xl font-bold text-orange-600">{{ getDriverStatistics.expiringSoon }}</p>
          </div>
          <Clock class="h-8 w-8 text-orange-500" />
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
            placeholder="Buscar por nombre, documento o licencia..."
            class="pl-10 w-[350px]"
          />
        </div>

        <select
          v-model="filterLicenseStatus"
          class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los estados</option>
          <option value="active">Licencias válidas</option>
          <option value="expired">Licencias vencidas</option>
          <option value="expiring">Por vencer (30 días)</option>
        </select>

        <select
          v-model="filterLicenseClass"
          class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las clases</option>
          <option value="A-I">A-I</option>
          <option value="A-IIa">A-IIa</option>
          <option value="A-IIb">A-IIb</option>
          <option value="A-IIIa">A-IIIa</option>
          <option value="A-IIIb">A-IIIb</option>
          <option value="A-IIIc">A-IIIc</option>
        </select>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" @click="exportDrivers">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button variant="outline" @click="refreshData">
          <RefreshCw :class="{ 'animate-spin': loading }" class="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Drivers Table -->
    <div class="bg-card border border-border rounded-lg">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold">Lista de Conductores</h3>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Cargando conductores...</p>
      </div>

      <div v-else-if="filteredDrivers.length === 0" class="p-8 text-center">
        <UserCheck class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p class="text-muted-foreground mb-4">No se encontraron conductores</p>
        <Button @click="openCreateDialog">
          <Plus class="mr-2 h-4 w-4" />
          Registrar Primer Conductor
        </Button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="text-left p-4 font-medium">Estado</th>
              <th class="text-left p-4 font-medium">Conductor</th>
              <th class="text-left p-4 font-medium">Documento</th>
              <th class="text-left p-4 font-medium">Licencia</th>
              <th class="text-left p-4 font-medium">Clase</th>
              <th class="text-left p-4 font-medium">Vencimiento</th>
              <th class="text-left p-4 font-medium">Contacto</th>
              <th class="text-left p-4 font-medium">Vehículos</th>
              <th class="text-right p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="driver in filteredDrivers"
              :key="driver.id"
              class="border-b border-border hover:bg-muted/50"
            >
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <div
                    :class="getLicenseStatusColor(driver)"
                    class="w-3 h-3 rounded-full"
                  ></div>
                  <span class="text-sm">
                    {{ getLicenseStatusLabel(driver) }}
                  </span>
                </div>
              </td>

              <td class="p-4">
                <div>
                  <p class="font-medium">{{ driver.nombre_completo || driver.user?.full_name || driver.user?.email || 'N/A' }}</p>
                  <p class="text-sm text-muted-foreground">
                    Registrado: {{ formatDate(driver.created_at) }}
                  </p>
                  <p v-if="driver.current_location" class="text-xs text-green-600 flex items-center gap-1">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    En línea
                  </p>
                  <p v-else-if="driver.device?.tracking_enabled" class="text-xs text-yellow-600">
                    Tracking habilitado
                  </p>
                </div>
              </td>

              <td class="p-4">
                <div v-if="driver.numero_documento">
                  <p class="font-medium">{{ driver.numero_documento }}</p>
                  <p class="text-sm text-muted-foreground">DNI/CE</p>
                </div>
                <span v-else class="text-muted-foreground">N/A</span>
              </td>

              <td class="p-4 font-medium">{{ driver.license_number }}</td>

              <td class="p-4">
                <Badge variant="outline">{{ driver.license_class || 'N/A' }}</Badge>
              </td>

              <td class="p-4">
                <div v-if="driver.valid_until">
                  <p class="font-medium" :class="getExpirationTextColor(driver)">
                    {{ formatDate(driver.valid_until) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ getExpirationText(driver) }}
                  </p>
                </div>
                <span v-else class="text-muted-foreground">No especificado</span>
              </td>

              <td class="p-4">
                <div v-if="driver.user" class="text-sm">
                  <p v-if="driver.user.email" class="flex items-center gap-1">
                    <Mail class="h-3 w-3" />
                    {{ driver.user.email }}
                  </p>
                  <p v-if="driver.user.phone" class="flex items-center gap-1">
                    <Phone class="h-3 w-3" />
                    {{ driver.user.phone }}
                  </p>
                  <p v-if="driver.device" class="flex items-center gap-1 text-xs text-muted-foreground">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {{ driver.device.device_type }}
                  </p>
                </div>
                <span v-else class="text-muted-foreground text-sm">Sin contacto</span>
              </td>

              <td class="p-4">
                <div v-if="driver.assigned_vehicles && driver.assigned_vehicles.length > 0">
                  <div class="flex flex-wrap gap-1">
                    <Badge
                      v-for="vehicle in driver.assigned_vehicles.slice(0, 2)"
                      :key="vehicle.id"
                      :variant="vehicle.is_primary ? 'default' : 'secondary'"
                      class="text-xs"
                    >
                      {{ vehicle.vehicle_plate }}
                    </Badge>
                    <Badge
                      v-if="driver.assigned_vehicles.length > 2"
                      variant="outline"
                      class="text-xs"
                    >
                      +{{ driver.assigned_vehicles.length - 2 }}
                    </Badge>
                  </div>
                </div>
                <span v-else class="text-muted-foreground text-sm">Sin asignar</span>
              </td>

              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="viewDriverDetails(driver)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="editDriver(driver)"
                    title="Editar"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="manageVehicleAssignments(driver)"
                    title="Gestionar vehículos"
                  >
                    <Car class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="confirmDelete(driver)"
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

    <!-- Create/Edit Driver Dialog -->
    <Dialog :open="showDriverDialog" @update:open="showDriverDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {{ editingDriver ? 'Editar Conductor' : 'Nuevo Conductor' }}
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="saveDriver" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Persona *</label>
            <select
              v-model="driverForm.party_id"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Seleccionar persona</option>
              <option
                v-for="person in availablePeople"
                :key="person.id"
                :value="person.id"
              >
                {{ person.fullname }} - {{ person.doc_number }}
              </option>
            </select>
            <p class="text-xs text-muted-foreground mt-1">
              Si no encuentras la persona, primero debes registrarla en el módulo de clientes/proveedores
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Número de Licencia *</label>
              <Input
                v-model="driverForm.license_number"
                placeholder="A12345678"
                required
                :class="{ 'border-red-500': !validateLicenseNumber(driverForm.license_number) && driverForm.license_number }"
              />
              <p v-if="!validateLicenseNumber(driverForm.license_number) && driverForm.license_number" class="text-xs text-red-500 mt-1">
                Formato inválido (ej: A12345678)
              </p>
            </div>

            <div>
              <label class="text-sm font-medium">Clase de Licencia</label>
              <select
                v-model="driverForm.license_class"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccionar clase</option>
                <option value="A-I">A-I - Motocicletas</option>
                <option value="A-IIa">A-IIa - Automóviles</option>
                <option value="A-IIb">A-IIb - Camionetas</option>
                <option value="A-IIIa">A-IIIa - Ómnibus</option>
                <option value="A-IIIb">A-IIIb - Camiones</option>
                <option value="A-IIIc">A-IIIc - Articulados</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Fecha de Vencimiento</label>
              <Input
                v-model="driverForm.valid_until"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>

            <div>
              <label class="text-sm font-medium">Número de Documento (Opcional)</label>
              <Input
                v-model="driverForm.numero_documento"
                placeholder="12345678"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Nombre Completo (Opcional)</label>
            <Input
              v-model="driverForm.nombre_completo"
              placeholder="Se completará automáticamente desde la persona seleccionada"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Este campo se usa para búsquedas rápidas. Se completará automáticamente si no se especifica.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" @click="showDriverDialog = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="formLoading">
              <Loader2 v-if="formLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ editingDriver ? 'Actualizar' : 'Crear' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Driver Details Dialog -->
    <Dialog :open="showDetailsDialog" @update:open="showDetailsDialog = $event">
      <DialogContent class="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Detalles del Conductor</DialogTitle>
        </DialogHeader>

        <div v-if="selectedDriver" class="space-y-6">
          <!-- Personal Info -->
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="font-semibold text-lg">Información Personal</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Nombre:</span>
                  <span class="font-medium">{{ selectedDriver.nombre_completo || selectedDriver.party?.fullname || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Documento:</span>
                  <span>{{ selectedDriver.party?.doc_number || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tipo de Documento:</span>
                  <span>{{ selectedDriver.party?.doc_type || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Email:</span>
                  <span>{{ selectedDriver.party?.email || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Teléfono:</span>
                  <span>{{ selectedDriver.party?.phone || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Dirección:</span>
                  <span>{{ selectedDriver.party?.address || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="font-semibold text-lg">Información de Licencia</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Número:</span>
                  <span class="font-medium">{{ selectedDriver.license_number }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Clase:</span>
                  <Badge variant="outline">{{ selectedDriver.license_class || 'N/A' }}</Badge>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Estado:</span>
                  <div class="flex items-center gap-2">
                    <div
                      :class="getLicenseStatusColor(selectedDriver)"
                      class="w-3 h-3 rounded-full"
                    ></div>
                    <span>{{ getLicenseStatusLabel(selectedDriver) }}</span>
                  </div>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Vencimiento:</span>
                  <span :class="getExpirationTextColor(selectedDriver)">
                    {{ selectedDriver.valid_until ? formatDate(selectedDriver.valid_until) : 'No especificado' }}
                  </span>
                </div>
                <div v-if="selectedDriver.valid_until" class="flex justify-between">
                  <span class="text-muted-foreground">Tiempo restante:</span>
                  <span :class="getExpirationTextColor(selectedDriver)">
                    {{ getExpirationText(selectedDriver) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Assigned Vehicles -->
          <div v-if="selectedDriver.assigned_vehicles && selectedDriver.assigned_vehicles.length > 0">
            <h3 class="font-semibold text-lg mb-4">Vehículos Asignados</h3>
            <div class="space-y-2">
              <div
                v-for="vehicle in selectedDriver.assigned_vehicles"
                :key="vehicle.id"
                class="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <Car class="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p class="font-medium">{{ vehicle.vehicle_plate }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ vehicle.vehicle_brand }} {{ vehicle.vehicle_model }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <Badge :variant="vehicle.is_primary ? 'default' : 'secondary'">
                    {{ vehicle.is_primary ? 'Principal' : 'Secundario' }}
                  </Badge>
                  <p class="text-xs text-muted-foreground mt-1">
                    Desde: {{ formatDate(vehicle.assignment_date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useDrivers, type Driver, type CreateDriverData, type UpdateDriverData } from '@/composables/useDrivers'
import {
  Plus,
  Search,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  Edit,
  Car,
  Trash2,
  Mail,
  Phone
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

// Stores and composables
const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const {
  drivers,
  loading,
  error,
  getDriverStatistics,
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  isLicenseValid,
  getDaysUntilExpiration,
  validateLicenseNumber
} = useDrivers()

// State
const searchQuery = ref('')
const filterLicenseStatus = ref('')
const filterLicenseClass = ref('')
const showDriverDialog = ref(false)
const showDetailsDialog = ref(false)
const editingDriver = ref<Driver | null>(null)
const selectedDriver = ref<Driver | null>(null)
const formLoading = ref(false)

// Available people (from customers/suppliers)
const availablePeople = computed(() =>
  salesStore.activeCustomers?.filter(customer => !customer.is_company) || []
)

// Driver form
const driverForm = ref<CreateDriverData>({
  party_id: '',
  license_number: '',
  license_class: null,
  valid_until: null,
  numero_documento: null,
  nombre_completo: null
})

// Filtered drivers
const filteredDrivers = computed(() => {
  let filtered = [...drivers.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(driver =>
      (driver.nombre_completo || driver.party?.fullname || '').toLowerCase().includes(query) ||
      driver.license_number.toLowerCase().includes(query) ||
      driver.party?.doc_number?.toLowerCase().includes(query) ||
      driver.numero_documento?.toLowerCase().includes(query)
    )
  }

  // License status filter
  if (filterLicenseStatus.value === 'active') {
    filtered = filtered.filter(driver => isLicenseValid(driver))
  } else if (filterLicenseStatus.value === 'expired') {
    filtered = filtered.filter(driver => !isLicenseValid(driver))
  } else if (filterLicenseStatus.value === 'expiring') {
    filtered = filtered.filter(driver => {
      const days = getDaysUntilExpiration(driver)
      return days !== null && days <= 30 && days > 0
    })
  }

  // License class filter
  if (filterLicenseClass.value) {
    filtered = filtered.filter(driver => driver.license_class === filterLicenseClass.value)
  }

  return filtered
})

// Methods
const refreshData = async () => {
  if (!companiesStore.currentCompany) return

  await Promise.all([
    fetchDrivers(companiesStore.currentCompany.id, true), // Include vehicle assignments
    salesStore.fetchCustomers(companiesStore.currentCompany.id)
  ])
}

const openCreateDialog = () => {
  editingDriver.value = null
  driverForm.value = {
    party_id: '',
    license_number: '',
    license_class: null,
    valid_until: null,
    numero_documento: null,
    nombre_completo: null
  }
  showDriverDialog.value = true
}

const editDriver = (driver: Driver) => {
  editingDriver.value = driver
  driverForm.value = {
    party_id: driver.party_id,
    license_number: driver.license_number,
    license_class: driver.license_class,
    valid_until: driver.valid_until,
    numero_documento: driver.numero_documento,
    nombre_completo: driver.nombre_completo
  }
  showDriverDialog.value = true
}

const saveDriver = async () => {
  if (!companiesStore.currentCompany) return

  try {
    formLoading.value = true

    if (editingDriver.value) {
      await updateDriver({
        id: editingDriver.value.id,
        ...driverForm.value
      } as UpdateDriverData)
    } else {
      await createDriver(companiesStore.currentCompany.id, driverForm.value)
    }

    showDriverDialog.value = false
  } catch (err) {
    console.error('Error saving driver:', err)
  } finally {
    formLoading.value = false
  }
}

const viewDriverDetails = (driver: Driver) => {
  selectedDriver.value = driver
  showDetailsDialog.value = true
}

const confirmDelete = (driver: Driver) => {
  if (confirm(`¿Estás seguro de que deseas eliminar al conductor ${driver.nombre_completo || driver.party?.fullname}?`)) {
    deleteDriver(driver.id)
  }
}

const manageVehicleAssignments = (driver: Driver) => {
  // TODO: Implement vehicle assignment management dialog
  console.log('Manage vehicle assignments for driver:', driver.license_number)
}

const exportDrivers = () => {
  // TODO: Implement CSV export functionality
  console.log('Export drivers to CSV')
}

// Helper functions
const getLicenseStatusColor = (driver: Driver) => {
  if (!driver.valid_until) return 'bg-gray-400'

  const days = getDaysUntilExpiration(driver)
  if (days === null) return 'bg-gray-400'
  if (days < 0) return 'bg-red-500'
  if (days <= 30) return 'bg-orange-500'
  return 'bg-green-500'
}

const getLicenseStatusLabel = (driver: Driver) => {
  if (!driver.valid_until) return 'Sin vencimiento'

  const days = getDaysUntilExpiration(driver)
  if (days === null) return 'Sin vencimiento'
  if (days < 0) return 'Vencida'
  if (days <= 30) return 'Por vencer'
  return 'Válida'
}

const getExpirationTextColor = (driver: Driver) => {
  const days = getDaysUntilExpiration(driver)
  if (days === null) return ''
  if (days < 0) return 'text-red-600'
  if (days <= 30) return 'text-orange-600'
  return 'text-green-600'
}

const getExpirationText = (driver: Driver) => {
  const days = getDaysUntilExpiration(driver)
  if (days === null) return ''
  if (days < 0) return `Vencida hace ${Math.abs(days)} días`
  if (days === 0) return 'Vence hoy'
  if (days <= 30) return `Vence en ${days} días`
  return `Válida por ${days} días más`
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(dateString))
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>
