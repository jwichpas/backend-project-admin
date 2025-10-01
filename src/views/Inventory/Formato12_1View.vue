<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Formato 12.1 - SUNAT</h1>
        <p class="text-muted-foreground">
          Registro del Inventario Permanente en Unidades Físicas
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportToExcel">
          <Download class="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
        <Button variant="outline" size="sm" @click="printReport">
          <Printer class="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>
    </div>

    <!-- Company Info Card -->
    <Card v-if="companiesStore.currentCompany">
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <p class="text-sm text-muted-foreground">Denominación del Libro</p>
            <p class="font-medium">REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">RUC</p>
            <p class="font-medium">{{ companiesStore.currentCompany.ruc }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Razón Social</p>
            <p class="font-medium">{{ companiesStore.currentCompany.legal_name }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-sm font-medium">Buscar Producto</label>
            <div class="relative mt-1">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="productSearch"
                placeholder="Buscar por SKU o nombre..."
                class="pl-10"
                @input="filterProducts"
              />
            </div>
            <!-- Product suggestions dropdown -->
            <div v-if="productSearch && filteredProductsList.length > 0" class="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-input bg-popover shadow-lg">
              <div
                v-for="product in filteredProductsList.slice(0, 10)"
                :key="product.id"
                @click="selectProduct(product)"
                class="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
              >
                <span class="font-medium">{{ product.sku }}</span> - {{ product.name }}
              </div>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Fecha Desde</label>
            <Input
              v-model="dateFrom"
              type="date"
              @change="loadData"
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Fecha Hasta</label>
            <Input
              v-model="dateTo"
              type="date"
              @change="loadData"
              class="mt-1"
            />
          </div>
        </div>
        <!-- Selected product badge -->
        <div v-if="selectedProductId" class="mt-4 flex items-center gap-2">
          <Badge variant="secondary" class="text-sm py-2 px-3">
            Producto: {{ selectedProductName }}
            <button @click="clearProduct" class="ml-2 hover:text-destructive">
              <X class="h-3 w-3" />
            </button>
          </Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Data Tables Grouped by Product -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin mr-2" />
      <span class="text-muted-foreground">Cargando datos...</span>
    </div>

    <div v-else-if="groupedByProduct.length === 0" class="text-center py-12">
      <Package class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p class="text-muted-foreground">No se encontraron movimientos para los filtros seleccionados</p>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="group in groupedByProduct" :key="group.product_id">
        <CardHeader
          @click="toggleProductExpand(group.product_id)"
          class="cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ChevronDown
                class="h-5 w-5 transition-transform"
                :class="{ 'rotate-180': !expandedProducts.has(group.product_id) }"
              />
              <div>
                <CardTitle class="text-lg">{{ group.product_name }}</CardTitle>
                <p class="text-sm text-muted-foreground mt-1">SKU: {{ group.product_sku }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <div class="text-right">
                <p class="text-muted-foreground">Movimientos</p>
                <p class="font-bold">{{ group.items.length }}</p>
              </div>
              <div class="text-right">
                <p class="text-muted-foreground">Saldo Final</p>
                <p class="font-bold">{{ formatNumber(group.items[group.items.length - 1]?.saldo_final_unid || 0) }}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent v-if="expandedProducts.has(group.product_id)" class="p-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Tipo Doc</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo Operación</TableHead>
                  <TableHead class="text-right">Entradas (Unid)</TableHead>
                  <TableHead class="text-right">Salidas (Unid)</TableHead>
                  <TableHead class="text-right">Saldo Final (Unid)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in group.items" :key="item.id">
                  <TableCell>{{ formatDate(item.fecha_emision) }}</TableCell>
                  <TableCell>
                    <Badge variant="outline" class="text-xs">{{ getDocTypeDescription(item.tipo_doc) }}</Badge>
                  </TableCell>
                  <TableCell>{{ item.serie_doc || '-' }}</TableCell>
                  <TableCell>{{ item.numero_doc || '-' }}</TableCell>
                  <TableCell>
                    <Badge :variant="getOperationTypeVariant(item.tipo_operacion)" class="text-xs">
                      {{ getOperationTypeDescription(item.tipo_operacion) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right font-medium text-green-600">
                    {{ formatNumber(item.entradas_unid) }}
                  </TableCell>
                  <TableCell class="text-right font-medium text-red-600">
                    {{ formatNumber(item.salidas_unid) }}
                  </TableCell>
                  <TableCell class="text-right font-bold">
                    {{ formatNumber(item.saldo_final_unid) }}
                  </TableCell>
                </TableRow>
                <!-- Product Totals Row -->
                <TableRow class="bg-muted/50 font-bold">
                  <TableCell colspan="5" class="text-right">TOTALES DEL PRODUCTO:</TableCell>
                  <TableCell class="text-right text-green-600">
                    {{ formatNumber(group.totals.entradas) }}
                  </TableCell>
                  <TableCell class="text-right text-red-600">
                    {{ formatNumber(group.totals.salidas) }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ formatNumber(group.totals.saldo) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useProductsStore } from '@/stores/products'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import Badge from '@/components/ui/Badge.vue'
import { Download, Printer, Loader2, Search, X, ChevronDown, Package } from 'lucide-vue-next'

const companiesStore = useCompaniesStore()
const productsStore = useProductsStore()

interface Formato12_1Item {
  id: string
  company_id: string
  product_id: string
  fecha_emision: string
  tipo_doc: string
  serie_doc: string
  numero_doc: string
  tipo_operacion: string
  entradas_unid: number
  salidas_unid: number
  saldo_final_unid: number
}

interface ProductGroup {
  product_id: string
  product_name: string
  product_sku: string
  items: Formato12_1Item[]
  totals: {
    entradas: number
    salidas: number
    saldo: number
  }
}

const loading = ref(false)
const items = ref<Formato12_1Item[]>([])
const selectedProductId = ref('')
const selectedProductName = ref('')
const productSearch = ref('')
const filteredProductsList = ref<any[]>([])
const expandedProducts = ref<Set<string>>(new Set())
const dateFrom = ref('')
const dateTo = ref('')

// SUNAT catalogs
const documentTypes = ref<Map<string, string>>(new Map())
const operationTypes = ref<Map<string, string>>(new Map())

// Group items by product
const groupedByProduct = computed(() => {
  const groups: Record<string, ProductGroup> = {}

  items.value.forEach(item => {
    if (!groups[item.product_id]) {
      // Get product info
      const product = productsStore.products.find(p => p.id === item.product_id)

      groups[item.product_id] = {
        product_id: item.product_id,
        product_name: product?.name || 'Producto desconocido',
        product_sku: product?.sku || '-',
        items: [],
        totals: { entradas: 0, salidas: 0, saldo: 0 }
      }
    }

    groups[item.product_id].items.push(item)
    groups[item.product_id].totals.entradas += item.entradas_unid || 0
    groups[item.product_id].totals.salidas += item.salidas_unid || 0
  })

  // Set final balance for each group
  Object.values(groups).forEach(group => {
    if (group.items.length > 0) {
      group.totals.saldo = group.items[group.items.length - 1].saldo_final_unid || 0
    }
  })

  return Object.values(groups)
})

// Filter products for search
const filterProducts = () => {
  if (!productSearch.value || productSearch.value.length < 2) {
    filteredProductsList.value = []
    return
  }

  const search = productSearch.value.toLowerCase()
  filteredProductsList.value = productsStore.products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.sku.toLowerCase().includes(search)
  )
}

// Select product from dropdown
const selectProduct = (product: any) => {
  selectedProductId.value = product.id
  selectedProductName.value = `${product.sku} - ${product.name}`
  productSearch.value = ''
  filteredProductsList.value = []
  loadData()
}

// Clear product filter
const clearProduct = () => {
  selectedProductId.value = ''
  selectedProductName.value = ''
  productSearch.value = ''
  filteredProductsList.value = []
  loadData()
}

// Toggle product expansion
const toggleProductExpand = (productId: string) => {
  if (expandedProducts.value.has(productId)) {
    expandedProducts.value.delete(productId)
  } else {
    expandedProducts.value.add(productId)
  }
}

// Load data from view
const loadData = async () => {
  if (!companiesStore.currentCompany) return

  loading.value = true
  try {
    let query = supabase
      .from('v_sunat_formato_12_1')
      .select('*')
      .eq('company_id', companiesStore.currentCompany.id)

    if (selectedProductId.value) {
      query = query.eq('product_id', selectedProductId.value)
    }

    if (dateFrom.value) {
      query = query.gte('fecha_emision', dateFrom.value)
    }

    if (dateTo.value) {
      query = query.lte('fecha_emision', dateTo.value)
    }

    const { data, error } = await query.order('product_id').order('fecha_emision')

    if (error) throw error

    items.value = data || []
  } catch (error) {
    console.error('Error loading Formato 12.1:', error)
  } finally {
    loading.value = false
  }
}

// Load SUNAT catalogs
const loadSunatCatalogs = async () => {
  try {
    // Load document types
    const { data: docTypes, error: docError } = await supabase.rpc('get_sunat_document_types')
    if (!docError && docTypes) {
      docTypes.forEach((item: any) => {
        documentTypes.value.set(item.code, item.descripcion)
      })
    }

    // Load operation types (Tabla 12)
    const { data: opTypes, error: opError } = await supabase.rpc('get_sunat_operation_types_v3')
    if (!opError && opTypes) {
      opTypes.forEach((item: any) => {
        operationTypes.value.set(item.code, item.descripcion)
      })
    }
  } catch (error) {
    console.error('Error loading SUNAT catalogs:', error)
  }
}

// Get document type description
const getDocTypeDescription = (code: string) => {
  if (!code) return '-'
  const desc = documentTypes.value.get(code)
  return desc ? `${code} - ${desc}` : code
}

// Get operation type description
const getOperationTypeDescription = (code: string) => {
  if (!code) return '-'
  const desc = operationTypes.value.get(code)
  return desc ? `${code} - ${desc}` : code
}

// Format helpers
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-PE')
}

const formatNumber = (value: number) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const getOperationTypeVariant = (type: string) => {
  const variants: Record<string, any> = {
    '01': 'default', // Venta
    '02': 'destructive', // Compra
    '10': 'secondary', // Traslado
    '16': 'default', // Entrada por ajuste
    '21': 'destructive' // Salida por ajuste
  }
  return variants[type] || 'outline'
}

// Export functions
const exportToExcel = () => {
  // TODO: Implement Excel export
  console.log('Export to Excel')
}

const printReport = () => {
  window.print()
}

// Initialize
onMounted(async () => {
  if (companiesStore.currentCompany) {
    // Set default dates (current month)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    dateFrom.value = firstDay.toISOString().split('T')[0]
    dateTo.value = lastDay.toISOString().split('T')[0]

    // Load SUNAT catalogs, products and data in parallel
    await Promise.all([
      loadSunatCatalogs(),
      productsStore.fetchProducts(companiesStore.currentCompany.id),
      loadData()
    ])

    // Auto-expand if only one product
    if (groupedByProduct.value.length === 1) {
      expandedProducts.value.add(groupedByProduct.value[0].product_id)
    }
  }
})
</script>
