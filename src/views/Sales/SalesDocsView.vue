<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">Documentos de Venta</h2>
        <p class="text-muted-foreground">
          Facturas, boletas y comprobantes de venta
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportDocs">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateDocDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Documento
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Documentos</p>
              <p class="text-2xl font-bold">{{ salesStore.activeSalesDocs.length }}</p>
            </div>
            <FileText class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Facturas</p>
              <p class="text-2xl font-bold text-green-600">{{ facturaCount }}</p>
            </div>
            <Receipt class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Boletas</p>
              <p class="text-2xl font-bold text-orange-600">{{ boletaCount }}</p>
            </div>
            <Receipt class="h-8 w-8 text-orange-500" />
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

    <!-- Documents Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Documentos de Venta ({{ filteredDocs.length }})</span>
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
              <TableHead>Documento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado SUNAT</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="salesStore.loading">
              <TableCell colspan="7" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando documentos...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredDocs.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No se encontraron documentos de venta
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="doc in filteredDocs" :key="doc.id" class="hover:bg-muted/50">
              <TableCell>
                <div>
                  <p class="font-medium">{{ getDocTypeName(doc.doc_type) }}</p>
                  <p class="text-sm text-muted-foreground">{{ doc.series }}-{{ String(doc.number).padStart(8, '0') }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <User class="h-4 w-4 text-muted-foreground" />
                  <span class="font-medium">{{ doc.customer_name || 'Cliente general' }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="font-medium">{{ formatDate(doc.issue_date) }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDateTime(doc.created_at) }}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ doc.currency_code }}</Badge>
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ formatCurrency(doc.total, doc.currency_code) }}</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <div :class="getSunatStatusColor(doc.greenter_status)" class="h-2 w-2 rounded-full"></div>
                  <span class="text-sm">{{ getSunatStatusName(doc.greenter_status) }}</span>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="viewDoc(doc)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="downloadPdf(doc)"
                    title="Descargar PDF"
                  >
                    <FileText class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="downloadXml(doc)"
                    title="Descargar XML"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="showDocActions(doc)"
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

    <!-- Create Document Dialog -->
    <Dialog v-model:open="showCreateDocDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo Documento de Venta</DialogTitle>
        </DialogHeader>
        <div class="text-center py-8">
          <FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Formulario de Documento de Venta</h3>
          <p class="text-muted-foreground mb-4">Este formulario está en desarrollo</p>
          <div class="flex justify-center gap-3">
            <Button type="button" variant="outline" @click="showCreateDocDialog = false">
              Cancelar
            </Button>
            <Button type="button">
              Crear Documento (Demo)
            </Button>
          </div>
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
  FileText,
  Receipt,
  Calendar,
  User,
  Eye,
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

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()

// State
const showCreateDocDialog = ref(false)

// Computed
const filteredDocs = computed(() => salesStore.activeSalesDocs)

const facturaCount = computed(() => {
  return filteredDocs.value.filter(d => d.doc_type === '01').length
})

const boletaCount = computed(() => {
  return filteredDocs.value.filter(d => d.doc_type === '03').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return filteredDocs.value.filter(doc => {
    const docDate = new Date(doc.issue_date)
    return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear
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

const getDocTypeName = (type: string) => {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito'
  }
  return types[type] || type
}

const getSunatStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'NOT_SENT': 'bg-gray-400',
    'PENDING': 'bg-yellow-400',
    'ACCEPTED': 'bg-green-400',
    'REJECTED': 'bg-red-400'
  }
  return colors[status] || 'bg-gray-400'
}

const getSunatStatusName = (status: string) => {
  const names: Record<string, string> = {
    'NOT_SENT': 'No enviado',
    'PENDING': 'Pendiente',
    'ACCEPTED': 'Aceptado',
    'REJECTED': 'Rechazado'
  }
  return names[status] || 'No enviado'
}

const viewDoc = (doc: any) => {
  salesStore.selectSalesDoc(doc)
  // TODO: Show document details dialog
  console.log('View document:', doc)
}

const downloadPdf = (doc: any) => {
  // TODO: Download PDF
  console.log('Download PDF for document:', doc)
}

const downloadXml = (doc: any) => {
  // TODO: Download XML
  console.log('Download XML for document:', doc)
}

const showDocActions = (doc: any) => {
  // TODO: Show context menu with actions
  console.log('Show actions for document:', doc)
}

const exportDocs = () => {
  // TODO: Implement export logic
  console.log('Export documents')
}

const refreshData = async () => {
  if (companiesStore.currentCompany) {
    await salesStore.fetchSalesDocs(companiesStore.currentCompany.id)
  }
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