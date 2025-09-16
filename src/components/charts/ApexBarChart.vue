<template>
  <div class="w-full">
    <apexchart
      :type="type"
      :height="height"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

interface Props {
  series: any[]
  categories?: string[]
  title?: string
  height?: number | string
  type?: 'bar' | 'column'
  colors?: string[]
  horizontal?: boolean
  dataLabels?: boolean
  toolbar?: boolean
  theme?: 'light' | 'dark'
  yAxisFormatter?: (value: number) => string
  xAxisFormatter?: (value: string) => string
  stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 350,
  type: 'column',
  colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] as string[],
  horizontal: false,
  dataLabels: false,
  toolbar: true,
  theme: 'light',
  stacked: false
})

const chartOptions = computed(() => ({
  chart: {
    type: props.type,
    toolbar: {
      show: props.toolbar
    },
    background: 'transparent',
    stacked: props.stacked
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
  plotOptions: {
    bar: {
      horizontal: props.horizontal,
      columnWidth: '70%',
      borderRadius: 4
    }
  },
  grid: {
    show: true,
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