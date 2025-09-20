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
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden">
        <SalesOrderForm
          @save="handleSaveOrder"
          @cancel="showCreateOrderDialog = false"
        />
      </DialogContent>
    </Dialog>

    <!-- View Order Details Dialog -->
    <Dialog v-model:open="showViewOrderDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>Detalles de la Orden de Venta</DialogTitle>
        </DialogHeader>
        <div v-if="selectedOrder" class="flex-1 overflow-y-auto space-y-6">
          <!-- Order Header -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Número de Orden</label>
                <p class="text-lg font-semibold">#{{ selectedOrder.id.slice(-8).toUpperCase() }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Cliente</label>
                <p class="text-base">{{ selectedOrder.customer_name || 'Cliente no especificado' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Fecha de Orden</label>
                <p class="text-base">{{ formatDate(selectedOrder.order_date) }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Estado</label>
                <div class="mt-1">
                  <Badge :variant="getStatusVariant(selectedOrder.status)">
                    {{ getStatusText(selectedOrder.status) }}
                  </Badge>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Moneda</label>
                <p class="text-base">{{ selectedOrder.currency_code }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Total</label>
                <p class="text-lg font-semibold text-primary">
                  {{ formatCurrency(selectedOrder.total_amount, selectedOrder.currency_code) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div v-if="selectedOrder.items && selectedOrder.items.length > 0">
            <h3 class="text-lg font-semibold mb-3">Productos</h3>
            <div class="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead class="text-right">Cantidad</TableHead>
                    <TableHead class="text-right">Precio Unitario</TableHead>
                    <TableHead class="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in selectedOrder.items" :key="item.id">
                    <TableCell>
                      <div>
                        <p class="font-medium">{{ item.product_name || 'Producto sin nombre' }}</p>
                        <p class="text-sm text-muted-foreground">{{ item.description || '' }}</p>
                      </div>
                    </TableCell>
                    <TableCell class="text-right">{{ item.quantity }}</TableCell>
                    <TableCell class="text-right">
                      {{ formatCurrency(item.unit_price, selectedOrder.currency_code) }}
                    </TableCell>
                    <TableCell class="text-right font-medium">
                      {{ formatCurrency(item.total_line, selectedOrder.currency_code) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="selectedOrder.notes">
            <h3 class="text-lg font-semibold mb-3">Notas</h3>
            <div class="bg-muted p-4 rounded-lg">
              <p class="text-sm">{{ selectedOrder.notes }}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-between gap-2 mt-6 pt-4 border-t">
          <div class="flex gap-2">
            <Button variant="outline" @click="exportOrderToPDF" :disabled="!selectedOrder">
              <Download class="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" @click="printOrder" :disabled="!selectedOrder">
              <Printer class="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="showViewOrderDialog = false">
              Cerrar
            </Button>
            <Button v-if="selectedOrder && selectedOrder.status !== 'SHIPPED'" @click="editSelectedOrder">
              <Edit class="mr-2 h-4 w-4" />
              Editar Orden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Order Dialog -->
    <Dialog v-model:open="showEditOrderDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden">
        <SalesOrderForm
          v-if="selectedOrder"
          :initialOrder="selectedOrder"
          @save="handleUpdateOrder"
          @cancel="showEditOrderDialog = false"
        />
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
  Loader2,
  Printer
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
const showViewOrderDialog = ref(false)
const showEditOrderDialog = ref(false)
const selectedOrder = ref(null)

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

const viewOrder = async (order: any) => {
  selectedOrder.value = order
  salesStore.selectSalesOrder(order)

  // Fetch order details with items
  try {
    await salesStore.fetchSalesOrderItems(order.id)
    // Update selectedOrder with the fetched items
    selectedOrder.value = {
      ...order,
      items: salesStore.salesOrderItems
    }
  } catch (error) {
    console.error('Error fetching order items:', error)
  }

  showViewOrderDialog.value = true
}

const editOrder = async (order: any) => {
  selectedOrder.value = order
  salesStore.selectSalesOrder(order)

  // Fetch order details with items for editing
  try {
    await salesStore.fetchSalesOrderItems(order.id)
    // Update selectedOrder with the fetched items
    selectedOrder.value = {
      ...order,
      items: salesStore.salesOrderItems
    }
  } catch (error) {
    console.error('Error fetching order items for editing:', error)
  }

  showEditOrderDialog.value = true
}

const editSelectedOrder = () => {
  showViewOrderDialog.value = false
  showEditOrderDialog.value = true
}

const showOrderActions = (order: any) => {
  // TODO: Show context menu with actions
  console.log('Show actions for order:', order)
}

const exportOrders = () => {
  try {
    // Prepare data for export
    const exportData = filteredOrders.value.map(order => ({
      'Número': order.id.slice(-8).toUpperCase(),
      'Fecha': formatDate(order.order_date),
      'Cliente': order.customer_name || 'Sin cliente',
      'Moneda': order.currency_code,
      'Total': order.total_amount,
      'Estado': getStatusText(order.status),
      'Fecha Creación': formatDateTime(order.created_at)
    }))

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {})
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ordenes_venta_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    alert('¡Exportación completada exitosamente!')
  } catch (error) {
    console.error('Error exporting orders:', error)
    alert('Error al exportar las órdenes. Por favor, intente nuevamente.')
  }
}

const exportOrderToPDF = async () => {
  if (!selectedOrder.value) return

  try {
    const orderData = selectedOrder.value
    const companyData = companiesStore.currentCompany

    // Create professional PDF content
    const htmlContent = generateOrderPDFHTML(orderData, companyData)

    // Create a temporary container for rendering
    const container = document.createElement('div')
    container.innerHTML = htmlContent
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    container.style.background = 'white'
    document.body.appendChild(container)

    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 100))

    // Convert to PDF using browser's built-in functionality
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      const orderNumber = orderData.id.slice(-8).toUpperCase()
      const fileName = `orden_venta_${orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div id="print-container"></div>
          <script>
            (function() {
              const match = ${JSON.stringify(htmlContent)}.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
              document.getElementById("print-container").innerHTML = match ? match[1] : ${JSON.stringify(htmlContent)};

              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  try { window.close(); } catch(e) {}
                }, 1000);
              };
            })();
          <\/script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }

    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error al generar el PDF. Por favor, intente nuevamente.')
  }
}

const printOrder = () => {
  if (!selectedOrder.value) return

  try {
    const orderData = selectedOrder.value
    const companyData = companiesStore.currentCompany

    // Create professional print content
    const htmlContent = generateOrderPDFHTML(orderData, companyData)

    // Open print window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  } catch (error) {
    console.error('Error printing order:', error)
    alert('Error al imprimir la orden. Por favor, intente nuevamente.')
  }
}

const generateOrderPDFHTML = (order: any, company: any) => {
  const currentDate = new Date().toLocaleDateString('es-PE')
  const orderNumber = order.id.slice(-8).toUpperCase()

  // Generate styles
  const styles = generatePDFStyles()

  // Generate content sections
  const headerSection = generateHeaderSection(company, order, orderNumber, currentDate)
  const contentSection = generateContentSection(order)
  const footerSection = generateFooterSection(company, currentDate)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orden de Venta #${orderNumber}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="document">
    ${headerSection}
    ${contentSection}
    ${footerSection}
  </div>
</body>
</html>`
}

const generatePDFStyles = () => {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px; line-height: 1.6; color: #111827;
      background: #fff;
      padding: 40px;
    }
    .document {
      max-width: 800px; margin: 0 auto; background: white;
      border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 40px;
    }
    /* HEADER */
    .header { margin-bottom: 40px; border-bottom: 2px solid #111827; padding-bottom: 20px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
    .company-section { flex: 1; }
    .company-name { font-size: 26px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .company-details { color: #4b5563; font-size: 13px; line-height: 1.4; }
    .company-details div { margin-bottom: 2px; }
    .document-badge {
      text-align: right; font-size: 13px; color: #374151;
    }
    .doc-title { font-size: 14px; font-weight: 600; letter-spacing: 1px; color: #111827; }
    .doc-number { font-size: 20px; font-weight: 700; margin: 4px 0; color: #111827; }
    .doc-dates { font-size: 12px; color: #6b7280; }

    /* CONTENT */
    .content { margin-bottom: 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
    .info-card {
      border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px;
    }
    .info-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; color: #111827; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-label { color: #6b7280; font-size: 12px; }
    .info-value { font-weight: 500; font-size: 13px; color: #111827; }
    .status-badge {
      padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-shipped { background: #dbeafe; color: #1e40af; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-cancelled { background: #f3f4f6; color: #374151; }

    .products-section { margin-bottom: 30px; }
    .section-title {
      font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #111827;
    }
    .products-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .products-table th {
      background: #f9fafb; color: #374151; text-align: left; font-weight: 600;
      padding: 10px; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase;
    }
    .products-table td {
      padding: 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top;
    }
    .products-table tr:last-child td { border-bottom: none; }
    .product-name { font-weight: 600; color: #111827; margin-bottom: 2px; }
    .product-sku { color: #6b7280; font-size: 11px; font-family: monospace; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .totals-card { margin-top: 20px; border-top: 2px solid #111827; padding-top: 16px; }
    .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .totals-label { font-weight: 500; color: #374151; }
    .totals-amount { font-weight: 600; color: #111827; }
    .total-final { font-size: 16px; font-weight: 700; color: #111827; }

    .notes-card {
      margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fefce8;
    }
    .notes-title { font-weight: 600; margin-bottom: 8px; font-size: 14px; color: #92400e; }
    .notes-content { font-size: 13px; color: #451a03; }

    /* FOOTER */
    .footer {
      border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #6b7280;
    }
    .footer strong { color: #111827; }

    @media print {
      body { background: white; padding: 0; }
      .document { border: none; padding: 20px; }
    }
  `
}

const generateHeaderSection = (company: any, order: any, orderNumber: string, currentDate: string) => {
  return `
    <div class="header">
      <div class="header-content">
        <div class="company-section">
          <h1 class="company-name">${company?.name || 'Empresa'}</h1>
          <div class="company-details">
            <div><strong>📍</strong> ${company?.address || 'Dirección no especificada'}</div>
            <div><strong>📞</strong> ${company?.phone || 'N/A'} <strong>✉️</strong> ${company?.email || 'N/A'}</div>
            <div><strong>🏢</strong> RUC: ${company?.doc_number || 'N/A'}</div>
          </div>
        </div>
        <div class="document-badge">
          <div class="doc-title">ORDEN DE VENTA</div>
          <div class="doc-number">#${orderNumber}</div>
          <div class="doc-dates">Emitida: ${formatDate(order.order_date)}<br>Generada: ${currentDate}</div>
        </div>
      </div>
    </div>
  `
}

const generateContentSection = (order: any) => {
  const customerInfo = `
    <div class="info-card">
      <h3 class="info-title">Información del Cliente</h3>
      <div class="info-row">
        <span class="info-label">Cliente</span>
        <span class="info-value">${order.customer_name || 'Cliente no especificado'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fecha de Orden</span>
        <span class="info-value">${formatDate(order.order_date)}</span>
      </div>
      ${order.expected_delivery_date ? `
      <div class="info-row">
        <span class="info-label">Entrega Esperada</span>
        <span class="info-value">${formatDate(order.expected_delivery_date)}</span>
      </div>` : ''}
    </div>
  `

  const orderDetails = `
    <div class="info-card">
      <h3 class="info-title">Detalles de la Orden</h3>
      <div class="info-row">
        <span class="info-label">Estado</span>
        <span class="info-value">
          <span class="status-badge status-${order.status.toLowerCase()}">
            ${getStatusText(order.status)}
          </span>
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">Moneda</span>
        <span class="info-value">${order.currency_code}</span>
      </div>
      ${order.exchange_rate && order.currency_code !== 'PEN' ? `
      <div class="info-row">
        <span class="info-label">Tipo de Cambio</span>
        <span class="info-value">${order.exchange_rate}</span>
      </div>` : ''}
    </div>
  `

  const productsTable = generateProductsTable(order)
  const totalsCard = generateTotalsCard(order)
  const notesSection = order.notes ? `
    <div class="notes-card">
      <div class="notes-title">Notas adicionales</div>
      <div class="notes-content">${order.notes}</div>
    </div>
  ` : ''

  return `
    <div class="content">
      <div class="info-grid">
        ${customerInfo}
        ${orderDetails}
      </div>
      <div class="products-section">
        <h2 class="section-title">Productos de la Orden</h2>
        ${productsTable}
        ${totalsCard}
      </div>
      ${notesSection}
    </div>
  `
}

const generateProductsTable = (order: any) => {
  const rows = order.items?.map((item: any) => `
    <tr>
      <td>
        <div class="product-name">${item.product_name || 'Producto sin nombre'}</div>
        <div class="product-sku">SKU: ${item.product_sku || 'N/A'}</div>
      </td>
      <td class="text-center"><span class="amount">${item.quantity}</span></td>
      <td class="text-right"><span class="amount">${formatCurrency(item.unit_price, order.currency_code)}</span></td>
      <td class="text-right"><span class="amount">${formatCurrency(item.total_line, order.currency_code)}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="text-center">No hay productos en esta orden</td></tr>'

  return `
    <table class="products-table">
      <thead>
        <tr>
          <th style="width: 45%;">Producto</th>
          <th style="width: 15%;" class="text-center">Cantidad</th>
          <th style="width: 20%;" class="text-right">Precio Unitario</th>
          <th style="width: 20%;" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

const generateTotalsCard = (order: any) => {
  return `
    <div class="totals-card">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-amount">${formatCurrency(order.total_amount, order.currency_code)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label total-final">TOTAL</span>
        <span class="totals-amount total-final">${formatCurrency(order.total_amount, order.currency_code)}</span>
      </div>
    </div>
  `
}

const generateFooterSection = (company: any, currentDate: string) => {
  return `
    <div class="footer">
      <div class="footer-text">
        <strong>🤖 Documento generado automáticamente</strong><br>
        ${currentDate} • Para consultas, contacte con nuestro equipo de ventas<br>
        <strong>💼 ${company?.name || 'Empresa'}</strong>
      </div>
    </div>
  `
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

const handleUpdateOrder = (orderData: any) => {
  showEditOrderDialog.value = false
  selectedOrder.value = null
  refreshData() // Refresh the list to show the updated order
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
