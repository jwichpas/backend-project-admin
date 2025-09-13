<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>
          Gestionar Conductores - {{ vehicle?.plate }}
        </DialogTitle>
      </DialogHeader>

      <div v-if="vehicle" class="space-y-6">
        <!-- Current Assignments -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Conductores Asignados</h3>
          
          <div v-if="currentAssignments.length === 0" class="text-center py-8 border border-dashed border-border rounded-lg">
            <Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No hay conductores asignados a este vehículo</p>
            <Button @click="showAssignDialog = true" class="mt-4">
              <Plus class="mr-2 h-4 w-4" />
              Asignar Conductor
            </Button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="assignment in currentAssignments"
              :key="assignment.id"
              class="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <UserCheck class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="font-medium">{{ assignment.driver_name }}</p>
                  <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Licencia: {{ assignment.driver_license }}</span>
                    <Badge :variant="assignment.is_primary ? 'default' : 'secondary'" class="text-xs">
                      {{ assignment.is_primary ? 'Principal' : 'Secundario' }}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    Asignado: {{ formatDate(assignment.assignment_date) }}
                  </p>
                  <p v-if="assignment.observations" class="text-xs text-muted-foreground">
                    Observaciones: {{ assignment.observations }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="editAssignment(assignment)"
                  title="Editar asignación"
                >
                  <Edit class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="confirmRemoveAssignment(assignment)"
                  title="Remover asignación"
                  class="text-red-600 hover:text-red-700"
                >
                  <UserMinus class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button @click="showAssignDialog = true" variant="outline" class="w-full">
              <Plus class="mr-2 h-4 w-4" />
              Asignar Otro Conductor
            </Button>
          </div>
        </div>

        <!-- Assignment Form Dialog -->
        <Dialog :open="showAssignDialog" @update:open="showAssignDialog = $event">
          <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {{ editingAssignment ? 'Editar Asignación' : 'Asignar Conductor' }}
              </DialogTitle>
            </DialogHeader>

            <form @submit.prevent="saveAssignment" class="space-y-4">
              <div>
                <label class="text-sm font-medium">Conductor *</label>
                <select
                  v-model="assignmentForm.driver_id"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                  :disabled="!!editingAssignment"
                >
                  <option value="">Seleccionar conductor</option>
                  <option
                    v-for="driver in availableDrivers"
                    :key="driver.id"
                    :value="driver.id"
                  >
                    {{ driver.nombre_completo || driver.party?.fullname }} - {{ driver.license_number }}
                  </option>
                </select>
              </div>

              <div>
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="assignmentForm.is_primary"
                    class="rounded border-input"
                  />
                  <span class="text-sm font-medium">Conductor Principal</span>
                </label>
                <p class="text-xs text-muted-foreground mt-1">
                  Solo puede haber un conductor principal por vehículo
                </p>
              </div>

              <div>
                <label class="text-sm font-medium">Observaciones</label>
                <textarea
                  v-model="assignmentForm.observations"
                  placeholder="Notas adicionales sobre esta asignación..."
                  rows="3"
                  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                ></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" @click="cancelAssignment">
                  Cancelar
                </Button>
                <Button type="submit" :disabled="assignmentLoading">
                  <Loader2 v-if="assignmentLoading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ editingAssignment ? 'Actualizar' : 'Asignar' }}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <!-- Available Drivers Info -->
        <div class="border-t border-border pt-4">
          <h4 class="font-semibold mb-3">Conductores Disponibles</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
            <div
              v-for="driver in availableDrivers"
              :key="driver.id"
              class="flex items-center gap-2 p-2 border border-border rounded text-sm"
            >
              <UserCheck class="h-4 w-4 text-muted-foreground" />
              <div>
                <p class="font-medium">{{ driver.nombre_completo || driver.party?.fullname }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ driver.license_number }} - {{ driver.license_class }}
                </p>
              </div>
            </div>
            
            <div v-if="availableDrivers.length === 0" class="col-span-2 text-center py-4 text-muted-foreground text-sm">
              No hay conductores disponibles para asignar
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <Button @click="$emit('update:open', false)">
          Cerrar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useVehicles, type Vehicle, type VehicleDriver } from '@/composables/useVehicles'
