<template>
  <div v-if="status" class="mt-4 p-3 rounded-lg border" :class="statusClasses">
    <div class="flex items-center gap-2">
      <component :is="statusIcon" class="h-5 w-5" />
      <div>
        <p class="font-medium text-sm">{{ statusTitle }}</p>
        <p class="text-xs opacity-80">{{ statusMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-vue-next'

interface Props {
  status?: 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'ERROR' | null
  message?: string
}

const props = defineProps<Props>()

const statusConfig = {
  PROCESSING: {
    title: 'Procesando factura electrónica...',
    icon: Clock,
    classes: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  ACCEPTED: {
    title: 'Factura electrónica aceptada',
    icon: CheckCircle,
    classes: 'bg-green-50 border-green-200 text-green-800'
  },
  REJECTED: {
    title: 'Factura electrónica rechazada',
    icon: AlertCircle,
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  ERROR: {
    title: 'Error en facturación electrónica',
    icon: XCircle,
    classes: 'bg-red-50 border-red-200 text-red-800'
  }
}

const statusClasses = computed(() => {
  return props.status ? statusConfig[props.status]?.classes || '' : ''
})

const statusIcon = computed(() => {
  return props.status ? statusConfig[props.status]?.icon || Clock : Clock
})

const statusTitle = computed(() => {
  return props.status ? statusConfig[props.status]?.title || '' : ''
})

const statusMessage = computed(() => {
  return props.message || 'El sistema está procesando la factura electrónica'
})
</script>