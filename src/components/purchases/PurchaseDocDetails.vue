<template>
  <div class="space-y-6">
    <!-- Header with Document Info -->
    <div class="flex items-center justify-between border-b pb-4">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
          <FileText class="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold">{{ doc.series }}-{{ doc.number }}</h2>
          <p class="text-muted-foreground">{{ doc.doc_type_description }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="$emit('edit', doc)">
          <Edit class="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" size="sm" @click="printDocument">
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
      <!-- Document Information -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Proveedor</label>
              <p class="font-medium">{{ doc.supplier_name || 'No especificado' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
              <p class="font-medium">{{ formatDate(doc.issue_date) }}</p>
            </div>
            <div v-if="doc.arrival_date">
              <label class="text-sm font-medium text-muted-foreground">Fecha de Llegada</label>
              <p class="font-medium">{{ formatDate(doc.arrival_date) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Moneda</label>
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="font-mono">{{ doc.currency_code }}</Badge>
                <span v-if="doc.exchange_rate && doc.currency_code !== 'PEN'" class="text-sm text-muted-foreground">
                  TC: {{ doc.exchange_rate.toFixed(6) }}
                </span>
              </div>
            </div>
            <div v-if="doc.op_type_kardex">
              <label class="text-sm font-medium text-muted-foreground">Tipo de Operación</label>
              <p class="font-medium">{{ doc.op_type_kardex }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Financial Summary -->
      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Operaciones Gravadas</label>
            <p class="font-bold text-lg">{{ formatCurrency(doc.total_ope_gravadas, doc.currency_code) }}</p>
            <p v-if="doc.currency_code !== 'PEN'" class="text-sm text-muted-foreground">
              {{ formatCurrency(doc.total_ope_gravadas_local, 'PEN') }}
            </p>
          </div>
          
          <div v-if="doc.total_ope_exoneradas > 0">
            <label class="text-sm font-medium text-muted-foreground">Operaciones Exoneradas</label>
            <p class="font-medium">{{ formatCurrency(doc.total_ope_exoneradas, doc.currency_code) }}</p>
            <p v-if="doc.currency_code !== 'PEN'" class="text-sm text-muted-foreground">
              {{ formatCurrency(doc.total_ope_exoneradas_local, 'PEN') }}
            </p>
          </div>

          <div v-if="doc.total_ope_inafectas > 0">
            <label class="text-sm font-medium text-muted-foreground">Operaciones Inafectas</label>
            <p class="font-medium">{{ formatCurrency(doc.total_ope_inafectas, doc.currency_code) }}</p>
          </div>

          <div class="border-t border-border my-4"></div>

          <div>
            <label class="text-sm font-medium text-muted-foreground">Total General</label>
            <p class="font-bold text-xl text-primary">
              {{ formatCurrency(calculateTotal(), doc.currency_code) }}
            </p>
            <p v-if="doc.currency_code !== 'PEN'" class="text-sm text-muted-foreground">
              {{ formatCurrency(calculateTotalLocal(), 'PEN') }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Document Items -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Items del Documento ({{ docItems.length }})</span>
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
              <TableHead>Unidad</TableHead>
              <TableHead class="text-right">Cantidad</TableHead>
              <TableHead class="text-right">Costo Unit.</TableHead>
              <TableHead class="text-right">Descuento</TableHead>
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
            <TableRow v-else-if="docItems.length === 0">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                No se encontraron items para este documento
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="item in docItems" :key="item.id" class="hover:bg-muted/50">
              <TableCell>
                <div>
                  <p class="font-medium">{{ item.product_name || 'Producto desconocido' }}</p>
                  <p class="text-sm text-muted-foreground">{{ item.product_sku }}</p>
                  <p v-if="item.description" class="text-xs text-muted-foreground italic">{{ item.description }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  <p>{{ item.unit_description || item.unit_code }}</p>
                  <p class="text-muted-foreground">{{ item.igv_affectation }}</p>
                </div>
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ formatNumber(item.quantity) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="font-mono">
                  <p>{{ formatCurrency(item.unit_cost, doc.currency_code) }}</p>
                  <p v-if="doc.currency_code !== 'PEN' && item.unit_cost_local" class="text-xs text-muted-foreground">
                    {{ formatCurrency(item.unit_cost_local, 'PEN') }}
                  </p>
                </div>
              </TableCell>
              <TableCell class="text-right font-mono">
                {{ item.discount_pct }}%
              </TableCell>
              <TableCell class="text-right font-mono font-medium">
                {{ formatCurrency(calculateItemTotal(item), doc.currency_code) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Additional Costs (if any) -->
    <Card v-if="additionalCosts.length > 0">
      <CardHeader>
        <CardTitle>Costos Adicionales</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div v-for="cost in additionalCosts" :key="cost.id" class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p class="font-medium">{{ cost.cost_type_description || cost.cost_type }}</p>
              <p v-if="cost.description" class="text-sm text-muted-foreground">{{ cost.description }}</p>
              <p class="text-xs text-muted-foreground">
                Prorrateo: {{ cost.proration_method }} | 
                {{ cost.affects_inventory ? 'Afecta inventario' : 'No afecta inventario' }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ formatCurrency(cost.amount, cost.currency_code) }}</p>
              <p v-if="cost.currency_code !== 'PEN'" class="text-sm text-muted-foreground">
                {{ formatCurrency(cost.amount_local, 'PEN') }}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  FileText, 
  Edit, 
  Printer, 
  X, 
  RefreshCw, 
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

import { usePurchasesStore, type PurchaseDoc, type PurchaseDocItem, type PurchaseAdditionalCost } from '@/stores/purchases'

interface Props {
  doc: PurchaseDoc
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  edit: [doc: PurchaseDoc]
}>()

const purchasesStore = usePurchasesStore()

// State
const loading = ref(false)

// Computed
const docItems = computed(() =>
  purchasesStore.purchaseDocItems.filter(item => item.purchase_doc_id === props.doc.id)
)

const additionalCosts = computed(() =>
  purchasesStore.additionalCosts.filter(cost => cost.purchase_doc_id === props.doc.id)
)

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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

const calculateTotal = () => {
  return props.doc.total_ope_gravadas + props.doc.total_ope_exoneradas + props.doc.total_ope_inafectas
}

const calculateTotalLocal = () => {
  return props.doc.total_ope_gravadas_local + props.doc.total_ope_exoneradas_local
}

const calculateItemTotal = (item: PurchaseDocItem) => {
  const subtotal = item.quantity * item.unit_cost
  const discount = subtotal * (item.discount_pct / 100)
  return subtotal - discount + (item.additional_cost || 0)
}

const refreshItems = async () => {
  loading.value = true
  try {
    await Promise.all([
      purchasesStore.fetchPurchaseDocItems(props.doc.id),
      purchasesStore.fetchAdditionalCosts(props.doc.id)
    ])
  } catch (error) {
    console.error('Error refreshing items:', error)
  } finally {
    loading.value = false
  }
}

const printDocument = async () => {
  try {
    // Create PDF content
    const pdfContent = generateDocumentPDFContent()

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
    console.error('Error printing document:', error)
  }
}

const generateDocumentPDFContent = (): string => {
  const issueDate = formatDate(props.doc.issue_date)
  const arrivalDate = props.doc.arrival_date ? formatDate(props.doc.arrival_date) : 'No definida'

  const itemsHtml = docItems.value.map(item => `
    <tr>
      <td>
        <div class="product-info">${item.description || 'Producto desconocido'}</div>
        <div class="product-details">Unidad: ${item.unit_code || 'UND'}</div>
      </td>
      <td class="text-right font-mono">${formatNumber(item.quantity)}</td>
      <td class="text-right font-mono">${formatCurrency(item.unit_cost, props.doc.currency_code)}</td>
      <td class="text-center">
        ${item.igv_affectation === '10' ? 'Gravada' :
          item.igv_affectation === '20' ? 'Exonerada' :
          item.igv_affectation === '30' ? 'Inafecta' : 'N/A'}
      </td>
      <td class="text-right font-mono font-bold">${formatCurrency(item.quantity * item.unit_cost, props.doc.currency_code)}</td>
    </tr>
  `).join('')

  const docTypeTitle = props.doc.doc_type === '01' ? 'FACTURA' :
                      props.doc.doc_type === '03' ? 'BOLETA DE VENTA' :
                      props.doc.doc_type === '07' ? 'NOTA DE CRÉDITO' :
                      props.doc.doc_type === '08' ? 'NOTA DE DÉBITO' : 'DOCUMENTO'

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Documento de Compra - ${props.doc.series}-${props.doc.number}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 40px;
            color: #333;
            background: #fafafa;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
          }

          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #111;
            letter-spacing: 1px;
          }

          .header h2 {
            margin: 5px 0 0;
            font-size: 16px;
            color: #555;
            font-weight: normal;
          }

          .info-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }

          .info-row strong {
            color: #444;
          }

          .status {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
          }

          .status-pending { background: #fef3c7; color: #92400e; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-completed { background: #dbeafe; color: #1e40af; }
          .status-cancelled { background: #f3f4f6; color: #374151; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
          }

          thead {
            background: #f5f5f5;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 10px;
          }

          th {
            text-align: left;
            font-weight: 600;
            color: #444;
          }

          td {
            vertical-align: top;
          }

          td:nth-child(2),
          td:nth-child(3) {
            text-align: center;
          }

          td:nth-child(4),
          td:nth-child(5) {
            text-align: right;
          }

          .totals {
            margin-top: 30px;
            text-align: right;
            font-size: 15px;
          }

          .totals p {
            margin: 5px 0;
          }

          .totals strong {
            font-size: 16px;
            color: #111;
          }

          .totals-section {
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-top: 20px;
          }

          /* 🔹 Estilos especiales para impresión a color */
          @media print {
            body {
              background: #fafafa !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .info-section,
            .status,
            table th,
            table td,
            .totals-section {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${docTypeTitle}</h1>
          <h2>${props.doc.series}-${props.doc.number}</h2>
        </div>

        <div class="info-section">
          <div class="info-row">
            <strong>Estado:</strong>
            <span class="status status-${props.doc.status.toLowerCase()}">${props.doc.status}</span>
          </div>
          <div class="info-row">
            <strong>Fecha de Emisión:</strong>
            <span>${issueDate}</span>
          </div>
          <div class="info-row">
            <strong>Fecha de Llegada:</strong>
            <span>${arrivalDate}</span>
          </div>
          <div class="info-row">
            <strong>Proveedor:</strong>
            <span>${props.doc.supplier_name || 'No especificado'}</span>
          </div>
          <div class="info-row">
            <strong>Moneda:</strong>
            <span>${props.doc.currency_code}</span>
          </div>
          ${props.doc.exchange_rate && props.doc.exchange_rate !== 1 ? `
          <div class="info-row">
            <strong>Tipo de Cambio:</strong>
            <span>${props.doc.exchange_rate.toFixed(6)}</span>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals">
            <p><strong>Operaciones Gravadas: ${formatCurrency(props.doc.total_ope_gravadas, props.doc.currency_code)}</strong></p>
            <p><strong>Operaciones Exoneradas: ${formatCurrency(props.doc.total_ope_exoneradas, props.doc.currency_code)}</strong></p>
            <p><strong>Operaciones Inafectas: ${formatCurrency(props.doc.total_ope_inafectas, props.doc.currency_code)}</strong></p>
            <p><strong>IGV: ${formatCurrency(props.doc.total_igv, props.doc.currency_code)}</strong></p>
            <p style="font-size: 18px; margin-top: 15px; border-top: 2px solid #ddd; padding-top: 10px;">
              <strong>TOTAL: ${formatCurrency(props.doc.total, props.doc.currency_code)}</strong>
            </p>
            ${props.doc.currency_code !== 'PEN' && props.doc.total_local ? `
            <p style="color: #666; font-size: 14px;">
              <strong>Total en Soles: ${formatCurrency(props.doc.total_local, 'PEN')}</strong>
            </p>
            ` : ''}
          </div>
          ${props.doc.notes ? `
          <div style="margin-top: 20px; text-align: left;">
            <strong>Observaciones:</strong>
            <p style="margin-top: 5px; font-style: italic;">${props.doc.notes}</p>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `
}

// Lifecycle
onMounted(async () => {
  if (docItems.value.length === 0) {
    await refreshItems()
  }
})

// Watch for document changes
watch(
  () => props.doc.id,
  async (newDocId) => {
    if (newDocId) {
      await refreshItems()
    }
  }
)
</script>