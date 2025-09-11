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

    <!-- Create Shipment Dialog -->
    <Dialog v-model:open="showCreateShipmentDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo Envío</DialogTitle>
        </DialogHeader>
        <div class="text-center py-8">
          <Truck class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Formulario de Envío</h3>
          <p class="text-muted-foreground mb-4">Este formulario está en desarrollo</p>
          <div class="flex justify-center gap-3">
            <Button type="button" variant="outline" @click="showCreateShipmentDialog = false">
              Cancelar
            </Button>
            <Button type="button">
              Crear Envío (Demo)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
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

// State
const showCreateShipmentDialog = ref(false)
const statusFilter = ref('')

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
  console.log('Export shipments')
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

const viewShipment = (shipment: any) => {
  console.log('View shipment:', shipment)
  // TODO: Implement shipment view dialog
}

const completeShipment = async (shipment: any) => {
  try {
    // Update shipment status to COMPLETE
    await salesStore.updateShipment(shipment.id, {
      status: 'COMPLETE'
    })

    // Update the local data
    const shipmentIndex = salesStore.shipments.findIndex(s => s.id === shipment.id)
    if (shipmentIndex !== -1) {
      salesStore.shipments[shipmentIndex].status = 'COMPLETE'
    }
    
    console.log('Shipment completed successfully!')
    
  } catch (error) {
    console.error('Error completing shipment:', error)
    // TODO: Show error message
  }
}

// Lifecycle
onMounted(async () => {
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