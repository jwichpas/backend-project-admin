<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div
      v-for="(catalog, key) in SUNAT_CATALOGS"
      :key="key"
      @click="$emit('select', key as SunatCatalogKey)"
      class="group cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <component
              :is="getCatalogIcon(key as SunatCatalogKey)"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {{ catalog.name }}
          </h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {{ catalog.description }}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Disponible
              </span>
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500">
              Código máx: {{ catalog.codeMaxLength }} dígitos
            </div>
          </div>
        </div>
      </div>
      <div class="mt-3 flex items-center justify-between">
        <div class="flex items-center gap-1">
          <Database class="w-4 h-4 text-gray-400" />
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ getCatalogType(key as SunatCatalogKey) }}
          </span>
        </div>
        <ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SUNAT_CATALOGS, type SunatCatalogKey } from '@/services/sunatService'
import {
  Database,
  FileText,
  Banknote,
  Scale,
  Receipt,
  CreditCard,
  Truck,
  Building2,
  MapPin,
  Coins,
  Package,
  Factory,
  ChevronRight
} from 'lucide-vue-next'

defineEmits<{
  select: [catalogKey: SunatCatalogKey]
}>()

function getCatalogIcon(catalogKey: SunatCatalogKey) {
  const iconMap = {
    'cat_01_tipo_documento': FileText,
    'cat_02_monedas': Coins,
    'cat_03_unidades_medida': Scale,
    'cat_05_tipos_tributo': Receipt,
    'cat_06_doc_identidad': FileText,
    'cat_07_afect_igv': Receipt,
    'cat_12_tipo_operacion': Building2,
    'cat_16_tipo_precio_unitario': Banknote,
    'cat_17_tipo_operacion': Building2,
    'cat_18_modalidad_traslado': Truck,
    'cat_20_motivo_traslado': Truck,
    'cat_51_tipo_factura': Receipt,
    'cat_52_codigo_leyendas': FileText,
    'cat_54_codigo_bb_ss': Package,
    'tab_01_medio_pago': CreditCard,
    'tab_03_entidad_financiera': Building2,
    'tab_05_tipo_existencia': Package,
    'tab_11_aduana': Factory,
    'tab_12_tipo_operacion': Building2,
    'ubigeo': MapPin
  }
  
  return iconMap[catalogKey] || Database
}

function getCatalogType(catalogKey: SunatCatalogKey): string {
  if (catalogKey.startsWith('cat_')) {
    return 'Catálogo'
  } else if (catalogKey.startsWith('tab_')) {
    return 'Tabla'
  } else if (catalogKey === 'ubigeo') {
    return 'Ubicación'
  }
  return 'Datos'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>