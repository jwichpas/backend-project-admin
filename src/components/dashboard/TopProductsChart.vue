<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Top Productos</h3>
      <div class="flex items-center gap-2">
        <select
          v-model="chartType"
          class="text-xs border border-input rounded px-2 py-1 bg-background"
        >
          <option value="value">Por Valor</option>
          <option value="quantity">Por Cantidad</option>
        </select>
        <Package class="h-5 w-5 text-muted-foreground" />
      </div>
    </div>

    <div v-if="sortedProducts.length === 0" class="flex items-center justify-center h-96 text-muted-foreground">
      <div class="text-center">
        <Package class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de productos disponibles</p>
        <p class="text-sm">Los productos más vendidos aparecerán aquí</p>
      </div>
    </div>

    <ApexBarChart
      v-else
      :series="chartSeries"
      :categories="chartCategories"
      :height="400"
      :colors="['#3B82F6']"
      :y-axis-formatter="yAxisFormatter"
      :theme="theme"
      type="bar"
      :horizontal="true"
      :data-labels="true"
    />

    <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
      <div class="text-center">
        <p class="text-muted-foreground">Productos Únicos</p>
        <p class="font-bold text-lg">{{ uniqueProducts }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">{{ chartType === 'value' ? 'Valor Total' : 'Cantidad Total' }}</p>
        <p class="font-bold text-lg">{{ totalValue }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Package } from 'lucide-vue-next'
import ApexBarChart from '@/components/charts/ApexBarChart.vue'
import type { SalesProductStats } from '@/stores/salesDashboard'

interface Props {
  products: SalesProductStats[]
  theme?: 'light' | 'dark'
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  maxItems: 10
})

const chartType = ref<'value' | 'quantity'>('value')

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatQuantity = (value: number) => {
  return `${value.toLocaleString('es-PE')} uds`
}

const sortedProducts = computed(() => {
  const sorted = [...props.products].sort((a, b) => {
    if (chartType.value === 'value') {
      return b.total_sales_value - a.total_sales_value
    } else {
      return b.total_quantity_sold - a.total_quantity_sold
    }
  })

  return sorted.slice(0, props.maxItems)
})

const chartSeries = computed(() => {
  if (!sortedProducts.value || sortedProducts.value.length === 0) {
    return [{
      name: chartType.value === 'value' ? 'Valor de Ventas' : 'Cantidad Vendida',
      data: []
    }]
  }

  return [{
    name: chartType.value === 'value' ? 'Valor de Ventas' : 'Cantidad Vendida',
    data: sortedProducts.value.map(product =>
      chartType.value === 'value'
        ? (product.total_sales_value || 0)
        : (product.total_quantity_sold || 0)
    )
  }]
})

const chartCategories = computed(() => {
  if (!sortedProducts.value || sortedProducts.value.length === 0) {
    return []
  }

  return sortedProducts.value.map(product => {
    const name = product.product_name || 'Sin nombre'
    return name.length > 20 ? `${name.substring(0, 20)}...` : name
  })
})

const yAxisFormatter = computed(() => {
  return chartType.value === 'value' ? formatCurrency : formatQuantity
})

const uniqueProducts = computed(() => props.products.length)

const totalValue = computed(() => {
  const total = props.products.reduce((sum, product) => {
    return sum + (chartType.value === 'value' ? product.total_sales_value : product.total_quantity_sold)
  }, 0)

  return chartType.value === 'value' ? formatCurrency(total) : formatQuantity(total)
})
</script>