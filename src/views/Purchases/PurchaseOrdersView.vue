<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Órdenes de Compra</h1>
        <p class="text-muted-foreground">
          Gestiona las órdenes de compra y su seguimiento
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportOrders">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateOrderDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input
              v-model="searchTerm"
              placeholder="Buscar por proveedor, notas..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="REJECTED">Rechazada</option>
              <option value="RECEIVED">Recibida</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Proveedor</label>
            <select
              v-model="selectedSupplier"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los proveedores</option>
              <option
                v-for="supplier in purchasesStore.activeSuppliers"
                :key="supplier.id"
                :value="supplier.id"
              >
                {{ supplier.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Fecha</label>
            <select
              v-model="selectedDateRange"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Purchase Orders Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Órdenes de Compra ({{ filteredOrders.length }})</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="refreshData">
              <RefreshCw class="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Entrega Esperada</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="purchasesStore.loading">
              <TableCell colspan="7" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando órdenes...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredOrders.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No se encontraron órdenes de compra
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="order in filteredOrders" :key="order.id" class="hover:bg-muted/50">
              <TableCell>
                <div class="font-medium">{{ formatDate(order.order_date) }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDateTime(order.created_at) }}</div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 class="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ order.supplier_name || 'Proveedor desconocido' }}</p>
                    <p class="text-xs text-muted-foreground">{{ order.branch_name || 'Sin sucursal' }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-mono">{{ order.currency_code }}</Badge>
                <div v-if="order.exchange_rate && order.currency_code !== 'PEN'" class="text-xs text-muted-foreground">
                  TC: {{ order.exchange_rate.toFixed(6) }}
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="font-medium">
                  {{ formatCurrency(order.total_amount, order.currency_code) }}
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(order.status)">
                  {{ getStatusText(order.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div v-if="order.expected_delivery_date">
                  {{ formatDate(order.expected_delivery_date) }}
                </div>
                <div v-else class="text-muted-foreground">Sin fecha</div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="viewOrder(order)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="editOrder(order)"
                    title="Editar"
                    :disabled="order.status === 'RECEIVED' || order.status === 'CANCELLED'"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="showOrderActions(order)"
                    title="Más acciones"
                  >
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Create Order Dialog -->
    <Dialog v-model:open="showCreateOrderDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto pr-2 -mr-2">
          <PurchaseOrderForm
            @save="handleSaveOrder"
            @cancel="showCreateOrderDialog = false"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- View Order Dialog -->
    <Dialog v-model:open="showViewOrderDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>
            Detalles de Orden de Compra
          </DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto pr-2 -mr-2">
          <PurchaseOrderDetails
            v-if="selectedOrder"
            :order="selectedOrder"
            @close="showViewOrderDialog = false"
            @edit="handleEditFromView"
            @approve="handleApproveOrder"
            @reject="handleRejectOrder"
            @cancel-order="handleCancelOrder"
          />
        </div>
      </DialogContent>
    </Dialog>

    <!-- Actions Menu - To be implemented with dropdown -->
    <!-- Context menu functionality will be added later -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore, type PurchaseOrder } from '@/stores/purchases'
import {
  Download,
  Plus,
  RefreshCw,
  Building2,
  Eye,
  Edit,
  MoreVertical,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  Copy,
  FileText
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
// ContextMenu components removed for now - to be implemented later

// Purchase Components (to be created)
import PurchaseOrderForm from '@/components/purchases/PurchaseOrderForm.vue'
import PurchaseOrderDetails from '@/components/purchases/PurchaseOrderDetails.vue'

const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()

// State
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedSupplier = ref('')
const selectedDateRange = ref('')
const showCreateOrderDialog = ref(false)
const showViewOrderDialog = ref(false)
const selectedOrder = ref<PurchaseOrder | null>(null)
// Actions menu variables removed for now

// Computed
const filteredOrders = computed(() => {
  let orders = purchasesStore.purchaseOrders

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    orders = orders.filter(order => 
      order.supplier_name?.toLowerCase().includes(term) ||
      order.notes?.toLowerCase().includes(term)
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    orders = orders.filter(order => order.status === selectedStatus.value)
  }

  // Filter by supplier
  if (selectedSupplier.value) {
    orders = orders.filter(order => order.supplier_id === selectedSupplier.value)
  }

  // Filter by date range
  if (selectedDateRange.value) {
    const today = new Date()
    const orderDate = (order: PurchaseOrder) => new Date(order.order_date)

    switch (selectedDateRange.value) {
      case 'today':
        orders = orders.filter(order => 
          orderDate(order).toDateString() === today.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        orders = orders.filter(order => orderDate(order) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        orders = orders.filter(order => orderDate(order) >= monthAgo)
        break
    }
  }

  return orders
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number, currencyCode: string) => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else if (currencyCode === 'USD') {
    return `$ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else {
    return `${currencyCode} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  }
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'destructive'
    case 'RECEIVED': return 'secondary'
    case 'CANCELLED': return 'outline'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PENDING': 'Pendiente',
    'APPROVED': 'Aprobada',
    'REJECTED': 'Rechazada',
    'RECEIVED': 'Recibida',
    'CANCELLED': 'Cancelada'
  }
  return statusMap[status] || status
}

const canApprove = (order: PurchaseOrder | null) => {
  return order?.status === 'PENDING'
}

const canReject = (order: PurchaseOrder | null) => {
  return order?.status === 'PENDING'
}

const canCancel = (order: PurchaseOrder | null) => {
  return order?.status === 'PENDING' || order?.status === 'APPROVED'
}

const viewOrder = (order: PurchaseOrder) => {
  selectedOrder.value = order
  purchasesStore.selectPurchaseOrder(order)
  showViewOrderDialog.value = true
}

const editOrder = (order: PurchaseOrder) => {
  selectedOrder.value = order
  purchasesStore.selectPurchaseOrder(order)
  // TODO: Open edit dialog
}

const showOrderActions = (order: PurchaseOrder) => {
  // TODO: Implement context menu actions
  console.log('Show actions for order:', order)
}

const handleSaveOrder = async (orderData: any) => {
  try {
    await purchasesStore.createPurchaseOrder(orderData)
    showCreateOrderDialog.value = false
    await refreshData()
  } catch (error) {
    console.error('Error saving order:', error)
  }
}

const handleEditFromView = (order: PurchaseOrder) => {
  showViewOrderDialog.value = false
  editOrder(order)
}

const handleApproveOrder = async (order: PurchaseOrder) => {
  await approveOrder(order)
  if (selectedOrder.value && selectedOrder.value.id === order.id) {
    // Update selected order status
    selectedOrder.value = { ...selectedOrder.value, status: 'APPROVED' }
  }
}

const handleRejectOrder = async (order: PurchaseOrder) => {
  await rejectOrder(order)
  if (selectedOrder.value && selectedOrder.value.id === order.id) {
    // Update selected order status
    selectedOrder.value = { ...selectedOrder.value, status: 'REJECTED' }
  }
}

const handleCancelOrder = async (order: PurchaseOrder) => {
  await cancelOrder(order)
  if (selectedOrder.value && selectedOrder.value.id === order.id) {
    // Update selected order status
    selectedOrder.value = { ...selectedOrder.value, status: 'CANCELLED' }
  }
}

const approveOrder = async (order: PurchaseOrder | null) => {
  if (!order || !canApprove(order)) return
  
  try {
    await purchasesStore.updatePurchaseOrder(order.id, { status: 'APPROVED' })
    await refreshData()
  } catch (error) {
    console.error('Error approving order:', error)
  }
}

const rejectOrder = async (order: PurchaseOrder | null) => {
  if (!order || !canReject(order)) return
  
  try {
    await purchasesStore.updatePurchaseOrder(order.id, { status: 'REJECTED' })
    await refreshData()
  } catch (error) {
    console.error('Error rejecting order:', error)
  }
}

const cancelOrder = async (order: PurchaseOrder | null) => {
  if (!order || !canCancel(order)) return
  
  try {
    await purchasesStore.updatePurchaseOrder(order.id, { status: 'CANCELLED' })
    await refreshData()
  } catch (error) {
    console.error('Error cancelling order:', error)
  }
}

const duplicateOrder = (order: PurchaseOrder | null) => {
  if (!order) return
  // TODO: Implement duplicate logic
  console.log('Duplicate order:', order)
}

const exportOrder = (order: PurchaseOrder | null) => {
  if (!order) return
  // TODO: Implement export PDF logic
  console.log('Export order:', order)
}

const exportOrders = () => {
  // TODO: Implement bulk export logic
  console.log('Export all orders')
}

const refreshData = async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      purchasesStore.fetchPurchaseOrders(companyStore.selectedCompany.id),
      purchasesStore.fetchSuppliers(companyStore.selectedCompany.id)
    ])
  }
}

// Lifecycle
onMounted(async () => {
  console.log('PurchaseOrdersView onMounted - selectedCompany:', companyStore.selectedCompany)
  
  // If no company is selected but companies exist, select the first one
  if (!companyStore.selectedCompany && companyStore.companies.length === 0) {
    await companyStore.fetchCompanies()
  }
  
  if (!companyStore.selectedCompany && companyStore.companies.length > 0) {
    companyStore.selectCompany(companyStore.companies[0])
  }
  
  if (companyStore.selectedCompany) {
    await refreshData()
  }
})

// Watchers
watch(
  () => companyStore.selectedCompany,
  async (newCompany) => {
    if (newCompany) {
      await refreshData()
    }
  }
)
</script>