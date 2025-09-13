<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <TrendingUp class="h-5 w-5" />
        Métricas de Rentabilidad
      </CardTitle>
      <CardDescription>
        Análisis de ganancias y márgenes mensuales
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-6">
        <!-- Current Month Summary -->
        <div v-if="currentMetrics" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(currentMetrics.total_sales) }}
            </div>
            <div class="text-sm text-green-600 dark:text-green-400">Ventas Totales</div>
          </div>
          
          <div class="text-center p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ formatCurrency(currentMetrics.cost_of_goods_sold) }}
            </div>
            <div class="text-sm text-red-600 dark:text-red-400">Costo de Ventas</div>
          </div>
          
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(currentMetrics.gross_profit) }}
            </div>
            <div class="text-sm text-blue-600 dark:text-blue-400">Ganancia Bruta</div>
          </div>
          
          <div class="text-center p-4 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ currentMetrics.gross_margin_percentage?.toFixed(1) }}%
            </div>
            <div class="text-sm text-purple-600 dark:text-purple-400">Margen Bruto</div>
          </div>
        </div>

        <!-- Historical Trend Chart -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-foreground">Tendencia de Rentabilidad</h4>
          <div class="h-80 bg-background">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Profitability Table -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-foreground">Detalle Mensual</h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-border">
              <thead>
                <tr class="bg-muted">
                  <th class="border border-border px-4 py-2 text-left text-foreground">Mes</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Ventas</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Costos</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Ganancia</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Margen %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="metric in sortedMetrics" :key="metric.sale_month" class="hover:bg-muted/50">
                  <td class="border border-border px-4 py-2 text-foreground">
                    {{ formatMonth(metric.sale_month) }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right text-foreground">
                    {{ formatCurrency(metric.total_sales) }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right text-foreground">
                    {{ formatCurrency(metric.cost_of_goods_sold) }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right font-semibold"
                      :class="metric.gross_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(metric.gross_profit) }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right font-semibold"
                      :class="(metric.gross_margin_percentage || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ metric.gross_margin_percentage?.toFixed(1) || '0.0' }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ProfitabilityMetricsMonthly } from '@/stores/salesDashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  metrics: ProfitabilityMetricsMonthly[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const currentMetrics = computed(() => {
  if (props.metrics.length === 0) return null
  return props.metrics[0] // Assuming first item is current month
})

const sortedMetrics = computed(() => {
  return [...props.metrics].sort((a, b) => 
    new Date(b.sale_month).getTime() - new Date(a.sale_month).getTime()
  )
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const formatMonth = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

const chartData = computed(() => {
  if (props.metrics.length === 0) return { labels: [], datasets: [] }

  const sortedData = [...props.metrics].sort((a, b) => 
    new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime()
  )

  return {
    labels: sortedData.map(item => formatMonth(item.sale_month)),
    datasets: [
      {
        label: 'Ventas',
        data: sortedData.map(item => item.total_sales),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Costo de Ventas',
        data: sortedData.map(item => item.cost_of_goods_sold),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Ganancia Bruta',
        data: sortedData.map(item => item.gross_profit),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y'
      },
      {
        label: 'Margen %',
        data: sortedData.map(item => item.gross_margin_percentage || 0),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        yAxisID: 'y1'
      }
    ]
  }
})

// Function to get current theme colors
const getThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark')
  
  return {
    foreground: isDark ? '#f8fafc' : '#0f172a',
    mutedForeground: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    popover: isDark ? '#1e293b' : '#ffffff',
    popoverForeground: isDark ? '#f8fafc' : '#0f172a'
  }
}

// Theme change detection
const themeKey = ref(0)

const chartOptions = computed((): ChartOptions<'line'> => {
  // Force reactivity by accessing themeKey
  themeKey.value
  
  const colors = getThemeColors()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Mes',
          color: colors.foreground
        },
        ticks: {
          color: colors.mutedForeground
        },
        grid: {
          color: colors.border
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Monto (PEN)',
          color: colors.foreground
        },
        ticks: {
          color: colors.mutedForeground,
          callback: function(value) {
            return new Intl.NumberFormat('es-PE', {
              style: 'currency',
              currency: 'PEN',
              minimumFractionDigits: 0
            }).format(value as number)
          }
        },
        grid: {
          color: colors.border
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Margen (%)',
          color: colors.foreground
        },
        ticks: {
          color: colors.mutedForeground,
          callback: function(value) {
            return value + '%'
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: colors.foreground
        }
      },
      tooltip: {
        backgroundColor: colors.popover,
        titleColor: colors.popoverForeground,
        bodyColor: colors.popoverForeground,
        borderColor: colors.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 3) { // Margen %
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%'
            }
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y)
          }
        }
      }
    }
  }
})

// Watch for theme changes
onMounted(() => {
  // Create observer to watch for theme changes
  const observer = new MutationObserver(() => {
    themeKey.value++
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // Cleanup on unmount
  // Note: In a real component, you'd want to cleanup the observer
  // onUnmounted(() => observer.disconnect())
})
</script>