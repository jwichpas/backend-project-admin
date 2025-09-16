<template>
  <div class="w-full">
    <SafeApexChart
      :type="type"
      :height="height"
      :options="chartOptions"
      :series="series"
      :min-data-points="1"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SafeApexChart from './SafeApexChart.vue'

interface Props {
  series: number[]
  labels?: string[]
  title?: string
  height?: number | string
  type?: 'pie' | 'donut'
  colors?: string[]
  showLegend?: boolean
  dataLabels?: boolean
  theme?: 'light' | 'dark'
  valueFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  type: 'donut',
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'] as string[],
  showLegend: true,
  dataLabels: true,
  theme: 'light'
})


const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    background: 'transparent'
  },
  title: {
    text: props.title,
    style: {
      fontSize: '16px',
      fontWeight: 600,
      color: props.theme === 'dark' ? '#fff' : '#374151'
    }
  },
  colors: props.colors,
  labels: props.labels,
  dataLabels: {
    enabled: props.dataLabels,
    style: {
      colors: [props.theme === 'dark' ? '#fff' : '#374151']
    },
    formatter: props.valueFormatter
  },
  legend: {
    show: props.showLegend,
    position: 'bottom',
    labels: {
      colors: props.theme === 'dark' ? '#9CA3AF' : '#6B7280'
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: props.type === 'donut' ? '70%' : '0%'
      }
    }
  },
  theme: {
    mode: props.theme
  },
  tooltip: {
    theme: props.theme,
    y: {
      formatter: props.valueFormatter
    }
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
}))
</script>