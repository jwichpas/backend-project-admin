<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">Envíos</h2>
        <p class="text-muted-foreground">
          Gestiona los envíos y despachos de productos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportShipments">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateShipmentDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Envío
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Envíos</p>
              <p class="text-2xl font-bold">{{ salesStore.activeShipments.length }}</p>
            </div>
            <Truck class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Completos</p>
              <p class="text-2xl font-bold text-green-600">{{ completeCount }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Parciales</p>
              <p class="text-2xl font-bold text-orange-600">{{ partialCount }}</p>
            </div>
            <Clock class="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Este Mes</p>
              <p class="text-2xl font-bold">{{ currentMonthCount }}</p>
            </div>
            <Calendar class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Shipments Table -->
    <Card>
      <CardContent class="p-0">
        <div class="p-6 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Lista de Envíos</h3>
            <div class="flex items-center gap-2">
              <select 
                v-model="statusFilter" 
                class="px-3 py-1 text-sm border border-border rounded-md"
              >
                <option value="">Todos los estados</option>
                <option value="PARTIAL">Parcial</option>
                <option value="COMPLETE">Completo</option>
                <option value="RETURNED">Devuelto</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Envío
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Almacén
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Documento/Orden
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha de Envío
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conductor
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-if="filteredShipments.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-muted-foreground">
                  <div class="flex flex-col items-center gap-2">
                    <Truck class="h-8 w-8 text-muted-foreground" />
                    <span>No hay envíos</span>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="shipment in filteredShipments" 
                :key="shipment.id"
                class="hover:bg-muted/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="font-medium text-sm">
                    #{{ shipment.id.slice(-8).toUpperCase() }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ formatDate(shipment.created_at) }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">{{ shipment.warehouse_name || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3">
                  <div v-if="shipment.sales_doc_number" class="text-sm">
                    <div class="font-medium">{{ shipment.sales_doc_number }}</div>
                    <div class="text-xs text-muted-foreground">Documento</div>
                  </div>
                  <div v-else-if="shipment.sales_order_number" class="text-sm">
                    <div class="font-medium">{{ shipment.sales_order_number }}</div>
                    <div class="text-xs text-muted-foreground">Orden</div>
                  </div>
                  <div v-else class="text-sm text-muted-foreground">Directo</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">{{ formatDate(shipment.shipment_date) }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">
                    {{ shipment.vehicle_plate || 'Sin asignar' }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm">
                    {{ shipment.driver_name || 'Sin asignar' }}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge :variant="getShipmentStatusVariant(shipment.status)">
                    {{ getShipmentStatusLabel(shipment.status) }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="viewShipment(shipment)">
                      Ver
                    </Button>
                    <Button 
                      v-if="shipment.status === 'PARTIAL'" 
                      size="sm"
                      @click="completeShipment(shipment)"
                    >
                      Completar
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- View Shipment Dialog -->
    <Dialog v-model:open="showViewShipmentDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle v-if="selectedShipment">
            Envío #{{ selectedShipment.id.slice(-8).toUpperCase() }}
          </DialogTitle>
        </DialogHeader>
        <div v-if="selectedShipment" class="space-y-6">
          <!-- Shipment Information -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Estado</label>
              <Badge :variant="getShipmentStatusVariant(selectedShipment.status)" class="mt-1">
                {{ getShipmentStatusLabel(selectedShipment.status) }}
              </Badge>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Fecha de Envío</label>
              <p class="text-sm">{{ formatDate(selectedShipment.shipment_date) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Almacén</label>
              <p class="text-sm">{{ selectedShipment.warehouse_name || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
              <p class="text-sm">{{ formatDate(selectedShipment.created_at) }}</p>
            </div>
          </div>

          <!-- Document/Order Information -->
          <div class="grid grid-cols-2 gap-4">
            <div v-if="selectedShipment.sales_doc_number">
              <label class="text-sm font-medium text-muted-foreground">Documento de Venta</label>
              <p class="text-sm font-medium">{{ selectedShipment.sales_doc_number }}</p>
            </div>
            <div v-if="selectedShipment.sales_order_number">
              <label class="text-sm font-medium text-muted-foreground">Orden de Venta</label>
              <p class="text-sm font-medium">{{ selectedShipment.sales_order_number }}</p>
            </div>
          </div>

          <!-- Vehicle and Driver Information -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Vehículo</label>
              <p class="text-sm">{{ selectedShipment.vehicle_plate || 'Sin asignar' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Conductor</label>
              <p class="text-sm">{{ selectedShipment.driver_name || 'Sin asignar' }}</p>
            </div>
          </div>

          <!-- Shipment Items -->
          <div>
            <h4 class="text-lg font-semibold mb-4">Productos del Envío</h4>
            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Producto</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cantidad</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-if="!selectedShipment.items || selectedShipment.items.length === 0">
                    <td colspan="3" class="px-4 py-8 text-center text-muted-foreground">
                      <div class="flex flex-col items-center gap-2">
                        <Clock class="h-6 w-6" />
                        <span>Cargando productos...</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="item in selectedShipment.items" :key="item.id" class="hover:bg-muted/50">
                    <td class="px-4 py-3">
                      <div class="font-medium">{{ item.product_name || 'Producto sin nombre' }}</div>
                      <div class="text-xs text-muted-foreground">SKU: {{ item.product_sku || 'N/A' }}</div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm">{{ item.quantity_shipped || 0 }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <Badge variant="outline">Enviado</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" @click="showViewShipmentDialog = false">
              Cerrar
            </Button>
            <Button
              v-if="selectedShipment.status === 'PARTIAL'"
              @click="completeShipmentFromDialog"
            >
              Marcar como Completo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Create Shipment Dialog -->
    <Dialog v-model:open="showCreateShipmentDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo Envío</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createNewShipment" class="space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Fecha de Envío *
              </label>
              <input
                v-model="newShipmentForm.shipment_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Almacén
              </label>
              <input
                v-model="newShipmentForm.warehouse_name"
                type="text"
                placeholder="Nombre del almacén"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <!-- Document/Order Selection -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Número de Documento
              </label>
              <input
                v-model="newShipmentForm.sales_doc_number"
                type="text"
                placeholder="Ej: F001-00001234"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Número de Orden
              </label>
              <input
                v-model="newShipmentForm.sales_order_number"
                type="text"
                placeholder="Ej: ORD-2024-001"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <!-- Vehicle and Driver -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Placa del Vehículo
              </label>
              <input
                v-model="newShipmentForm.vehicle_plate"
                type="text"
                placeholder="Ej: ABC-123"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                Nombre del Conductor
              </label>
              <input
                v-model="newShipmentForm.driver_name"
                type="text"
                placeholder="Nombre completo del conductor"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Estado Inicial
            </label>
            <select
              v-model="newShipmentForm.status"
              class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PARTIAL">Parcial</option>
              <option value="COMPLETE">Completo</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" @click="cancelCreateShipment">
              Cancelar
            </Button>
            <Button type="submit" :disabled="creatingShipment">
              {{ creatingShipment ? 'Creando...' : 'Crear Envío' }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import { useProductLocationTracking } from '@/composables/useProductLocationTracking'
import {
  Download,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()
const locationTracking = useProductLocationTracking()

// State
const showCreateShipmentDialog = ref(false)
const showViewShipmentDialog = ref(false)
const selectedShipment = ref(null)
const statusFilter = ref('')
const creatingShipment = ref(false)

// New shipment form
const newShipmentForm = ref({
  shipment_date: new Date().toISOString().split('T')[0], // Today's date
  warehouse_name: '',
  sales_doc_number: '',
  sales_order_number: '',
  vehicle_plate: '',
  driver_name: '',
  status: 'PARTIAL' as 'PARTIAL' | 'COMPLETE'
})

// Computed
const completeCount = computed(() => {
  return salesStore.activeShipments.filter(s => s.status === 'COMPLETE').length
})

const partialCount = computed(() => {
  return salesStore.activeShipments.filter(s => s.status === 'PARTIAL').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return salesStore.activeShipments.filter(shipment => {
    const shipmentDate = new Date(shipment.shipment_date)
    return shipmentDate.getMonth() === currentMonth && shipmentDate.getFullYear() === currentYear
  }).length
})

const filteredShipments = computed(() => {
  if (!statusFilter.value) {
    return salesStore.activeShipments
  }
  return salesStore.activeShipments.filter(shipment => shipment.status === statusFilter.value)
})

// Methods
const exportShipments = () => {
  try {
    // Prepare data for export
    const exportData = filteredShipments.value.map(shipment => ({
      'ID Envío': shipment.id.slice(-8).toUpperCase(),
      'Fecha Envío': formatDate(shipment.shipment_date),
      'Almacén': shipment.warehouse_name || 'N/A',
      'Documento': shipment.sales_doc_number || shipment.sales_order_number || 'Directo',
      'Vehículo': shipment.vehicle_plate || 'Sin asignar',
      'Conductor': shipment.driver_name || 'Sin asignar',
      'Estado': getShipmentStatusLabel(shipment.status),
      'Fecha Creación': formatDate(shipment.created_at)
    }))

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {})
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `envios_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    alert('¡Exportación completada exitosamente!')
  } catch (error) {
    console.error('Error exporting shipments:', error)
    alert('Error al exportar los envíos. Por favor, intente nuevamente.')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getShipmentStatusLabel = (status: string) => {
  const labels = {
    'PARTIAL': 'Parcial',
    'COMPLETE': 'Completo',
    'RETURNED': 'Devuelto'
  }
  return labels[status as keyof typeof labels] || status
}

const getShipmentStatusVariant = (status: string) => {
  const variants = {
    'PARTIAL': 'outline',
    'COMPLETE': 'default',
    'RETURNED': 'destructive'
  }
  return variants[status as keyof typeof variants] || 'secondary'
}

const viewShipment = async (shipment: any) => {
  selectedShipment.value = shipment

  // Cargar los items del envío
  try {
    await salesStore.fetchShipmentItems(shipment.id)
    // Asignar los items cargados al shipment seleccionado
    selectedShipment.value = {
      ...shipment,
      items: salesStore.shipmentItems
    }
  } catch (error) {
    console.error('Error loading shipment items:', error)
  }

  showViewShipmentDialog.value = true
}

const completeShipment = async (shipment: any) => {
  if (!confirm(`¿Está seguro de que desea marcar el envío #${shipment.id.slice(-8).toUpperCase()} como completo?`)) {
    return
  }

  try {
    // Update shipment status
    await salesStore.updateShipment(shipment.id, {
      status: 'COMPLETE'
    })

    // Record location movements for shipped products
    if (shipment.shipment_details && shipment.shipment_details.length > 0) {
      const userId = companiesStore.currentUser?.id

      for (const detail of shipment.shipment_details) {
        try {
          await locationTracking.moveProduct({
            product_id: detail.product_id,
            to_warehouse_zone_id: '', // External location for shipments
            quantity: detail.quantity_shipped,
            movement_type: 'SHIPMENT',
            reference_id: shipment.id,
            reference_type: 'shipment',
            notes: `Envío completado - ${shipment.delivery_address || 'Dirección no especificada'}`
          }, userId)
        } catch (locationError) {
          console.warn(`Warning: Could not record location movement for product ${detail.product_id}:`, locationError)
          // Continue with other products even if one fails
        }
      }
    }

    // Actualizar los datos locales
    const shipmentIndex = salesStore.shipments.findIndex(s => s.id === shipment.id)
    if (shipmentIndex !== -1) {
      salesStore.shipments[shipmentIndex].status = 'COMPLETE'
    }

    alert('¡Envío marcado como completo exitosamente!')

  } catch (error) {
    console.error('Error completing shipment:', error)
    alert('Error al completar el envío. Por favor, intente nuevamente.')
  }
}

const completeShipmentFromDialog = async () => {
  if (!selectedShipment.value) return

  await completeShipment(selectedShipment.value)

  // Actualizar el selectedShipment si fue completado exitosamente
  if (selectedShipment.value) {
    selectedShipment.value.status = 'COMPLETE'
  }

  // Cerrar el diálogo después de completar
  showViewShipmentDialog.value = false
}

const createNewShipment = async () => {
  if (!companiesStore.currentCompany) {
    alert('No hay empresa seleccionada')
    return
  }

  creatingShipment.value = true

  try {
    // Prepare shipment data
    const shipmentData = {
      company_id: companiesStore.currentCompany.id,
      shipment_date: newShipmentForm.value.shipment_date,
      warehouse_name: newShipmentForm.value.warehouse_name || null,
      sales_doc_number: newShipmentForm.value.sales_doc_number || null,
      sales_order_number: newShipmentForm.value.sales_order_number || null,
      vehicle_plate: newShipmentForm.value.vehicle_plate || null,
      driver_name: newShipmentForm.value.driver_name || null,
      status: newShipmentForm.value.status
    }

    // Create the shipment
    await salesStore.createShipment(shipmentData)

    // Reset form and close dialog
    resetNewShipmentForm()
    showCreateShipmentDialog.value = false

    // Refresh shipments list
    await salesStore.fetchShipments(companiesStore.currentCompany.id)

    alert('¡Envío creado exitosamente!')

  } catch (error) {
    console.error('Error creating shipment:', error)
    alert('Error al crear el envío. Por favor, intente nuevamente.')
  } finally {
    creatingShipment.value = false
  }
}

const cancelCreateShipment = () => {
  resetNewShipmentForm()
  showCreateShipmentDialog.value = false
}

const resetNewShipmentForm = () => {
  newShipmentForm.value = {
    shipment_date: new Date().toISOString().split('T')[0],
    warehouse_name: '',
    sales_doc_number: '',
    sales_order_number: '',
    vehicle_plate: '',
    driver_name: '',
    status: 'PARTIAL'
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize companies if not already loaded
  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0) {
    try {
      const userId = localStorage.getItem('userId')
      if (userId) {
        await companiesStore.fetchUserCompanies(userId)
      }
    } catch (error) {
      console.error('Error fetching user companies:', error)
    }
  }
  
  if (companiesStore.currentCompany) {
    await salesStore.fetchShipments(companiesStore.currentCompany.id)
  }
})

// Watchers
watch(
  () => companiesStore.currentCompany,
  async (newCompany) => {
    if (newCompany) {
      await salesStore.fetchShipments(newCompany.id)
    }
  }
)
</script>