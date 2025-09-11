<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">Órdenes de Despacho</h2>
        <p class="text-muted-foreground">
          Consolida documentos de venta para despacho en lotes
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportDispatchOrders">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateDispatchDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Orden de Despacho
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Órdenes</p>
              <p class="text-2xl font-bold">{{ salesStore.activeDispatchOrders.length }}</p>
            </div>
            <Package class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Pendientes</p>
              <p class="text-2xl font-bold text-orange-600">{{ pendingCount }}</p>
            </div>
            <Clock class="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Despachadas</p>
              <p class="text-2xl font-bold text-green-600">{{ dispatchedCount }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-500" />
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

    <!-- Create Dispatch Order Dialog -->
    <Dialog v-model:open="showCreateDispatchDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Despacho</DialogTitle>
        </DialogHeader>
        <div class="text-center py-8">
          <Package class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Formulario de Orden de Despacho</h3>
          <p class="text-muted-foreground mb-4">Este formulario está en desarrollo</p>
          <div class="flex justify-center gap-3">
            <Button type="button" variant="outline" @click="showCreateDispatchDialog = false">
              Cancelar
            </Button>
            <Button type="button">
              Crear Orden (Demo)
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
  Package,
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
const showCreateDispatchDialog = ref(false)

// Computed
const pendingCount = computed(() => {
  return salesStore.activeDispatchOrders.filter(d => d.status === 'PENDING' || d.status === 'ASSIGNED').length
})

const dispatchedCount = computed(() => {
  return salesStore.activeDispatchOrders.filter(d => d.status === 'DISPATCHED' || d.status === 'COMPLETED').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return salesStore.activeDispatchOrders.filter(order => {
    const orderDate = new Date(order.planned_date)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  }).length
})

// Methods
const exportDispatchOrders = () => {
  console.log('Export dispatch orders')
}

// Lifecycle
onMounted(async () => {
  if (companyStore.selectedCompany) {
    await salesStore.fetchDispatchOrders(companyStore.selectedCompany.id)
  }
})

// Watchers
watch(
  () => companyStore.selectedCompany,
  async (newCompany) => {
    if (newCompany) {
      await salesStore.fetchDispatchOrders(newCompany.id)
    }
  }
)
</script>