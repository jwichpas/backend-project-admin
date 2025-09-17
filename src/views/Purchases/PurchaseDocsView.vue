<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Documentos de Compra</h1>
        <p class="text-muted-foreground">
          Gestiona facturas, boletas y otros documentos de compras recibidos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportDocs">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="$router.push('/purchases/docs/new')">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Documento
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-5">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input
              v-model="searchTerm"
              placeholder="Serie, número, proveedor..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Tipo de Documento</label>
            <select
              v-model="selectedDocType"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los tipos</option>
              <option value="01">Factura</option>
              <option value="03">Boleta</option>
              <option value="07">Nota de Crédito</option>
              <option value="08">Nota de Débito</option>
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
            <label class="text-sm font-medium">Moneda</label>
            <select
              v-model="selectedCurrency"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las monedas</option>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
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
              <option value="year">Este año</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Documentos</p>
              <p class="text-2xl font-bold">{{ filteredDocs.length }}</p>
            </div>
            <FileText class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Valor Total (PEN)</p>
              <p class="text-2xl font-bold">{{ formatCurrency(totalValuePEN, 'PEN') }}</p>
            </div>
            <DollarSign class="h-8 w-8 text-green-500" />
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
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Proveedores</p>
              <p class="text-2xl font-bold">{{ uniqueSuppliers }}</p>
            </div>
            <Users class="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Documents Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Documentos de Compra ({{ filteredDocs.length }})</span>
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
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead class="text-right">Total Gravado</TableHead>
              <TableHead class="text-right">Total</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="purchasesStore.loading">
              <TableCell colspan="7" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando documentos...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredDocs.length === 0">
              <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                No se encontraron documentos de compra
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="doc in filteredDocs" :key="doc.id" class="hover:bg-muted/50">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <FileText class="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p class="font-medium font-mono">{{ doc.series }}-{{ doc.number }}</p>
                    <p class="text-xs text-muted-foreground">{{ doc.doc_type_description }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Building2 class="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p class="font-medium text-sm">{{ doc.supplier_name || 'Proveedor desconocido' }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="font-medium">{{ formatDate(doc.issue_date) }}</div>
                <div v-if="doc.arrival_date" class="text-xs text-muted-foreground">
                  Llegada: {{ formatDate(doc.arrival_date) }}
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-col items-start">
                  <Badge variant="outline" class="font-mono">{{ doc.currency_code }}</Badge>
                  <div v-if="doc.exchange_rate && doc.currency_code !== 'PEN'" class="text-xs text-muted-foreground mt-1">
                    TC: {{ doc.exchange_rate.toFixed(6) }}
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="font-medium font-mono">
                  {{ formatCurrency(doc.total_ope_gravadas, doc.currency_code) }}
                </div>
                <div v-if="doc.currency_code !== 'PEN'" class="text-xs text-muted-foreground">
                  {{ formatCurrency(doc.total_ope_gravadas_local, 'PEN') }}
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="font-medium font-mono">
                  {{ formatCurrency(calculateTotalDoc(doc), doc.currency_code) }}
                </div>
                <div v-if="doc.currency_code !== 'PEN'" class="text-xs text-muted-foreground">
                  {{ formatCurrency(calculateTotalDocLocal(doc), 'PEN') }}
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
                    @click="editDoc(doc)"
                    title="Editar"
                  >
                    <Edit class="h-4 w-4" />
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


    <!-- View Document Dialog -->
    <Dialog v-model:open="showViewDocDialog">
      <DialogContent class="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>
            Detalles del Documento de Compra
          </DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto pr-2 -mr-2">
          <PurchaseDocDetails
            v-if="selectedDoc"
            :doc="selectedDoc"
            @close="showViewDocDialog = false"
            @edit="handleEditFromView"
          />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore, type PurchaseDoc } from '@/stores/purchases'
import {
  Download,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Building2,
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

// Purchase Components (to be created)
import PurchaseDocDetails from '@/components/purchases/PurchaseDocDetails.vue'

const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()

// State
const searchTerm = ref('')
const selectedDocType = ref('')
const selectedSupplier = ref('')
const selectedCurrency = ref('')
const selectedDateRange = ref('')
const showViewDocDialog = ref(false)
const selectedDoc = ref<PurchaseDoc | null>(null)

// Computed
const filteredDocs = computed(() => {
  let docs = purchasesStore.activePurchaseDocs

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    docs = docs.filter(doc =>
      doc.series?.toLowerCase().includes(term) ||
      doc.number?.toLowerCase().includes(term) ||
      doc.supplier_name?.toLowerCase().includes(term)
    )
  }

  // Filter by document type
  if (selectedDocType.value) {
    docs = docs.filter(doc => doc.doc_type === selectedDocType.value)
  }

  // Filter by supplier
  if (selectedSupplier.value) {
    docs = docs.filter(doc => doc.supplier_id === selectedSupplier.value)
  }

  // Filter by currency
  if (selectedCurrency.value) {
    docs = docs.filter(doc => doc.currency_code === selectedCurrency.value)
  }

  // Filter by date range
  if (selectedDateRange.value) {
    const today = new Date()
    const docDate = (doc: PurchaseDoc) => new Date(doc.issue_date)

    switch (selectedDateRange.value) {
      case 'today':
        docs = docs.filter(doc =>
          docDate(doc).toDateString() === today.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        docs = docs.filter(doc => docDate(doc) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        docs = docs.filter(doc => docDate(doc) >= monthAgo)
        break
      case 'year':
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        docs = docs.filter(doc => docDate(doc) >= yearAgo)
        break
    }
  }

  return docs
})

const totalValuePEN = computed(() => {
  return filteredDocs.value.reduce((total, doc) => {
    return total + calculateTotalDocLocal(doc)
  }, 0)
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

const uniqueSuppliers = computed(() => {
  const supplierIds = new Set(filteredDocs.value.map(doc => doc.supplier_id))
  return supplierIds.size
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
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

const calculateTotalDoc = (doc: PurchaseDoc) => {
  return doc.total_ope_gravadas + doc.total_ope_exoneradas + doc.total_ope_inafectas
}

const calculateTotalDocLocal = (doc: PurchaseDoc) => {
  return doc.total_ope_gravadas_local + doc.total_ope_exoneradas_local
}

const viewDoc = (doc: PurchaseDoc) => {
  selectedDoc.value = doc
  purchasesStore.selectPurchaseDoc(doc)
  showViewDocDialog.value = true
}

const editDoc = (doc: PurchaseDoc) => {
  selectedDoc.value = doc
  purchasesStore.selectPurchaseDoc(doc)
  // TODO: Open edit dialog
}

const showDocActions = (doc: PurchaseDoc) => {
  // TODO: Show context menu with actions
  console.log('Show actions for doc:', doc)
}


const handleEditFromView = (doc: PurchaseDoc) => {
  showViewDocDialog.value = false
  editDoc(doc)
}

const exportDocs = () => {
  // TODO: Implement bulk export logic
  console.log('Export all docs')
}

const refreshData = async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      purchasesStore.fetchPurchaseDocs(companyStore.selectedCompany.id),
      purchasesStore.fetchSuppliers(companyStore.selectedCompany.id)
    ])
  }
}

// Lifecycle
onMounted(async () => {
  console.log('PurchaseDocsView onMounted - selectedCompany:', companyStore.selectedCompany)

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
