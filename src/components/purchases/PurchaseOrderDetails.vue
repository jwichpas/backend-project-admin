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
  purchasesStore.purchaseOrderItems.filter(item => item.purchase_order_id === props.order.id)
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

const exportToPDF = async () => {
  try {
    // Create PDF content
    const pdfContent = generatePDFContent()

    // Create and download PDF
    const link = document.createElement('a')
    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    // Open in new window for printing
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  }
}

const generatePDFContent = (): string => {
  const orderDate = formatDate(props.order.order_date)
  const expectedDate = props.order.expected_delivery_date ? formatDate(props.order.expected_delivery_date) : 'No definida'
  const itemsHtml = items.value.map(item => `
    <tr>
      <td>
        <div class="product-info">${item.product_name || 'Producto desconocido'}</div>
        <div class="product-sku">SKU: ${item.product_sku || 'N/A'}</div>
      </td>
      <td class="text-right font-mono">${formatNumber(item.quantity)}</td>
      <td class="text-center">${item.unit_code || 'UND'}</td>
      <td class="text-right font-mono">${formatCurrency(item.unit_price, props.order.currency_code)}</td>
      <td class="text-right font-mono font-bold">${formatCurrency(item.total_line, props.order.currency_code)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Orden de Compra - ${props.order.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            gap: 20px;
          }
          .info-box {
            flex: 1;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .info-box h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
            font-size: 14px;
            font-weight: bold;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .info-value {
            color: #6b7280;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-pending {
            background: #fef3c7;
            color: #78350f;
          }
          .status-approved {
            background: #d1fae5;
            color: #065f46;
          }
          .status-rejected {
            background: #fee2e2;
            color: #991b1b;
          }
          .items-section {
            margin-top: 25px;
          }
          .items-header {
            color: #2563eb;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: white;
            border: 1px solid #e2e8f0;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: bold;
            color: #374151;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            font-size: 11px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: 'Courier New', monospace; }
          .font-bold { font-weight: bold; }
          .product-info {
            font-weight: bold;
            color: #1f2937;
          }
          .product-sku {
            color: #6b7280;
            font-size: 10px;
          }
          .summary-section {
            margin-top: 25px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
          }
          .summary-total {
            color: #1f2937;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          .notes-section {
            margin: 20px 0;
            background: #fefefe;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .notes-section h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
            font-size: 14px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
              font-size: 11px;
            }
            .info-section {
              flex-direction: column;
              gap: 10px;
            }
            .summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDEN DE COMPRA</h1>
          <p><strong>N°:</strong> ${props.order.id}</p>
          <p><strong>Fecha:</strong> ${orderDate}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Información de la Orden</h3>
            <div class="info-row">
              <span class="info-label">Estado:</span>
              <span class="status-badge status-${props.order.status.toLowerCase()}">${getStatusText(props.order.status)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha Esperada:</span>
              <span class="info-value">${expectedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Moneda:</span>
              <span class="info-value">${props.order.currency_code}</span>
            </div>
          </div>

          <div class="info-box">
            <h3>Información del Proveedor</h3>
            <div class="info-row">
              <span class="info-label">Empresa:</span>
              <span class="info-value">${props.order.supplier_name || 'No especificado'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Items:</span>
              <span class="info-value">${items.value.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Importe Total:</span>
              <span class="info-value">${formatCurrency(totalAmount.value, props.order.currency_code)}</span>
            </div>
          </div>
        </div>

        ${props.order.notes ? `
        <div class="notes-section">
          <h3>Observaciones</h3>
          <p style="margin: 10px 0; color: #374151; line-height: 1.4;">${props.order.notes}</p>
        </div>
        ` : ''}

        <div class="items-section">
          <div class="items-header">
            Detalle de Items (${items.value.length})
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40%;">Producto</th>
                <th style="width: 12%;" class="text-right">Cantidad</th>
                <th style="width: 10%;" class="text-center">Unidad</th>
                <th style="width: 19%;" class="text-right">Precio Unit.</th>
                <th style="width: 19%;" class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Items</div>
              <div class="summary-value">${items.value.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Cantidad Total</div>
              <div class="summary-value">${formatNumber(totalQuantity.value)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Importe Total</div>
              <div class="summary-value summary-total">${formatCurrency(totalAmount.value, props.order.currency_code)}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleString('es-PE')}</p>
          <p>Sistema de Gestión de Compras</p>
        </div>
      </body>
    </html>
  `
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