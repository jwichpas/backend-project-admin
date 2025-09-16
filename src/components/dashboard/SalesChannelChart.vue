<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Canales de Venta</h3>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedMetric"
          class="text-xs border border-input rounded px-2 py-1 bg-background"
        >
          <option value="sales">Ventas</option>
          <option value="transactions">Transacciones</option>
          <option value="customers">Clientes</option>
        </select>
        <BarChart3 class="h-5 w-5 text-muted-foreground" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Pie Chart -->
      <ApexPieChart
        :series="pieSeries"
        :labels="pieLabels"
        :height="300"
        :colors="chartColors"
        :theme="theme"
        :value-formatter="valueFormatter"
        type="donut"
      />

      <!-- Bar Chart -->
      <ApexBarChart
        :series="barSeries"
        :categories="barCategories"
        :height="300"
        :colors="chartColors"
        :y-axis-formatter="valueFormatter"
        :theme="theme"
        type="column"
      />
    </div>

    <!-- Summary Stats -->
    <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
      <div class="text-center">
        <p class="text-muted-foreground">Canales Activos</p>
        <p class="font-bold text-lg">{{ activeChannels }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Canal Principal</p>
        <p class="font-bold text-lg">{{ topChannel?.label || 'N/A' }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Concentración</p>
        <p class="font-bold text-lg">{{ concentration.toFixed(1) }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BarChart3 } from 'lucide-vue-next'
import ApexPieChart from '@/components/charts/ApexPieChart.vue'
import ApexBarChart from '@/components/charts/ApexBarChart.vue'
import type { SalesChannelMonthly } from '@/stores/salesDashboard'

interface Props {
  channels: SalesChannelMonthly[]
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light'
})

const selectedMetric = ref<'sales' | 'transactions' | 'customers'>('sales')

const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

// Document type mapping
const docTypeNames: Record<string, string> = {
  '01': 'Facturas',
  '03': 'Boletas',
  '07': 'Notas de Crédito',
  '08': 'Notas de Débito',
  '09': 'Guías de Remisión',
  '20': 'Comprobantes de Retención',
  '40': 'Comprobantes de Percepción'
}

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatNumber = (value: number) => {
  return value.toLocaleString('es-PE')
}

// Aggregate data by document type
const aggregatedData = computed(() => {
  const aggregation = new Map()

  props.channels.forEach(channel => {
    const key = channel.doc_type
    const name = docTypeNames[key] || `Tipo ${key}`

    if (!aggregation.has(key)) {
      aggregation.set(key, {
        doc_type: key,
        label: name,
        total_sales: 0,
        transaction_count: 0,
        customer_count: 0
      })
    }

    const existing = aggregation.get(key)
    existing.total_sales += channel.total_sales_local
    existing.transaction_count += channel.transaction_count
    existing.customer_count += channel.unique_customers
  })

  return Array.from(aggregation.values())
    .sort((a, b) => b.total_sales - a.total_sales)
})

const valueFormatter = computed(() => {
  switch (selectedMetric.value) {
    case 'sales':
      return formatCurrency
    case 'transactions':
    case 'customers':
      return formatNumber
    default:
      return formatNumber
  }
})

const pieSeries = computed(() => {
  if (!aggregatedData.value || aggregatedData.value.length === 0) {
    return []
  }

  return aggregatedData.value.map(channel => {
    switch (selectedMetric.value) {
      case 'sales':
        return channel.total_sales || 0
      case 'transactions':
        return channel.transaction_count || 0
      case 'customers':
        return channel.customer_count || 0
      default:
        return channel.total_sales || 0
    }
  })
})

const pieLabels = computed(() => {
  if (!aggregatedData.value || aggregatedData.value.length === 0) {
    return []
  }
  return aggregatedData.value.map(channel => channel.label)
})

const barSeries = computed(() => [
  {
    name: selectedMetric.value === 'sales' ? 'Ventas' :
          selectedMetric.value === 'transactions' ? 'Transacciones' : 'Clientes',
    data: pieSeries.value
  }
])

const barCategories = computed(() => pieLabels.value)

const activeChannels = computed(() => aggregatedData.value.length)

const topChannel = computed(() => {
  const top = aggregatedData.value[0]
  return top ? { label: top.label, value: pieSeries.value[0] } : null
})

const concentration = computed(() => {
  const total = pieSeries.value.reduce((sum, value) => sum + value, 0)
  const topValue = pieSeries.value[0] || 0
  return total > 0 ? (topValue / total) * 100 : 0
})
</script>