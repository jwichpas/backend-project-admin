<template>
  <div class="w-full">
    <div v-if="!isReady" class="flex items-center justify-center text-muted-foreground" :style="{ height: height + 'px' }">
      <div class="text-center">
        <div class="animate-pulse">
          <div class="h-4 bg-muted rounded w-32 mb-2"></div>
          <div class="h-3 bg-muted rounded w-24"></div>
        </div>
      </div>
    </div>
    <apexchart
      v-else
      :type="type"
      :height="height"
      :options="safeOptions"
      :series="cleanedSeries"
      :key="chartKey"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

interface Props {
  series: any[]
  options: any
  type: string
  height: number | string
  minDataPoints?: number
}

const props = withDefaults(defineProps<Props>(), {
  minDataPoints: 1
})

const chartKey = ref(0)
const isReady = ref(false)

const cleanedSeries = computed(() => {
  if (!props.series || !Array.isArray(props.series) || props.series.length === 0) {
    return []
  }

  // For pie/donut charts (series is array of numbers)
  if (typeof props.series[0] === 'number') {
    return props.series.filter(value =>
      typeof value === 'number' &&
      !isNaN(value) &&
      value >= 0
    )
  }

  // For line/bar charts (series is array of objects with data arrays)
  return props.series.map(serie => {
    if (!serie || !serie.data || !Array.isArray(serie.data)) {
      return { ...serie, data: [] }
    }

    return {
      ...serie,
      data: serie.data.map(value => {
        // Ensure we return valid numbers, convert null/undefined to 0
        if (value === null || value === undefined || isNaN(value)) {
          return 0
        }
        return typeof value === 'number' ? value : parseFloat(value) || 0
      })
    }
  }).filter(serie => serie.data.length > 0)
})

const hasValidData = computed(() => {
  if (cleanedSeries.value.length === 0) return false

  // For pie/donut charts
  if (typeof cleanedSeries.value[0] === 'number') {
    return cleanedSeries.value.some(value => value > 0)
  }

  // For line/bar charts
  return cleanedSeries.value.some(serie =>
    serie.data &&
    serie.data.length >= props.minDataPoints &&
    serie.data.some(value => value > 0)
  )
})

const safeOptions = computed(() => {
  const baseOptions = { ...props.options }

  // Ensure chart type matches the series format
  if (typeof cleanedSeries.value[0] === 'number') {
    // For pie/donut charts, ensure we don't have conflicting options
    if (!['pie', 'donut'].includes(props.type)) {
      console.warn(`Chart type '${props.type}' doesn't match numeric series data. Expected 'pie' or 'donut'.`)
    }
  } else {
    // For line/bar charts, ensure proper axis configuration
    if (['pie', 'donut'].includes(props.type)) {
      console.warn(`Chart type '${props.type}' doesn't match object series data. Expected 'line', 'area', 'bar', etc.`)
    }
  }

  return baseOptions
})

const updateChart = async () => {
  isReady.value = false
  await nextTick()

  if (hasValidData.value) {
    // Force re-render with new key
    chartKey.value++
    await nextTick()
    isReady.value = true
  }
}

// Watch for data changes
watch(() => props.series, updateChart, { immediate: true, deep: true })
watch(() => props.options, updateChart, { deep: true })
</script>