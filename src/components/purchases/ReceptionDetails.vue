<template>
  <div class="space-y-6">
    <!-- Header with Reception Info -->
    <div class="flex items-center justify-between border-b pb-4">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
          <Package class="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold">Recepción - {{ formatDate(reception.reception_date) }}</h2>
          <p class="text-muted-foreground">{{ reception.warehouse_name }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Badge :variant="getStatusVariant(reception.status)" class="text-sm">
          {{ getStatusText(reception.status) }}
        </Badge>
        <Button variant="outline" size="sm" @click="$emit('edit', reception)">
          <Edit class="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" size="sm" @click="printReception">
          <Printer class="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" size="sm" @click="$emit('close')">
          <X class="mr-2 h-4 w-4" />
          Cerrar
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Reception Information -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Información de la Recepción</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Almacén de Destino</label>
              <p class="font-medium">{{ reception.warehouse_name || 'No especificado' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Fecha de Recepción</label>
              <p class="font-medium">{{ formatDate(reception.reception_date) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Estado</label>
              <Badge :variant="getStatusVariant(reception.status)">
                {{ getStatusText(reception.status) }}
              </Badge>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
              <p class="text-sm text-muted-foreground">{{ formatDateTime(reception.created_at) }}</p>
            </div>
          </div>
          
          <!-- Related Documents -->
          <div v-if="reception.purchase_doc_number || reception.purchase_order_number" class="mt-6">
            <label class="text-sm font-medium text-muted-foreground mb-3 block">Documentos Relacionados</label>
            <div class="grid gap-3 md:grid-cols-2">
              <div v-if="reception.purchase_doc_number" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center gap-2">
                  <FileText class="h-4 w-4 text-blue-500" />
                  <div>
                    <p class="text-sm font-medium text-blue-900">Documento de Compra</p>
                    <p class="text-sm text-blue-700">{{ reception.purchase_doc_number }}</p>
                  </div>
                </div>
              </div>
              <div v-if="reception.purchase_order_number" class="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div class="flex items-center gap-2">
                  <ShoppingCart class="h-4 w-4 text-purple-500" />
                  <div>
                    <p class="text-sm font-medium text-purple-900">Orden de Compra</p>
                    <p class="text-sm text-purple-700">{{ reception.purchase_order_number }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="reception.notes" class="mt-4">
            <label class="text-sm font-medium text-muted-foreground">Notas</label>
            <div class="mt-2 p-3 bg-muted/50 rounded-lg">
              <p class="text-sm">{{ reception.notes }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Reception Summary -->
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Recepción</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Items Recibidos</label>
            <p class="font-bold text-2xl text-green-600">{{ receptionItems.length }}</p>
          </div>
          
          <div>
            <label class="text-sm font-medium text-muted-foreground">Cantidad Total</label>
            <p class="font-bold text-lg">{{ formatNumber(totalQuantity) }}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Valor Total Estimado</label>
            <p class="font-bold text-lg text-primary">{{ formatCurrency(totalValue, 'PEN') }}</p>
            <p class="text-xs text-muted-foreground mt-1">Basado en costos unitarios</p>
          </div>

          <div class="border-t border-border my-4"></div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Progreso</label>
            <div class="mt-2">
              <div class="flex justify-between text-sm mb-1">
                <span>Estado de Recepción</span>
                <span>{{ getStatusPercentage(reception.status) }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="getProgressBarClass(reception.status)"
                  :style="{ width: getStatusPercentage(reception.status) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Reception Items -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Items Recibidos ({{ receptionItems.length }})</span>
          <Button variant="outline" size="sm" @click="refreshItems" :disabled="loading">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
            Actualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead class="text-right">Cantidad Recibida</TableHead>
              <TableHead class="text-right">Costo Unitario</TableHead>
              <TableHead>Lote/Serie</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead class="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="6" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-5 w-5 animate-spin mr-2" />
                  Cargando items...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="receptionItems.length === 0">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                No se encontraron items para esta recepción
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="item in receptionItems" :key="item.id" class="hover:bg-muted/50">
              <TableCell>
                <div>
                  <p class="font-medium">{{ item.product_name || 'Producto desconocido' }}</p>
                  <p class="text-sm text-muted-foreground">{{ item.product_sku }}</p>
                </div>
              </TableCell>
              <TableCell class="text-right font-mono font-medium">
                {{ formatNumber(item.quantity_received) }}
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ formatCurrency(item.unit_cost, 'PEN') }}
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  <p v-if="item.batch_number" class="font-medium">Lote: {{ item.batch_number }}</p>
                  <p v-if="item.serial_number" class="text-muted-foreground">Serie: {{ item.serial_number }}</p>
                  <p v-if="!item.batch_number && !item.serial_number" class="text-muted-foreground">-</p>
                </div>
              </TableCell>
              <TableCell>
                <p v-if="item.notes" class="text-sm">{{ item.notes }}</p>
                <p v-else class="text-sm text-muted-foreground">-</p>
              </TableCell>
              <TableCell class="text-right font-mono font-medium">
                {{ formatCurrency(item.quantity_received * item.unit_cost, 'PEN') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Actions Section -->
    <Card v-if="reception.status !== 'COMPLETE'">
      <CardHeader>
        <CardTitle>Acciones Disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex gap-3">
          <Button 
            v-if="reception.status === 'PARTIAL'" 
            @click="completeReception"
            class="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle class="mr-2 h-4 w-4" />
            Completar Recepción
          </Button>
          <Button 
            v-if="reception.status !== 'REJECTED'" 
            variant="destructive" 
            @click="rejectReception"
          >
            <XCircle class="mr-2 h-4 w-4" />
            Rechazar Recepción
          </Button>
          <Button variant="outline" @click="addItems">
            <Plus class="mr-2 h-4 w-4" />
            Agregar Items
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Package, 
  Edit, 
  Printer, 
  X, 
  RefreshCw, 
  Loader2,
  FileText,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Plus
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

import { usePurchasesStore, type Reception, type ReceptionItem } from '@/stores/purchases'

interface Props {
  reception: Reception
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  edit: [reception: Reception]
}>()

const purchasesStore = usePurchasesStore()

// State
const loading = ref(false)

// Computed
const receptionItems = computed(() =>
  purchasesStore.receptionItems.filter(item => item.reception_id === props.reception.id)
)

const totalQuantity = computed(() => 
  receptionItems.value.reduce((total, item) => total + item.quantity_received, 0)
)

const totalValue = computed(() => 
  receptionItems.value.reduce((total, item) => total + (item.quantity_received * item.unit_cost), 0)
)

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

const formatNumber = (number: number) => {
  return number.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'PARTIAL': return 'warning'
    case 'COMPLETE': return 'success'
    case 'REJECTED': return 'destructive'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PARTIAL': 'Parcial',
    'COMPLETE': 'Completa',
    'REJECTED': 'Rechazada'
  }
  return statusMap[status] || status
}

const getStatusPercentage = (status: string) => {
  switch (status) {
    case 'PARTIAL': return 50
    case 'COMPLETE': return 100
    case 'REJECTED': return 0
    default: return 0
  }
}

const getProgressBarClass = (status: string) => {
  switch (status) {
    case 'PARTIAL': return 'bg-yellow-500'
    case 'COMPLETE': return 'bg-green-500'
    case 'REJECTED': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const refreshItems = async () => {
  loading.value = true
  try {
    await purchasesStore.fetchReceptionItems(props.reception.id)
  } catch (error) {
    console.error('Error refreshing reception items:', error)
  } finally {
    loading.value = false
  }
}

const printReception = () => {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recepción de Mercadería - ${formatDate(props.reception.reception_date)}</title>
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
          border-bottom: 2px solid #059669;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #059669;
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
          color: #059669;
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
        .status-partial {
          background: #fef3c7;
          color: #78350f;
        }
        .status-complete {
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
          color: #059669;
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
          color: #059669;
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
        .related-docs {
          margin: 20px 0;
          background: #fefefe;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .related-docs h3 {
          margin: 0 0 10px 0;
          color: #059669;
          font-size: 14px;
        }
        .doc-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          padding: 8px;
          background: #f1f5f9;
          border-radius: 4px;
        }
        .doc-type {
          font-weight: bold;
          color: #334155;
          font-size: 11px;
        }
        .doc-number {
          color: #64748b;
          font-size: 11px;
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
        <h1>RECEPCIÓN DE MERCADERÍA</h1>
        <p><strong>Fecha:</strong> ${formatDate(props.reception.reception_date)}</p>
        <p><strong>Almacén:</strong> ${props.reception.warehouse_name || 'No especificado'}</p>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Información General</h3>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="status-badge status-${props.reception.status.toLowerCase()}">${getStatusText(props.reception.status)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha de Registro:</span>
            <span class="info-value">${formatDateTime(props.reception.created_at)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Progreso:</span>
            <span class="info-value">${getStatusPercentage(props.reception.status)}%</span>
          </div>
        </div>

        <div class="info-box">
          <h3>Resumen de Items</h3>
          <div class="info-row">
            <span class="info-label">Total de Items:</span>
            <span class="info-value">${receptionItems.value.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cantidad Total:</span>
            <span class="info-value">${formatNumber(totalQuantity.value)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor Estimado:</span>
            <span class="info-value">${formatCurrency(totalValue.value, 'PEN')}</span>
          </div>
        </div>
      </div>

      ${props.reception.purchase_doc_number || props.reception.purchase_order_number ? `
      <div class="related-docs">
        <h3>Documentos Relacionados</h3>
        ${props.reception.purchase_doc_number ? `
        <div class="doc-item">
          <span class="doc-type">📄 Documento de Compra:</span>
          <span class="doc-number">${props.reception.purchase_doc_number}</span>
        </div>
        ` : ''}
        ${props.reception.purchase_order_number ? `
        <div class="doc-item">
          <span class="doc-type">🛒 Orden de Compra:</span>
          <span class="doc-number">${props.reception.purchase_order_number}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${props.reception.notes ? `
      <div class="related-docs">
        <h3>Observaciones</h3>
        <p style="margin: 10px 0; color: #374151; line-height: 1.4;">${props.reception.notes}</p>
      </div>
      ` : ''}

      <div class="items-section">
        <div class="items-header">
          Detalle de Items Recibidos (${receptionItems.value.length})
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Producto</th>
              <th style="width: 12%;" class="text-right">Cantidad</th>
              <th style="width: 12%;" class="text-right">Costo Unit.</th>
              <th style="width: 15%;">Lote/Serie</th>
              <th style="width: 13%;" class="text-right">Total</th>
              <th style="width: 13%;">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${receptionItems.value.map(item => `
              <tr>
                <td>
                  <div class="product-info">${item.product_name || 'Producto desconocido'}</div>
                  <div class="product-sku">SKU: ${item.product_sku || 'N/A'}</div>
                </td>
                <td class="text-right font-mono">${formatNumber(item.quantity_received)}</td>
                <td class="text-right font-mono">${formatCurrency(item.unit_cost, 'PEN')}</td>
                <td class="text-center">
                  ${item.batch_number ? `<div><strong>Lote:</strong> ${item.batch_number}</div>` : ''}
                  ${item.serial_number ? `<div><strong>Serie:</strong> ${item.serial_number}</div>` : ''}
                  ${!item.batch_number && !item.serial_number ? '<span style="color: #9ca3af;">-</span>' : ''}
                </td>
                <td class="text-right font-mono" style="font-weight: bold;">
                  ${formatCurrency(item.quantity_received * item.unit_cost, 'PEN')}
                </td>
                <td>${item.notes || '<span style="color: #9ca3af;">-</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Items Recibidos</div>
            <div class="summary-value">${receptionItems.value.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Cantidad Total</div>
            <div class="summary-value">${formatNumber(totalQuantity.value)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Valor Total Estimado</div>
            <div class="summary-value summary-total">${formatCurrency(totalValue.value, 'PEN')}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado el ${new Date().toLocaleString('es-PE')}</p>
        <p>Sistema de Gestión de Inventarios</p>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

const completeReception = async () => {
  try {
    // TODO: Implement complete reception logic
    console.log('Complete reception:', props.reception.id)
    // This would update the reception status to 'COMPLETE'
  } catch (error) {
    console.error('Error completing reception:', error)
  }
}

const rejectReception = async () => {
  try {
    // TODO: Implement reject reception logic
    console.log('Reject reception:', props.reception.id)
    // This would update the reception status to 'REJECTED'
  } catch (error) {
    console.error('Error rejecting reception:', error)
  }
}

const addItems = () => {
  // TODO: Implement add items functionality
  console.log('Add items to reception:', props.reception.id)
  // This could open a dialog to add more items to the reception
}

// Lifecycle
onMounted(async () => {
  if (receptionItems.value.length === 0) {
    await refreshItems()
  }
})

// Watch for reception changes
watch(
  () => props.reception.id,
  async (newReceptionId) => {
    if (newReceptionId) {
      await refreshItems()
    }
  }
)
</script>