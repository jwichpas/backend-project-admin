<template>
  <div class="space-y-6">
    <!-- Header Information -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Información General</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-muted-foreground">Estado:</span>
            <Badge :variant="getStatusVariant(order.status)">
              {{ getStatusText(order.status) }}
            </Badge>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted-foreground">Fecha de Orden:</span>
            <span class="text-sm font-medium">{{ formatDate(order.order_date) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted-foreground">Fecha Esperada:</span>
            <span class="text-sm font-medium">
              {{ order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'No definida' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted-foreground">Creado:</span>
            <span class="text-sm font-medium">{{ formatDateTime(order.created_at) }}</span>
          </div>
          <div v-if="order.updated_at !== order.created_at" class="flex justify-between">
            <span class="text-sm text-muted-foreground">Actualizado:</span>
            <span class="text-sm font-medium">{{ formatDateTime(order.updated_at) }}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Proveedor y Moneda</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building2 class="h-5 w-5 text-white" />
            </div>
            <div>
              <p class="font-medium">{{ order.supplier_name || 'Proveedor desconocido' }}</p>
              <p class="text-sm text-muted-foreground">{{ order.branch_name || 'Sin sucursal' }}</p>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted-foreground">Moneda:</span>
            <Badge variant="outline" class="font-mono">{{ order.currency_code }}</Badge>
          </div>
          <div v-if="order.exchange_rate && order.currency_code !== 'PEN'" class="flex justify-between">
            <span class="text-sm text-muted-foreground">Tipo de Cambio:</span>
            <span class="text-sm font-medium font-mono">{{ order.exchange_rate.toFixed(6) }}</span>
          </div>
          <div class="flex justify-between pt-2 border-t">
            <span class="text-sm text-muted-foreground">Total:</span>
            <span class="text-lg font-bold">
              {{ formatCurrency(order.total_amount, order.currency_code) }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Notes -->
    <Card v-if="order.notes">
      <CardHeader>
        <CardTitle class="text-base">Notas</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm">{{ order.notes }}</p>
      </CardContent>
    </Card>

    <!-- Items -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base flex items-center justify-between">
          <span>Productos ({{ items.length }})</span>
          <Button 
            v-if="canEdit" 
            variant="outline" 
            size="sm" 
            @click="$emit('edit', order)"
          >
            <Edit class="mr-2 h-4 w-4" />
            Editar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <div v-if="itemsLoading" class="p-8 text-center">
          <div class="flex items-center justify-center">
            <Loader2 class="h-6 w-6 animate-spin mr-2" />
            Cargando productos...
          </div>
        </div>
        <div v-else-if="items.length === 0" class="p-8 text-center text-muted-foreground">
          No hay productos en esta orden
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead class="text-right">Cantidad</TableHead>
              <TableHead class="text-right">Precio Unit.</TableHead>
              <TableHead class="text-right">Descuento</TableHead>
              <TableHead class="text-right">Total Línea</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in items" :key="item.id">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Package class="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ item.product_name || 'Producto desconocido' }}</p>
                    <p class="text-sm text-muted-foreground">{{ item.product_sku }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm">{{ item.description || '-' }}</div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex flex-col items-end">
                  <span class="font-medium">{{ item.quantity.toLocaleString('es-PE') }}</span>
                  <span class="text-xs text-muted-foreground">{{ item.unit_description || item.unit_code }}</span>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <span class="font-medium font-mono">
                  {{ formatCurrency(item.unit_price, order.currency_code) }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                <div v-if="item.discount_pct > 0" class="text-green-600 font-medium">
                  {{ item.discount_pct }}%
                </div>
                <div v-else class="text-muted-foreground">-</div>
              </TableCell>
              <TableCell class="text-right">
                <span class="font-medium font-mono">
                  {{ formatCurrency(item.total_line, order.currency_code) }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Summary -->
    <Card>
      <CardContent class="p-6">
        <div class="flex justify-end">
          <div class="bg-muted p-4 rounded-lg min-w-64">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span class="font-medium font-mono">{{ formatCurrency(subtotal, order.currency_code) }}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span class="font-mono">{{ formatCurrency(order.total_amount, order.currency_code) }}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4 border-t">
      <div class="flex items-center gap-2">
        <Button 
          v-if="canApprove" 
          @click="$emit('approve', order)"
          variant="default"
          size="sm"
        >
          <CheckCircle class="mr-2 h-4 w-4" />
          Aprobar
        </Button>
        <Button 
          v-if="canReject" 
          @click="$emit('reject', order)"
          variant="destructive"
          size="sm"
        >
          <XCircle class="mr-2 h-4 w-4" />
          Rechazar
        </Button>
        <Button 
          v-if="canCancel" 
          @click="$emit('cancel-order', order)"
          variant="outline"
          size="sm"
        >
          <Ban class="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <Button 
          @click="exportToPDF" 
          variant="outline" 
          size="sm"
        >
          <FileText class="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button @click="$emit('close')" variant="outline">
          Cerrar
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePurchasesStore, type PurchaseOrder, type PurchaseOrderItem } from '@/stores/purchases'
import {
  Building2,
  Package,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  FileText
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

interface Props {
  order: PurchaseOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  edit: [order: PurchaseOrder]
  approve: [order: PurchaseOrder]
  reject: [order: PurchaseOrder]
  'cancel-order': [order: PurchaseOrder]
}>()

const purchasesStore = usePurchasesStore()

// State
const itemsLoading = ref(false)

// Computed
const items = computed(() => 
  purchasesStore.getPurchaseOrderItems(props.order.id)
)

const subtotal = computed(() => {
  return items.value.reduce((total, item) => total + item.total_line, 0)
})

const canEdit = computed(() => {
  return props.order.status === 'PENDING'
})

const canApprove = computed(() => {
  return props.order.status === 'PENDING'
})

const canReject = computed(() => {
  return props.order.status === 'PENDING'
})

const canCancel = computed(() => {
  return props.order.status === 'PENDING' || props.order.status === 'APPROVED'
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

const exportToPDF = () => {
  // TODO: Implement PDF export
  console.log('Export to PDF:', props.order)
}

// Lifecycle
onMounted(async () => {
  itemsLoading.value = true
  try {
    await purchasesStore.fetchPurchaseOrderItems(props.order.id)
  } catch (error) {
    console.error('Error loading order items:', error)
  } finally {
    itemsLoading.value = false
  }
})
</script>