<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Gestión de Ventas</h1>
        <p class="text-muted-foreground">
          Punto de venta, órdenes, documentos, envíos y despachos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportData">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <Card>
      <CardContent class="p-0">
        <nav class="flex space-x-8 border-b border-border" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            ]"
          >
            <component :is="tab.icon" class="mr-2 h-4 w-4 inline" />
            {{ tab.name }}
            <Badge 
              v-if="tab.count !== undefined" 
              :variant="activeTab === tab.id ? 'default' : 'secondary'"
              class="ml-2"
            >
              {{ tab.count }}
            </Badge>
          </button>
        </nav>
      </CardContent>
    </Card>

    <!-- Tab Content -->
    <div class="mt-6">
      <!-- Point of Sale Tab -->
      <div v-if="activeTab === 'pos'" class="space-y-6">
        <PointOfSaleView />
      </div>

      <!-- Sales Orders Tab -->
      <div v-if="activeTab === 'orders'" class="space-y-6">
        <SalesOrdersView />
      </div>

      <!-- Sales Documents Tab -->
      <div v-if="activeTab === 'documents'" class="space-y-6">
        <SalesDocsView />
      </div>

      <!-- Shipments Tab -->
      <div v-if="activeTab === 'shipments'" class="space-y-6">
        <ShipmentsView />
      </div>

      <!-- Dispatch Orders Tab -->
      <div v-if="activeTab === 'dispatch'" class="space-y-6">
        <DispatchOrdersView />
      </div>
    </div>

    <!-- Quick Create Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de documento que deseas crear
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <Button 
            variant="outline" 
            class="h-16 flex flex-col items-center justify-center gap-2"
            @click="openPOS"
          >
            <CreditCard class="h-6 w-6" />
            <span>Punto de Venta</span>
          </Button>
          <Button 
            variant="outline" 
            class="h-16 flex flex-col items-center justify-center gap-2"
            @click="createSalesOrder"
          >
            <ShoppingCart class="h-6 w-6" />
            <span>Orden de Venta</span>
          </Button>
          <Button 
            variant="outline" 
            class="h-16 flex flex-col items-center justify-center gap-2"
            @click="createSalesDoc"
          >
            <FileText class="h-6 w-6" />
            <span>Factura / Boleta</span>
          </Button>
          <Button 
            variant="outline" 
            class="h-16 flex flex-col items-center justify-center gap-2"
            @click="createShipment"
          >
            <Truck class="h-6 w-6" />
            <span>Envío Directo</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useSalesStore } from '@/stores/sales'
import {
  Download,
  Plus,
  CreditCard,
  ShoppingCart,
  FileText,
  Truck,
  Package,
  ClipboardList
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'

// Sales Views
import PointOfSaleView from '@/views/Sales/PointOfSaleView.vue'
import SalesOrdersView from '@/views/Sales/SalesOrdersView.vue'
import SalesDocsView from '@/views/Sales/SalesDocsView.vue'
import ShipmentsView from '@/views/Sales/ShipmentsView.vue'
import DispatchOrdersView from '@/views/Sales/DispatchOrdersView.vue'

const router = useRouter()
const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()

// State
const activeTab = ref('pos')
const showCreateDialog = ref(false)

// Computed
const tabs = computed(() => [
  {
    id: 'pos',
    name: 'Punto de Venta',
    icon: CreditCard,
    count: undefined
  },
  {
    id: 'orders',
    name: 'Órdenes de Venta',
    icon: ShoppingCart,
    count: salesStore.activeSalesOrders.length
  },
  {
    id: 'documents',
    name: 'Documentos',
    icon: FileText,
    count: salesStore.activeSalesDocs.length
  },
  {
    id: 'shipments',
    name: 'Envíos',
    icon: Truck,
    count: salesStore.activeShipments.length
  },
  {
    id: 'dispatch',
    name: 'Despachos',
    icon: Package,
    count: salesStore.activeDispatchOrders.length
  }
])

// Methods
const exportData = () => {
  // TODO: Implement export functionality
  console.log('Export sales data')
}

const openPOS = () => {
  showCreateDialog.value = false
  activeTab.value = 'pos'
}

const createSalesOrder = () => {
  showCreateDialog.value = false
  activeTab.value = 'orders'
  // TODO: Open create order dialog
}

const createSalesDoc = () => {
  showCreateDialog.value = false
  activeTab.value = 'documents'
  // TODO: Open create document dialog
}

const createShipment = () => {
  showCreateDialog.value = false
  activeTab.value = 'shipments'
  // TODO: Open create shipment dialog
}

// Lifecycle
onMounted(async () => {
  if (companiesStore.currentCompany) {
    // First load price lists
    await salesStore.fetchPriceLists(companiesStore.currentCompany.id)
    
    // Then load other data, including products with selected price list
    await Promise.all([
      salesStore.fetchSalesOrders(companiesStore.currentCompany.id),
      salesStore.fetchSalesDocs(companiesStore.currentCompany.id),
      salesStore.fetchShipments(companiesStore.currentCompany.id),
      salesStore.fetchDispatchOrders(companiesStore.currentCompany.id),
      salesStore.fetchCustomers(companiesStore.currentCompany.id),
      salesStore.fetchProducts(companiesStore.currentCompany.id, salesStore.selectedPriceList?.id)
    ])
  }
})

// Watchers
watch(
  () => companiesStore.currentCompany,
  async (newCompany) => {
    if (newCompany) {
      // First load price lists
      await salesStore.fetchPriceLists(newCompany.id)
      
      // Then load other data, including products with selected price list
      await Promise.all([
        salesStore.fetchSalesOrders(newCompany.id),
        salesStore.fetchSalesDocs(newCompany.id),
        salesStore.fetchShipments(newCompany.id),
        salesStore.fetchDispatchOrders(newCompany.id),
        salesStore.fetchCustomers(newCompany.id),
        salesStore.fetchProducts(newCompany.id, salesStore.selectedPriceList?.id)
      ])
    }
  }
)
</script>