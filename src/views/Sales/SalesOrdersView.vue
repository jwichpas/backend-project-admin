<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">Órdenes de Venta</h2>
        <p class="text-muted-foreground">
          Gestiona las órdenes de venta pendientes y aprobadas
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

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Órdenes</p>
              <p class="text-2xl font-bold">{{ salesStore.activeSalesOrders.length }}</p>
            </div>
            <ShoppingCart class="h-8 w-8 text-blue-500" />
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
              <p class="text-sm text-muted-foreground">Aprobadas</p>
              <p class="text-2xl font-bold text-green-600">{{ approvedCount }}</p>
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

    <!-- Orders Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Órdenes de Venta ({{ filteredOrders.length }})</span>
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
              <TableHead>Cliente</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="salesStore.loading">
              <TableCell colspan="6" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando órdenes...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredOrders.length === 0">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                No se encontraron órdenes de venta
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="order in filteredOrders" :key="order.id" class="hover:bg-muted/50">
              <TableCell>
                <div class="font-medium">{{ formatDate(order.order_date) }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDateTime(order.created_at) }}</div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <User class="h-4 w-4 text-muted-foreground" />
                  <span class="font-medium">{{ order.customer_name || 'Cliente desconocido' }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ order.currency_code }}</Badge>
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ formatCurrency(order.total_amount, order.currency_code) }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(order.status)">
                  {{ getStatusText(order.status) }}
                </Badge>
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
                    :disabled="order.status === 'SHIPPED'"
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
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>Nueva Orden de Venta</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto pr-2 -mr-2">
          <SalesOrderForm 
            @save="handleSaveOrder" 
            @cancel="showCreateOrderDialog = false" 
          />
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
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Eye,
  Edit,
  MoreVertical,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
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

// Sales Components
import SalesOrderForm from '@/components/sales/SalesOrderForm.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()

// State
const showCreateOrderDialog = ref(false)

// Computed
const filteredOrders = computed(() => salesStore.activeSalesOrders)

const pendingCount = computed(() => {
  return filteredOrders.value.filter(o => o.status === 'PENDING').length
})

const approvedCount = computed(() => {
  return filteredOrders.value.filter(o => o.status === 'APPROVED').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return filteredOrders.value.filter(order => {
    const orderDate = new Date(order.order_date)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  }).length
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

const formatCurrency = (amount: number, currency: string) => {
  const symbol = currency === 'PEN' ? 'S/' : '$'
  return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'destructive'
    case 'SHIPPED': return 'default'
    case 'CANCELLED': return 'secondary'
    default: return 'outline'
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PENDING': 'Pendiente',
    'APPROVED': 'Aprobada',
    'REJECTED': 'Rechazada',
    'SHIPPED': 'Enviada',
    'CANCELLED': 'Cancelada'
  }
  return statusMap[status] || status
}

const viewOrder = (order: any) => {
  salesStore.selectSalesOrder(order)
  // TODO: Show order details dialog
  console.log('View order:', order)
}

const editOrder = (order: any) => {
  salesStore.selectSalesOrder(order)
  // TODO: Open edit dialog
  console.log('Edit order:', order)
}

const showOrderActions = (order: any) => {
  // TODO: Show context menu with actions
  console.log('Show actions for order:', order)
}

const exportOrders = () => {
  // TODO: Implement export logic
  console.log('Export orders')
}

const refreshData = async () => {
  if (companiesStore.currentCompany) {
    await salesStore.fetchSalesOrders(companiesStore.currentCompany.id)
  }
}

const handleSaveOrder = (orderData: any) => {
  showCreateOrderDialog.value = false
  refreshData() // Refresh the list to show the new order
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
    await refreshData()
  }
})

// Watchers
watch(
  () => companiesStore.currentCompany,
  async (newCompany) => {
    if (newCompany) {
      await refreshData()
    }
  }
)
</script>