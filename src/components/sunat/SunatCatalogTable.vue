<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ catalog.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ catalog.description }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          @click="refresh"
          variant="outline"
          size="sm"
          :disabled="loading"
          class="text-gray-700 dark:text-gray-300"
        >
          <RotateCcw class="h-4 w-4 mr-2" />
          Actualizar
        </Button>
        <Button
          @click="exportToCsv"
          variant="outline"
          size="sm"
          :disabled="loading || items.length === 0"
          class="text-gray-700 dark:text-gray-300"
        >
          <Download class="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          v-model="searchTerm"
          placeholder="Buscar por código o descripción..."
          class="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Total: {{ filteredItems.length }} registros
        </span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ScrollArea class="h-96">
        <Table>
          <TableHeader>
            <TableRow class="border-b border-gray-200 dark:border-gray-700">
              <TableHead class="w-32 text-gray-900 dark:text-white font-semibold">
                Código
              </TableHead>
              <TableHead class="text-gray-900 dark:text-white font-semibold">
                Descripción
              </TableHead>
              <TableHead v-if="catalogKey === 'ubigeo'" class="text-gray-900 dark:text-white font-semibold">
                Departamento
              </TableHead>
              <TableHead v-if="catalogKey === 'ubigeo'" class="text-gray-900 dark:text-white font-semibold">
                Provincia
              </TableHead>
              <TableHead v-if="catalogKey === 'ubigeo'" class="text-gray-900 dark:text-white font-semibold">
                Distrito
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="loading">
              <TableRow v-for="i in 5" :key="`skeleton-${i}`">
                <TableCell>
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </TableCell>
                <TableCell v-if="catalogKey === 'ubigeo'">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </TableCell>
                <TableCell v-if="catalogKey === 'ubigeo'">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </TableCell>
                <TableCell v-if="catalogKey === 'ubigeo'">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="filteredItems.length === 0">
              <TableRow>
                <TableCell :colspan="catalogKey === 'ubigeo' ? 5 : 2" class="text-center py-8">
                  <div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Database class="h-8 w-8" />
                    <p class="text-sm">
                      {{ searchTerm ? 'No se encontraron resultados' : 'No hay datos disponibles' }}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow
                v-for="item in paginatedItems"
                :key="item.code"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <TableCell class="font-mono text-sm text-gray-900 dark:text-white">
                  {{ item.code }}
                </TableCell>
                <TableCell class="text-gray-900 dark:text-white">
                  {{ item.descripcion }}
                </TableCell>
                <template v-if="catalogKey === 'ubigeo'">
                  <TableCell class="text-gray-900 dark:text-white">
                    {{ (item as UbigeoItem).departamento }}
                  </TableCell>
                  <TableCell class="text-gray-900 dark:text-white">
                    {{ (item as UbigeoItem).provincia }}
                  </TableCell>
                  <TableCell class="text-gray-900 dark:text-white">
                    {{ (item as UbigeoItem).distrito }}
                  </TableCell>
                </template>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </ScrollArea>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between" v-if="totalPages > 1">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} a 
        {{ Math.min(currentPage * itemsPerPage, filteredItems.length) }} de 
        {{ filteredItems.length }} resultados
      </p>
      <div class="flex items-center gap-2">
        <Button
          @click="currentPage--"
          :disabled="currentPage === 1"
          variant="outline"
          size="sm"
          class="text-gray-700 dark:text-gray-300"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <Button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          variant="outline"
          size="sm"
          class="text-gray-700 dark:text-gray-300"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSunatStore } from '@/stores/sunat'
import type { SunatCatalogItem, UbigeoItem, SunatCatalogKey } from '@/services/sunatService'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'
import { Search, RotateCcw, Download, Database, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  catalogKey: SunatCatalogKey
}

const props = defineProps<Props>()
const sunatStore = useSunatStore()

// State
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 50

// Computed
const catalog = computed(() => sunatStore.SUNAT_CATALOGS[props.catalogKey])
const loading = computed(() => sunatStore.isLoading(props.catalogKey))

const items = computed(() => {
  const stateKey = getStateKey(props.catalogKey)
  return sunatStore.state[stateKey] as (SunatCatalogItem | UbigeoItem)[]
})

const filteredItems = computed(() => {
  if (!searchTerm.value) return items.value
  
  const term = searchTerm.value.toLowerCase()
  return items.value.filter(item => {
    if (props.catalogKey === 'ubigeo') {
      const ubigeoItem = item as UbigeoItem
      return (
        ubigeoItem.code.toLowerCase().includes(term) ||
        ubigeoItem.departamento?.toLowerCase().includes(term) ||
        ubigeoItem.provincia?.toLowerCase().includes(term) ||
        ubigeoItem.distrito?.toLowerCase().includes(term)
      )
    }
    return (
      item.code.toLowerCase().includes(term) ||
      item.descripcion.toLowerCase().includes(term)
    )
  })
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredItems.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))

