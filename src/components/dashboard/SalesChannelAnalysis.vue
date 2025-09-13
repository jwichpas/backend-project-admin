<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <BarChart3 class="h-5 w-5" />
        Análisis por Canal de Ventas
      </CardTitle>
      <CardDescription>
        Distribución de ventas por tipo de documento
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-6">
        <!-- Channel Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="channel in channelSummary" :key="channel.doc_type" 
               class="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-muted-foreground">
                  {{ getDocumentTypeName(channel.doc_type) }}
                </div>
                <div class="text-2xl font-bold text-foreground">
                  {{ formatCurrency(channel.total_sales_local) }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ channel.transaction_count }} documentos
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-primary">
                  {{ channel.share }}%
                </div>
                <div class="text-xs text-muted-foreground">
                  del total
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Channel Performance Chart -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-foreground">Distribución por Canal</h4>
          <div class="h-80 bg-background">
            <Doughnut :data="channelChartData" :options="channelChartOptions" />
          </div>
        </div>

        <!-- Monthly Trend -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-foreground">Tendencia Mensual por Canal</h4>
          <div class="h-80 bg-background">
            <Line :data="trendChartData" :options="trendChartOptions" />
          </div>
        </div>

        <!-- Channel Metrics Table -->
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-foreground">Detalle por Canal</h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-border">
              <thead>
                <tr class="bg-muted">
                  <th class="border border-border px-4 py-2 text-left text-foreground">Mes</th>
                  <th class="border border-border px-4 py-2 text-left text-foreground">Tipo Documento</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Documentos</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Clientes</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Total Ventas</th>
                  <th class="border border-border px-4 py-2 text-right text-foreground">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="channel in sortedChannels" :key="`${channel.sale_month}-${channel.doc_type}`" 
                    class="hover:bg-muted/50">
                  <td class="border border-border px-4 py-2 text-foreground">
                    {{ formatMonth(channel.sale_month) }}
                  </td>
                  <td class="border border-border px-4 py-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getDocumentTypeClass(channel.doc_type)">
                      {{ getDocumentTypeName(channel.doc_type) }}
                    </span>
                  </td>
                  <td class="border border-border px-4 py-2 text-right text-foreground">
                    {{ channel.transaction_count.toLocaleString() }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right text-foreground">
                    {{ channel.unique_customers.toLocaleString() }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right font-semibold text-foreground">
                    {{ formatCurrency(channel.total_sales_local) }}
                  </td>
                  <td class="border border-border px-4 py-2 text-right text-foreground">
                    {{ formatCurrency(channel.avg_transaction_value) }}
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
import { computed, onMounted, ref } from 'vue'
import { BarChart3 } from 'lucide-vue-next'
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
import type { SalesChannelMonthly } from '@/stores/salesDashboard'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  channels: SalesChannelMonthly[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const channelSummary = computed(() => {
  const summary = new Map<string, {
    doc_type: string
    total_sales_local: number
    transaction_count: number
    unique_customers: number
  }>()

  // Aggregate data by document type
  props.channels.forEach(channel => {
    const existing = summary.get(channel.doc_type) || {
      doc_type: channel.doc_type,
      total_sales_local: 0,
      transaction_count: 0,
      unique_customers: 0
    }

    existing.total_sales_local += channel.total_sales_local
    existing.transaction_count += channel.transaction_count
    existing.unique_customers = Math.max(existing.unique_customers, channel.unique_customers)
    
    summary.set(channel.doc_type, existing)
  })

  const totalSales = Array.from(summary.values()).reduce((sum, item) => sum + item.total_sales_local, 0)

  return Array.from(summary.values())
    .map(item => ({
      ...item,
      share: totalSales > 0 ? ((item.total_sales_local / totalSales) * 100) : 0
    }))
    .sort((a, b) => b.total_sales_local - a.total_sales_local)
})

const sortedChannels = computed(() => {
  return [...props.channels].sort((a, b) => {
    const dateCompare = new Date(b.sale_month).getTime() - new Date(a.sale_month).getTime()
    if (dateCompare !== 0) return dateCompare
    return b.total_sales_local - a.total_sales_local
  })
})

const getDocumentTypeName = (docType: string) => {
  const types: Record<string, string> = {
    '01': 'Facturas',
    '03': 'Boletas',
    '07': 'Notas de Crédito',
    '08': 'Notas de Débito'
  }
  return types[docType] || docType
}

const getDocumentTypeClass = (docType: string) => {
  const classes: Record<string, string> = {
    '01': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    '03': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    '07': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    '08': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }
  return classes[docType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const formatMonth = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short'
  })
}

const channelChartData = computed(() => {
  if (channelSummary.value.length === 0) return { labels: [], datasets: [] }

  return {
    labels: channelSummary.value.map(item => getDocumentTypeName(item.doc_type)),
    datasets: [{
      data: channelSummary.value.map(item => item.total_sales_local),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // Blue for Facturas
        'rgba(34, 197, 94, 0.8)',    // Green for Boletas
        'rgba(251, 191, 36, 0.8)',   // Yellow for NC
        'rgba(239, 68, 68, 0.8)'     // Red for ND
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
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

const channelChartOptions = computed((): ChartOptions<'doughnut'> => {
  // Force reactivity by accessing themeKey
  themeKey.value
  
  const colors = getThemeColors()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${formatCurrency(value)} (${percentage}%)`
          }
        }
      }
    }
  }
})

const trendChartData = computed(() => {
  if (props.channels.length === 0) return { labels: [], datasets: [] }

  // Group data by month and document type
  const monthlyData = new Map<string, Map<string, number>>()
  
  props.channels.forEach(channel => {
    const month = formatMonth(channel.sale_month)
    if (!monthlyData.has(month)) {
      monthlyData.set(month, new Map())
    }
    monthlyData.get(month)!.set(channel.doc_type, channel.total_sales_local)
  })

  const months = Array.from(monthlyData.keys()).sort()
  const docTypes = Array.from(new Set(props.channels.map(c => c.doc_type)))

  const datasets = docTypes.map((docType, index) => {
    const colors = [
      'rgb(59, 130, 246)',   // Blue
      'rgb(34, 197, 94)',    // Green
      'rgb(251, 191, 36)',   // Yellow
      'rgb(239, 68, 68)'     // Red
    ]
    
    return {
      label: getDocumentTypeName(docType),
      data: months.map(month => monthlyData.get(month)?.get(docType) || 0),
      backgroundColor: colors[index % colors.length] + '20',
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      fill: true
    }
  })

  return {
    labels: months,
    datasets
  }
})

const trendChartOptions = computed((): ChartOptions<'line'> => {
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
        display: true,
        title: {
          display: true,
          text: 'Ventas (PEN)',
          color: colors.foreground
        },
        ticks: {
          color: colors.mutedForeground,
          callback: function(value) {
            return formatCurrency(value as number)
          }
        },
        grid: {
          color: colors.border
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
})
</script>