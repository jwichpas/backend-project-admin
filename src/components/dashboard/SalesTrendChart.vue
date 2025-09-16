<template>
  <div class="bg-card border border-border rounded-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Tendencia de Ventas</h3>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedPeriod"
          class="text-xs border border-input rounded px-2 py-1 bg-background"
          @change="updateChartData"
        >
          <option value="monthly">Mensual</option>
          <option value="quarterly">Trimestral</option>
          <option value="yearly">Anual</option>
        </select>
        <TrendingUp class="h-5 w-5 text-muted-foreground" />
      </div>
    </div>

    <div v-if="processedData.length === 0" class="flex items-center justify-center h-96 text-muted-foreground">
      <div class="text-center">
        <TrendingUp class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de ventas disponibles</p>
        <p class="text-sm">Los gráficos aparecerán cuando haya información de ventas</p>
      </div>
    </div>

    <ApexLineChart
      v-else
      :series="chartSeries"
      :categories="chartCategories"
      :height="400"
      :colors="['#3B82F6', '#10B981', '#F59E0B']"
      :y-axis-formatter="formatCurrency"
      :x-axis-formatter="formatDate"
      :theme="theme"
      type="area"
      :stroke-width="3"
    />

    <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
      <div class="text-center">
        <p class="text-muted-foreground">Total Período</p>
        <p class="font-bold text-lg">{{ formatCurrency(totalPeriodSales) }}</p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Crecimiento Promedio</p>
        <p class="font-bold text-lg" :class="avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ avgGrowth >= 0 ? '+' : '' }}{{ avgGrowth.toFixed(1) }}%
        </p>
      </div>
      <div class="text-center">
        <p class="text-muted-foreground">Mejor Mes</p>
        <p class="font-bold text-lg">{{ formatCurrency(bestMonth) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import ApexLineChart from '@/components/charts/ApexLineChart.vue'
import type { SalesMonthlyTrend, SalesProfitMonthly } from '@/stores/salesDashboard'

interface Props {
  monthlyTrend: SalesMonthlyTrend[]
  profitData?: SalesProfitMonthly[]
  theme?: 'light' | 'dark'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  loading: false
})

const selectedPeriod = ref<'monthly' | 'quarterly' | 'yearly'>('monthly')

const formatCurrency = (value: number) => {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDate = (value: string) => {
  // Extract year and month from ISO string to avoid timezone issues
  const dateStr = value.slice(0, 10) // Get YYYY-MM-DD part
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1) // Month is 0-indexed

  if (selectedPeriod.value === 'monthly') {
    return date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
  } else if (selectedPeriod.value === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear().toString().slice(-2)}`
  } else {
    return date.getFullYear().toString()
  }
}

const processedData = computed(() => {
  let data = [...props.monthlyTrend].sort((a, b) =>
    a.sale_month.localeCompare(b.sale_month)
  )

  if (selectedPeriod.value === 'quarterly') {
    const quarterlyData: any[] = []
    const quarterMap = new Map()

    data.forEach(item => {
      const date = new Date(item.sale_month)
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const key = `${year}-Q${quarter}`

      if (!quarterMap.has(key)) {
        quarterMap.set(key, {
          sale_month: `${year}-${(quarter - 1) * 3 + 1}-01`,
          total_sales: 0,
          total_transactions: 0,
          growth_percentage: 0
        })
      }

      const existing = quarterMap.get(key)
      existing.total_sales += item.total_sales
      existing.total_transactions += item.total_transactions
    })

    data = Array.from(quarterMap.values())
  } else if (selectedPeriod.value === 'yearly') {
    const yearlyData: any[] = []
    const yearMap = new Map()

    data.forEach(item => {
      const year = new Date(item.sale_month).getFullYear()

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          sale_month: `${year}-01-01`,
          total_sales: 0,
          total_transactions: 0,
          growth_percentage: 0
        })
      }

      const existing = yearMap.get(year)
      existing.total_sales += item.total_sales
      existing.total_transactions += item.total_transactions
    })

    data = Array.from(yearMap.values())
  }

  return data
})

const chartSeries = computed(() => {
  if (!processedData.value || processedData.value.length === 0) {
    return [
      { name: 'Ventas', data: [] },
      { name: 'Transacciones', data: [] }
    ]
  }

  return [
    {
      name: 'Ventas',
      data: processedData.value.map(item => item.total_sales || 0)
    },
    {
      name: 'Transacciones',
      data: processedData.value.map(item => (item.total_transactions || 0) * 100) // Scale for visibility
    }
  ]
})

const chartCategories = computed(() => {
  if (!processedData.value || processedData.value.length === 0) {
    return []
  }
  return processedData.value.map(item => item.sale_month)
})

const totalPeriodSales = computed(() => {
  if (!processedData.value || processedData.value.length === 0) return 0
  return processedData.value.reduce((sum, item) => sum + (item.total_sales || 0), 0)
})

const avgGrowth = computed(() => {
  if (!processedData.value || processedData.value.length === 0) return 0

  const validGrowths = processedData.value
    .map(item => item.growth_percentage)
    .filter(growth => growth !== null && !isNaN(growth))

  return validGrowths.length > 0
    ? validGrowths.reduce((sum, growth) => sum + growth, 0) / validGrowths.length
    : 0
})

const bestMonth = computed(() => {
  if (!processedData.value || processedData.value.length === 0) return 0
  return Math.max(...processedData.value.map(item => item.total_sales || 0), 0)
})

const updateChartData = () => {
  // Trigger reactivity
}

watch(() => props.monthlyTrend, () => {
  updateChartData()
}, { deep: true })
</script>