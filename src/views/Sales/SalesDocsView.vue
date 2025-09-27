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
                    :disabled="!doc.greenter_xml"
                    title="Descargar XML"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="downloadCdr(doc)"
                    :disabled="!doc.greenter_cdr"
                    title="Descargar CDR"
                  >
                    <FileText class="h-4 w-4 text-green-600" />
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

    <!-- Document Details Dialog -->
    <Dialog v-model:open="showDocDetailDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Documento</DialogTitle>
        </DialogHeader>
        <div v-if="selectedDoc" class="space-y-6">
          <!-- Document Header -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Tipo de Documento</label>
                <p class="text-lg font-semibold">{{ getDocTypeName(selectedDoc.doc_type) }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Número</label>
                <p class="text-lg font-mono">{{ selectedDoc.series }}-{{ String(selectedDoc.number).padStart(8, '0') }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
                <p>{{ formatDate(selectedDoc.issue_date) }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Moneda</label>
                <div class="flex items-center gap-2">
                  <Badge variant="outline">{{ selectedDoc.currency_code }}</Badge>
                  <span class="text-sm text-muted-foreground">T.C.: {{ selectedDoc.exchange_rate?.toFixed(3) || 'N/A' }}</span>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Cliente</label>
                <p class="font-medium">{{ selectedDoc.parties?.fullname || selectedDoc.customer_name || 'Cliente general' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Sucursal</label>
                <p class="text-sm">{{ selectedDoc.branches?.name || 'N/A' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Tipo de Operación</label>
                <p class="text-sm font-mono">{{ selectedDoc.op_type_venta || 'N/A' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Afectación IGV</label>
                <p class="text-sm font-mono">{{ selectedDoc.igv_affectation || 'N/A' }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Estado SUNAT</label>
                <div class="flex items-center gap-2">
                  <div :class="getSunatStatusColor(selectedDoc.greenter_status)" class="h-3 w-3 rounded-full"></div>
                  <span class="font-medium">{{ getSunatStatusName(selectedDoc.greenter_status) }}</span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Total Principal</label>
                <p class="text-xl font-bold">{{ formatCurrency(selectedDoc.total_local || selectedDoc.total, 'PEN') }}</p>
              </div>
              <div v-if="selectedDoc.total_usd" class="text-sm">
                <span class="text-muted-foreground">USD: </span>
                <span class="font-medium">{{ formatCurrency(selectedDoc.total_usd, 'USD') }}</span>
              </div>
              <div v-if="selectedDoc.total_clp" class="text-sm">
                <span class="text-muted-foreground">CLP: </span>
                <span class="font-medium">{{ formatCurrency(selectedDoc.total_clp, 'CLP') }}</span>
              </div>
            </div>
          </div>

          <!-- Document Actions -->
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              @click="downloadXml(selectedDoc)"
              :disabled="!selectedDoc.greenter_xml"
            >
              <Download class="mr-2 h-4 w-4" />
              Descargar XML
            </Button>
            <Button
              variant="outline"
              @click="downloadCdr(selectedDoc)"
              :disabled="!selectedDoc.greenter_cdr"
            >
              <Download class="mr-2 h-4 w-4" />
              Descargar CDR
            </Button>
            <Button
              variant="outline"
              @click="downloadPdf(selectedDoc)"
            >
              <FileText class="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>

          <!-- Financial Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-3">
              <h4 class="font-semibold flex items-center gap-2">
                <Receipt class="h-4 w-4" />
                Operaciones Gravadas
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Local (PEN):</span>
                  <span class="font-medium">{{ formatCurrency(selectedDoc.total_ope_gravadas_local || 0, 'PEN') }}</span>
                </div>
                <div v-if="selectedDoc.total_ope_gravadas_usd" class="flex justify-between">
                  <span class="text-muted-foreground">USD:</span>
                  <span>{{ formatCurrency(selectedDoc.total_ope_gravadas_usd, 'USD') }}</span>
                </div>
                <div v-if="selectedDoc.total_ope_gravadas_clp" class="flex justify-between">
                  <span class="text-muted-foreground">CLP:</span>
                  <span>{{ formatCurrency(selectedDoc.total_ope_gravadas_clp, 'CLP') }}</span>
                </div>
              </div>

              <h5 class="font-medium text-sm mt-4">Otras Operaciones</h5>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Exoneradas:</span>
                  <span>{{ formatCurrency(selectedDoc.total_ope_exoneradas_local || 0, 'PEN') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Inafectas:</span>
                  <span>{{ formatCurrency(selectedDoc.total_ope_inafectas_local || 0, 'PEN') }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-semibold flex items-center gap-2">
                <Calculator class="h-4 w-4" />
                Impuestos y Cargos
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">IGV (PEN):</span>
                  <span class="font-medium">{{ formatCurrency(selectedDoc.total_igv_local || 0, 'PEN') }}</span>
                </div>
                <div v-if="selectedDoc.total_igv_usd" class="flex justify-between">
                  <span class="text-muted-foreground">IGV (USD):</span>
                  <span>{{ formatCurrency(selectedDoc.total_igv_usd, 'USD') }}</span>
                </div>
                <div v-if="selectedDoc.total_igv_clp" class="flex justify-between">
                  <span class="text-muted-foreground">IGV (CLP):</span>
                  <span>{{ formatCurrency(selectedDoc.total_igv_clp, 'CLP') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">ISC:</span>
                  <span>{{ formatCurrency(selectedDoc.total_isc || 0, 'PEN') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Descuentos:</span>
                  <span>{{ formatCurrency(selectedDoc.total_descuentos || 0, 'PEN') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Otros Cargos:</span>
                  <span>{{ formatCurrency(selectedDoc.total_otros_cargos || 0, 'PEN') }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-semibold flex items-center gap-2">
                <Shield class="h-4 w-4" />
                Estado SUNAT
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Hash:</span>
                  <span class="font-mono text-xs break-all">{{ selectedDoc.greenter_hash || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Ticket:</span>
                  <span class="font-mono text-xs">{{ selectedDoc.greenter_ticket || 'N/A' }}</span>
                </div>
                <div v-if="selectedDoc.error_message" class="mt-2 p-2 bg-muted rounded">
                  <span class="text-xs font-medium">Mensaje SUNAT:</span>
                  <p class="text-xs mt-1">{{ selectedDoc.error_message }}</p>
                </div>
              </div>

              <h5 class="font-medium text-sm mt-4">Auditoría</h5>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Creado:</span>
                  <span>{{ formatDateTime(selectedDoc.created_at) }}</span>
                </div>
                <div v-if="selectedDoc.updated_at !== selectedDoc.created_at" class="flex justify-between">
                  <span class="text-muted-foreground">Actualizado:</span>
                  <span>{{ formatDateTime(selectedDoc.updated_at) }}</span>
                </div>
                <div v-if="selectedDoc.notes" class="mt-2 p-2 bg-muted rounded">
                  <span class="text-xs font-medium">Notas:</span>
                  <p class="text-xs mt-1">{{ selectedDoc.notes }}</p>
                </div>
                <div v-if="selectedDoc.observations" class="mt-2 p-2 bg-muted rounded">
                  <span class="text-xs font-medium">Observaciones:</span>
                  <p class="text-xs mt-1">{{ selectedDoc.observations }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="showDocDetailDialog = false">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Document Actions Dialog -->
    <Dialog v-model:open="showActionsDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Acciones del Documento</DialogTitle>
        </DialogHeader>
        <div v-if="selectedDoc" class="space-y-4">
          <div class="text-center text-sm text-muted-foreground">
            {{ getDocTypeName(selectedDoc.doc_type) }} {{ selectedDoc.series }}-{{ String(selectedDoc.number).padStart(8, '0') }}
          </div>
          <div class="grid gap-2">
            <Button variant="outline" class="w-full justify-start" @click="viewDoc(selectedDoc); showActionsDialog = false">
              <Eye class="mr-2 h-4 w-4" />
              Ver Detalles
            </Button>
            <Button variant="outline" class="w-full justify-start" @click="downloadXml(selectedDoc)" :disabled="!selectedDoc.greenter_xml">
              <Download class="mr-2 h-4 w-4" />
              Descargar XML
            </Button>
            <Button variant="outline" class="w-full justify-start" @click="downloadCdr(selectedDoc)" :disabled="!selectedDoc.greenter_cdr">
              <Download class="mr-2 h-4 w-4" />
              Descargar CDR
            </Button>
            <Button variant="outline" class="w-full justify-start" @click="downloadPdf(selectedDoc)">
              <FileText class="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            <Button variant="outline" class="w-full justify-start" @click="createDispatchGuide(selectedDoc)">
              <Send class="mr-2 h-4 w-4" />
              Crear Guía de Remisión
            </Button>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" @click="showActionsDialog = false">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

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

    <!-- Dispatch Guide Creation Dialog -->
    <SaleDispatchSummary
      v-if="showDispatchDialog && selectedDoc"
      :sale="selectedDoc"
      @close="showDispatchDialog = false"
      @success="handleDispatchSuccess"
    />
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
  Loader2,
  Calculator,
  Shield,
  Send
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
import SaleDispatchSummary from '@/components/SaleDispatchSummary.vue'

const companiesStore = useCompaniesStore()
const salesStore = useSalesStore()

// State
const showCreateDocDialog = ref(false)
const showDocDetailDialog = ref(false)
const showActionsDialog = ref(false)
const showDispatchDialog = ref(false)
const selectedDoc = ref<any>(null)

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
  const symbols: Record<string, string> = {
    'PEN': 'S/',
    'USD': '$',
    'CLP': '$',
    'EUR': '€'
  }
  const symbol = symbols[currency] || currency

  // Format with appropriate decimal places based on currency
  const decimals = currency === 'CLP' ? 0 : 2

  return `${symbol} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
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
  selectedDoc.value = doc
  showDocDetailDialog.value = true
}

const downloadPdf = async (doc: any) => {
  try {
    // Generate PDF from document data (implement PDF generation logic)
    console.log('PDF generation not implemented yet for document:', doc)
    // TODO: Implement PDF generation using jsPDF or similar
  } catch (error) {
    console.error('Error downloading PDF:', error)
  }
}

// Helper function to decode hex-encoded URLs
const decodeHexUrl = (hexString: string): string => {
  if (!hexString) return ''
  try {
    // Remove '\x' prefix if present and convert hex to string
    const cleanHex = hexString.replace(/\\x/g, '')
    const bytes = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16))
    }
    return String.fromCharCode.apply(null, bytes)
  } catch (error) {
    console.error('Error decoding hex URL:', error)
    return hexString // Return original if decode fails
  }
}

const downloadXml = async (doc: any) => {
  try {
    if (!doc.greenter_xml) {
      console.warn('No XML file available for this document')
      return
    }

    // Decode the hex-encoded URL
    const xmlUrl = decodeHexUrl(doc.greenter_xml)

    // Create a temporary link to download the XML from Supabase Storage
    const link = document.createElement('a')
    link.href = xmlUrl
    link.download = `${doc.doc_type}-${doc.series}-${String(doc.number).padStart(8, '0')}.xml`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading XML:', error)
  }
}

const downloadCdr = async (doc: any) => {
  try {
    if (!doc.greenter_cdr) {
      console.warn('No CDR file available for this document')
      return
    }

    // Decode the hex-encoded URL
    const cdrUrl = decodeHexUrl(doc.greenter_cdr)

    // Create a temporary link to download the CDR ZIP from Supabase Storage
    const link = document.createElement('a')
    link.href = cdrUrl
    link.download = `${doc.doc_type}-${doc.series}-${String(doc.number).padStart(8, '0')}-cdr.zip`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading CDR:', error)
  }
}

const showDocActions = (doc: any) => {
  selectedDoc.value = doc
  showActionsDialog.value = true
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

const createDispatchGuide = (doc: any) => {
  selectedDoc.value = doc
  showActionsDialog.value = false
  showDispatchDialog.value = true
}

const handleDispatchSuccess = () => {
  showDispatchDialog.value = false
  // Optionally refresh data or show success message
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