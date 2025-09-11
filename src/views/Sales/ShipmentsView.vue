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
import { useCompanyStore } from '@/stores/company'
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
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

const companyStore = useCompanyStore()
const salesStore = useSalesStore()

// State
const showCreateShipmentDialog = ref(false)

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

// Methods
const exportShipments = () => {
  console.log('Export shipments')
}

// Lifecycle
onMounted(async () => {
  if (companyStore.selectedCompany) {
    await salesStore.fetchShipments(companyStore.selectedCompany.id)
  }
})

// Watchers
watch(
  () => companyStore.selectedCompany,
  async (newCompany) => {
    if (newCompany) {
      await salesStore.fetchShipments(newCompany.id)
    }
  }
)
</script>