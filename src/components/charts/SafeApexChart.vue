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
      :options="options"
      :series="series"
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

const hasValidData = computed(() => {
  if (!props.series || !Array.isArray(props.series) || props.series.length === 0) {
    return false
  }

  // For pie/donut charts (series is array of numbers)
  if (typeof props.series[0] === 'number') {
    return props.series.some(value =>
      value !== null &&
      value !== undefined &&
      !isNaN(value) &&
      value > 0
    )
  }

  // For line/bar charts (series is array of objects with data arrays)
  return props.series.some(serie =>
    serie &&
    serie.data &&
    Array.isArray(serie.data) &&
    serie.data.length >= props.minDataPoints &&
    serie.data.some(value =>
      value !== null &&
      value !== undefined &&
      !isNaN(value)
    )
  )
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