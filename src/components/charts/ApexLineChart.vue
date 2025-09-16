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
  series: any[]
  categories?: string[]
  title?: string
  height?: number | string
  type?: 'line' | 'area' | 'bar' | 'column'
  colors?: string[]
  strokeWidth?: number
  markers?: boolean
  grid?: boolean
  yAxisFormatter?: (value: number) => string
  xAxisFormatter?: (value: string) => string
  dataLabels?: boolean
  toolbar?: boolean
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  type: 'line',
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] as string[],
  strokeWidth: 2,
  markers: true,
  grid: true,
  dataLabels: false,
  toolbar: true,
  theme: 'light'
})


const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    toolbar: {
      show: props.toolbar
    },
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
  stroke: {
    width: props.strokeWidth,
    curve: 'smooth'
  },
  markers: {
    size: props.markers ? 4 : 0
  },
  grid: {
    show: props.grid,
    borderColor: props.theme === 'dark' ? '#374151' : '#E5E7EB'
  },
  xaxis: {
    categories: props.categories,
    labels: {
      style: {
        colors: props.theme === 'dark' ? '#9CA3AF' : '#6B7280'
      },
      formatter: props.xAxisFormatter
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: props.theme === 'dark' ? '#9CA3AF' : '#6B7280'
      },
      formatter: props.yAxisFormatter
    }
  },
  dataLabels: {
    enabled: props.dataLabels
  },
  theme: {
    mode: props.theme
  },
  tooltip: {
    theme: props.theme,
    y: {
      formatter: props.yAxisFormatter
    }
  },
  legend: {
    labels: {
      colors: props.theme === 'dark' ? '#9CA3AF' : '#6B7280'
    }
  }
}))
</script>