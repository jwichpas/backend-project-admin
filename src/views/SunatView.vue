<template>
  <div class="h-full bg-gray-50 dark:bg-gray-900">
    <div class="p-4 sm:p-6 lg:p-8 space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Catálogos SUNAT
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Consulta y administra los catálogos y tablas oficiales de SUNAT para facturación electrónica
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              @click="loadEssentialCatalogs"
              variant="outline"
              :disabled="isLoadingEssentials"
              class="text-gray-700 dark:text-gray-300"
            >
              <RotateCcw :class="['h-4 w-4 mr-2', { 'animate-spin': isLoadingEssentials }]" />
              Cargar Principales
            </Button>
            <Button
              @click="clearCache"
              variant="outline"
              class="text-gray-700 dark:text-gray-300"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Limpiar Cache
            </Button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Database class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Catálogos</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ catalogsCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Table class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Tablas</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ tablesCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Cargados</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ loadedCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <MapPin class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Ubicaciones</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ ubigeoCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div v-if="!selectedCatalog" class="p-6">
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Selecciona un Catálogo
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Elige el catálogo o tabla SUNAT que deseas consultar
            </p>
          </div>
          <SunatCatalogSelector @select="selectCatalog" />
        </div>

        <div v-else>
          <!-- Catalog Header -->
          <div class="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Button
                  @click="selectedCatalog = null"
                  variant="ghost"
                  size="sm"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft class="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ SUNAT_CATALOGS[selectedCatalog].name }}
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Catálogo: {{ selectedCatalog }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  Activo
                </span>
              </div>
            </div>
          </div>

          <!-- Catalog Table -->
          <div class="p-6">
            <SunatCatalogTable :catalog-key="selectedCatalog" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSunatStore } from '@/stores/sunat'
import { SUNAT_CATALOGS, type SunatCatalogKey } from '@/services/sunatService'
import Button from '@/components/ui/Button.vue'
import SunatCatalogSelector from '@/components/sunat/SunatCatalogSelector.vue'
import SunatCatalogTable from '@/components/sunat/SunatCatalogTable.vue'
import {
  Database,
  Table,
  Clock,
  MapPin,
  RotateCcw,
  Trash2,
  ArrowLeft
} from 'lucide-vue-next'

const sunatStore = useSunatStore()
const selectedCatalog = ref<SunatCatalogKey | null>(null)
const isLoadingEssentials = ref(false)

// Computed
const catalogsCount = computed(() => {
  return Object.keys(SUNAT_CATALOGS).filter(key => key.startsWith('cat_')).length
})

const tablesCount = computed(() => {
  return Object.keys(SUNAT_CATALOGS).filter(key => key.startsWith('tab_')).length
})

const loadedCount = computed(() => {
  let count = 0
  Object.keys(SUNAT_CATALOGS).forEach(key => {
    const stateKey = getStateKey(key as SunatCatalogKey)
    if (sunatStore.state[stateKey]?.length > 0) {
      count++
    }
  })
  return count
})

const ubigeoCount = computed(() => {
  return sunatStore.state.ubigeo?.length || 0
})

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
function selectCatalog(catalogKey: SunatCatalogKey) {
  selectedCatalog.value = catalogKey
}

async function loadEssentialCatalogs() {
  isLoadingEssentials.value = true
  try {
    await sunatStore.loadEssentialCatalogs(true)
  } catch (error) {
    console.error('Error loading essential catalogs:', error)
  } finally {
    isLoadingEssentials.value = false
  }
}

function clearCache() {
  sunatStore.clearCache()
  // Also clear the state
  Object.keys(sunatStore.state).forEach(key => {
    if (key !== 'loading' && key !== 'lastUpdated' && key !== 'searchResults' && key !== 'searchLoading') {
      sunatStore.state[key as keyof typeof sunatStore.state] = []
    }
  })
}

// Load essential catalogs on mount
onMounted(() => {
  loadEssentialCatalogs()
})
</script>