// Helper function to map catalog key to state key
function getStateKey(catalogKey: SunatCatalogKey): keyof typeof sunatStore.state {
  const keyMap = {
    'cat_01_tipo_documento': 'documentTypes',
    'cat_02_monedas': 'currencies',
    'cat_03_unidades_medida': 'measurementUnits',
    'cat_05_tipos_tributo': 'taxTypes',
    'cat_06_doc_identidad': 'identityDocumentTypes',
    'cat_07_afect_igv': 'igvAffectations',
    'cat_12_tipo_operacion': 'operationTypes',
    'cat_16_tipo_precio_unitario': 'unitPriceTypes',
    'cat_17_tipo_operacion': 'operationTypesV2',
    'cat_18_modalidad_traslado': 'transferModalities',
    'cat_20_motivo_traslado': 'transferReasons',
    'cat_51_tipo_factura': 'invoiceTypes',
    'cat_52_codigo_leyendas': 'legendCodes',
    'cat_54_codigo_bb_ss': 'goodsServicesCodes',
    'tab_01_medio_pago': 'paymentMethods',
    'tab_03_entidad_financiera': 'financialEntities',
    'tab_05_tipo_existencia': 'existenceTypes',
    'tab_11_aduana': 'customs',
    'tab_12_tipo_operacion': 'operationTypesV3',
    'ubigeo': 'ubigeo'
  } as const
  
  return keyMap[catalogKey]
}

// Methods
async function loadData(forceReload = false) {
  try {
    switch (props.catalogKey) {
      case 'cat_01_tipo_documento':
        await sunatStore.loadDocumentTypes(forceReload)
        break
      case 'cat_02_monedas':
        await sunatStore.loadCurrencies(forceReload)
        break
      case 'cat_03_unidades_medida':
        await sunatStore.loadMeasurementUnits(forceReload)
        break
      case 'cat_05_tipos_tributo':
        await sunatStore.loadTaxTypes(forceReload)
        break
      case 'cat_06_doc_identidad':
        await sunatStore.loadIdentityDocumentTypes(forceReload)
        break
      case 'cat_07_afect_igv':
        await sunatStore.loadIgvAffectations(forceReload)
        break
      case 'cat_12_tipo_operacion':
        await sunatStore.loadOperationTypes(forceReload)
        break
      case 'cat_16_tipo_precio_unitario':
        await sunatStore.loadUnitPriceTypes(forceReload)
        break
      case 'cat_17_tipo_operacion':
        await sunatStore.loadOperationTypesV2(forceReload)
        break
      case 'cat_18_modalidad_traslado':
        await sunatStore.loadTransferModalities(forceReload)
        break
      case 'cat_20_motivo_traslado':
        await sunatStore.loadTransferReasons(forceReload)
        break
      case 'cat_51_tipo_factura':
        await sunatStore.loadInvoiceTypes(forceReload)
        break
      case 'cat_52_codigo_leyendas':
        await sunatStore.loadLegendCodes(forceReload)
        break
      case 'cat_54_codigo_bb_ss':
        await sunatStore.loadGoodsServicesCodes(forceReload)
        break
      case 'tab_01_medio_pago':
        await sunatStore.loadPaymentMethods(forceReload)
        break
      case 'tab_03_entidad_financiera':
        await sunatStore.loadFinancialEntities(forceReload)
        break
      case 'tab_05_tipo_existencia':
        await sunatStore.loadExistenceTypes(forceReload)
        break
      case 'tab_11_aduana':
        await sunatStore.loadCustoms(forceReload)
        break
      case 'tab_12_tipo_operacion':
        await sunatStore.loadOperationTypesV3(forceReload)
        break
      case 'ubigeo':
        await sunatStore.searchUbigeo()
        break
    }
  } catch (error) {
    console.error('Error loading catalog data:', error)
  }
}

function refresh() {
  currentPage.value = 1
  loadData(true)
}

function exportToCsv() {
  const headers = props.catalogKey === 'ubigeo' 
    ? ['Código', 'Descripción', 'Departamento', 'Provincia', 'Distrito']
    : ['Código', 'Descripción']
  
  const csvContent = [
    headers.join(','),
    ...filteredItems.value.map(item => {
      if (props.catalogKey === 'ubigeo') {
        const ubigeoItem = item as UbigeoItem
        return [
          `"${ubigeoItem.code}"`,
          `"${ubigeoItem.descripcion || ''}"`,
          `"${ubigeoItem.departamento}"`,
          `"${ubigeoItem.provincia}"`,
          `"${ubigeoItem.distrito}"`
        ].join(',')
      }
      return [`"${item.code}"`, `"${item.descripcion}"`].join(',')
    })
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `sunat_${props.catalogKey}.csv`
  link.click()
}

// Watch for search term changes to reset pagination
watch(searchTerm, () => {
  currentPage.value = 1
})

// Load data on mount
onMounted(() => {
  loadData()
})
</script>