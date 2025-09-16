<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Análisis de Rentabilidad</h3>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedView"
          class="text-xs border border-input rounded px-2 py-1 bg-background"
        >
          <option value="trend">Tendencia</option>
          <option value="comparison">Comparación</option>
        </select>
        <TrendingUp class="h-5 w-5 text-muted-foreground" />
      </div>
    </div>

    <!-- Trend View -->
    <div v-if="selectedView === 'trend'">
      <ApexLineChart
        :series="trendSeries"
        :categories="trendCategories"
        :height="400"
        :colors="['#10B981', '#3B82F6', '#F59E0B']"
        :y-axis-formatter="formatCurrency"
        :x-axis-formatter="formatMonth"
        :theme="theme"
        type="area"
        :stroke-width="3"
      />
    </div>

    <!-- Comparison View -->
    <div v-else>
      <ApexBarChart
        :series="comparisonSeries"
        :categories="comparisonCategories"
        :height="400"
        :colors="['#10B981', '#EF4444', '#3B82F6']"
        :y-axis-formatter="formatCurrency"
        :theme="theme"
        type="column"
        :stacked="false"
      />
    </div>

    <!-- Key Metrics -->
    <div class="mt-6 grid grid-cols-4 gap-4 text-sm">
      <div class="text-center">
        <p class="text-muted-foreground">Margen Bruto Promedio</p>
        <p class="font-bold text-lg" :class="averageMargin >= 20 ? 'text-green-600' : averageMargin >= 10 ? 'text-yellow-600' : 'text-red-600'">
          {{ averageMargin.toFixed(1) }}%
        </p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Mejor Mes</p>
        <p class="font-bold text-lg">{{ formatCurrency(bestMonthProfit) }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Ganancia Total</p>
        <p class="font-bold text-lg">{{ formatCurrency(totalProfit) }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Tendencia</p>
        <p class="font-bold text-lg" :class="profitTrend >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ profitTrend >= 0 ? '+' : '' }}{{ profitTrend.toFixed(1) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import ApexLineChart from '@/components/charts/ApexLineChart.vue'
import ApexBarChart from '@/components/charts/ApexBarChart.vue'
import type { ProfitabilityMetricsMonthly } from '@/stores/salesDashboard'

interface Props {
  metrics: ProfitabilityMetricsMonthly[]
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light'
})

const selectedView = ref<'trend' | 'comparison'>('trend')

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatMonth = (value: string) => {
  // Extract year and month from ISO string to avoid timezone issues
  const dateStr = value.slice(0, 10) // Get YYYY-MM-DD part
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1) // Month is 0-indexed
  return date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
}

const sortedMetrics = computed(() =>
  [...props.metrics].sort((a, b) => {
    // Use string comparison for ISO dates to avoid timezone issues
    return a.sale_month.localeCompare(b.sale_month)
  })
)

// Trend series data
const trendSeries = computed(() => {
  if (!sortedMetrics.value || sortedMetrics.value.length === 0) {
    return [
      { name: 'Ganancia Bruta', data: [] },
      { name: 'Ventas', data: [] },
      { name: 'Costo de Ventas', data: [] }
    ]
  }

  return [
    {
      name: 'Ganancia Bruta',
      data: sortedMetrics.value.map(metric => metric.gross_profit_local || 0)
    },
    {
      name: 'Ventas',
      data: sortedMetrics.value.map(metric => metric.total_sales_local || 0)
    },
    {
      name: 'Costo de Ventas',
      data: sortedMetrics.value.map(metric => metric.cost_of_goods_sold_local || 0)
    }
  ]
})

const trendCategories = computed(() => {
  if (!sortedMetrics.value || sortedMetrics.value.length === 0) {
    return []
  }
  return sortedMetrics.value.map(metric => metric.sale_month)
})

// Comparison series data (last 6 months)
const recentMetrics = computed(() => sortedMetrics.value.slice(-6))

const comparisonSeries = computed(() => {
  if (!recentMetrics.value || recentMetrics.value.length === 0) {
    return [
      { name: 'Ganancia', data: [] },
      { name: 'Costos', data: [] },
      { name: 'Ventas', data: [] }
    ]
  }

  return [
    {
      name: 'Ganancia',
      data: recentMetrics.value.map(metric => metric.gross_profit_local || 0)
    },
    {
      name: 'Costos',
      data: recentMetrics.value.map(metric => metric.cost_of_goods_sold_local || 0)
    },
    {
      name: 'Ventas',
      data: recentMetrics.value.map(metric => metric.total_sales_local || 0)
    }
  ]
})

const comparisonCategories = computed(() => {
  if (!recentMetrics.value || recentMetrics.value.length === 0) {
    return []
  }
  return recentMetrics.value.map(metric => formatMonth(metric.sale_month))
})

// Key metrics calculations
const averageMargin = computed(() => {
  const validMargins = sortedMetrics.value
    .map(metric => metric.gross_margin_percentage_local)
    .filter(margin => margin !== null && !isNaN(margin))

  return validMargins.length > 0
    ? validMargins.reduce((sum, margin) => sum + margin, 0) / validMargins.length
    : 0
})

const bestMonthProfit = computed(() =>
  Math.max(...sortedMetrics.value.map(metric => metric.gross_profit_local || 0), 0)
)

const totalProfit = computed(() =>
  sortedMetrics.value.reduce((sum, metric) => sum + (metric.gross_profit_local || 0), 0)
)

const profitTrend = computed(() => {
  if (sortedMetrics.value.length < 2) return 0

  const recent = sortedMetrics.value.slice(-3)
  const older = sortedMetrics.value.slice(-6, -3)

  const recentAvg = recent.reduce((sum, metric) => sum + (metric.gross_profit_local || 0), 0) / recent.length
  const olderAvg = older.reduce((sum, metric) => sum + (metric.gross_profit_local || 0), 0) / older.length

  return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
})
</script>