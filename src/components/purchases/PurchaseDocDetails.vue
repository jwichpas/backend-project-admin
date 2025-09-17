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
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            font-size: 12px;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #dc2626;
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
            color: #dc2626;
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
          .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }
          .items-section {
            margin-top: 25px;
          }
          .items-header {
            color: #dc2626;
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
          .product-details {
            color: #6b7280;
            font-size: 10px;
          }

          .totals-section {
            margin-top: 25px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .totals-column {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .totals-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .totals-item.total {
            font-size: 14px;
            font-weight: bold;
            color: #dc2626;
            border-top: 2px solid #dc2626;
            padding-top: 8px;
            margin-top: 12px;
          }
          .currency-conversion {
            background: #f1f5f9;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            font-size: 11px;
            text-align: center;
            color: #475569;
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
            color: #dc2626;
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
            .totals-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${docTypeTitle}</h1>
          <p><strong>N°:</strong> ${props.doc.series}-${props.doc.number}</p>
          <p><strong>Fecha de Emisión:</strong> ${issueDate}</p>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Información del Documento</h3>
            <div class="info-row">
              <span class="info-label">Estado:</span>
              <span class="status-badge status-${props.doc.status.toLowerCase()}">${props.doc.status}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Llegada:</span>
              <span class="info-value">${arrivalDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Moneda:</span>
              <span class="info-value">${props.doc.currency_code}</span>
            </div>
            ${props.doc.exchange_rate && props.doc.exchange_rate !== 1 ? `
            <div class="info-row">
              <span class="info-label">Tipo de Cambio:</span>
              <span class="info-value">${props.doc.exchange_rate.toFixed(6)}</span>
            </div>
            ` : ''}
          </div>

          <div class="info-box">
            <h3>Información del Proveedor</h3>
            <div class="info-row">
              <span class="info-label">Proveedor:</span>
              <span class="info-value">${props.doc.supplier_name || 'No especificado'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Items:</span>
              <span class="info-value">${docItems.value.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Importe Total:</span>
              <span class="info-value">${formatCurrency(props.doc.total, props.doc.currency_code)}</span>
            </div>
          </div>
        </div>

        ${props.doc.notes ? `
        <div class="notes-section">
          <h3>Observaciones</h3>
          <p style="margin: 10px 0; color: #374151; line-height: 1.4;">${props.doc.notes}</p>
        </div>
        ` : ''}

        <div class="items-section">
          <div class="items-header">
            Detalle de Items (${docItems.value.length})
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35%;">Descripción</th>
                <th style="width: 12%;" class="text-right">Cantidad</th>
                <th style="width: 15%;" class="text-right">Precio Unit.</th>
                <th style="width: 13%;" class="text-center">Afectación</th>
                <th style="width: 15%;" class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="totals-section">
          <div class="totals-grid">
            <div class="totals-column">
              <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 12px;">Operaciones Tributarias</h4>
              <div class="totals-item">
                <span>Operaciones Gravadas:</span>
                <span class="font-mono">${formatCurrency(props.doc.total_ope_gravadas, props.doc.currency_code)}</span>
              </div>
              <div class="totals-item">
                <span>Operaciones Exoneradas:</span>
                <span class="font-mono">${formatCurrency(props.doc.total_ope_exoneradas, props.doc.currency_code)}</span>
              </div>
              <div class="totals-item">
                <span>Operaciones Inafectas:</span>
                <span class="font-mono">${formatCurrency(props.doc.total_ope_inafectas, props.doc.currency_code)}</span>
              </div>
              <div class="totals-item">
                <span>IGV (18%):</span>
                <span class="font-mono">${formatCurrency(props.doc.total_igv, props.doc.currency_code)}</span>
              </div>
            </div>

            <div class="totals-column">
              <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 12px;">Resumen Total</h4>
              <div class="totals-item">
                <span>Subtotal:</span>
                <span class="font-mono">${formatCurrency(props.doc.total_ope_gravadas + props.doc.total_ope_exoneradas + props.doc.total_ope_inafectas, props.doc.currency_code)}</span>
              </div>
              <div class="totals-item">
                <span>Total IGV:</span>
                <span class="font-mono">${formatCurrency(props.doc.total_igv, props.doc.currency_code)}</span>
              </div>
              <div class="totals-item total">
                <span>TOTAL GENERAL:</span>
                <span class="font-mono">${formatCurrency(props.doc.total, props.doc.currency_code)}</span>
              </div>
              ${props.doc.currency_code !== 'PEN' && props.doc.total_local ? `
              <div class="currency-conversion">
                <strong>Total en Soles: ${formatCurrency(props.doc.total_local, 'PEN')}</strong>
              </div>
              ` : ''}
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