import { useDrivers, type Driver } from '@/composables/useDrivers'
import {
  Plus,
  Users,
  UserCheck,
  UserMinus,
  Edit,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

// Props & Emits
interface Props {
  open: boolean
  vehicle: Vehicle | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Stores and composables
const companiesStore = useCompaniesStore()
const {
  vehicleDrivers,
  assignDriverToVehicle,
  removeDriverFromVehicle,
  fetchVehicleDrivers
} = useVehicles()

const {
  drivers,
  fetchDrivers,
  getAvailableDrivers
} = useDrivers()

// State
const showAssignDialog = ref(false)
const editingAssignment = ref<VehicleDriver | null>(null)
const assignmentLoading = ref(false)
const availableDrivers = ref<Driver[]>([])

// Assignment form
const assignmentForm = ref({
  driver_id: '',
  is_primary: false,
  observations: ''
})

// Computed
const currentAssignments = computed(() => {
  if (!props.vehicle) return []
  return vehicleDrivers.value.filter(vd => vd.vehicle_id === props.vehicle!.id)
})

// Methods
const loadAvailableDrivers = async () => {
  if (!companiesStore.currentCompany || !props.vehicle) return
  
  try {
    const drivers = await getAvailableDrivers(companiesStore.currentCompany.id, props.vehicle.id)
    availableDrivers.value = drivers
  } catch (error) {
    console.error('Error loading available drivers:', error)
    availableDrivers.value = []
  }
}

const loadVehicleDrivers = async () => {
  if (!companiesStore.currentCompany) return
  
  try {
    await fetchVehicleDrivers(companiesStore.currentCompany.id)
  } catch (error) {
    console.error('Error loading vehicle drivers:', error)
  }
}

const editAssignment = (assignment: VehicleDriver) => {
  editingAssignment.value = assignment
  assignmentForm.value = {
    driver_id: assignment.driver_id,
    is_primary: assignment.is_primary,
    observations: assignment.observations || ''
  }
  showAssignDialog.value = true
}

const saveAssignment = async () => {
  if (!props.vehicle || !assignmentForm.value.driver_id) return

  try {
    assignmentLoading.value = true

    if (editingAssignment.value) {
      // For editing, we need to remove the old assignment and create a new one
      // This is a limitation of the current data structure
      await removeDriverFromVehicle(props.vehicle.id, editingAssignment.value.driver_id)
    }

    await assignDriverToVehicle(
      props.vehicle.id,
      assignmentForm.value.driver_id,
      assignmentForm.value.is_primary,
      assignmentForm.value.observations
    )

    // Reload data
    await loadVehicleDrivers()
    await loadAvailableDrivers()

    // Close dialog
    cancelAssignment()
  } catch (error) {
    console.error('Error saving assignment:', error)
  } finally {
    assignmentLoading.value = false
  }
}

const cancelAssignment = () => {
  editingAssignment.value = null
  assignmentForm.value = {
    driver_id: '',
    is_primary: false,
    observations: ''
  }
  showAssignDialog.value = false
}

const confirmRemoveAssignment = async (assignment: VehicleDriver) => {
  if (!props.vehicle) return

  const driverName = assignment.driver_name || 'el conductor'
  if (confirm(`¿Estás seguro de que deseas desasignar a ${driverName} de este vehículo?`)) {
    try {
      await removeDriverFromVehicle(props.vehicle.id, assignment.driver_id)
      
      // Reload data
      await loadVehicleDrivers()
      await loadAvailableDrivers()
    } catch (error) {
      console.error('Error removing assignment:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(dateString))
}

// Watch for dialog open/close
watch(() => props.open, async (isOpen) => {
  if (isOpen && props.vehicle && companiesStore.currentCompany) {
    await Promise.all([
      loadVehicleDrivers(),
      loadAvailableDrivers(),
      fetchDrivers(companiesStore.currentCompany.id)
    ])
  }
})
</script>