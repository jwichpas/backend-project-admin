<template>
  <div class="space-y-6">
    <div class="text-center py-8">
      <Package class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold mb-2">Formulario de Recepción</h3>
      <p class="text-muted-foreground mb-4">
        Este formulario está en desarrollo
      </p>
      <div class="flex justify-center gap-3">
        <Button type="button" variant="outline" @click="$emit('cancel')">
          Cancelar
        </Button>
        <Button type="button" @click="handleSave">
          Guardar (Demo)
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const emit = defineEmits<{
  save: [data: any]
  cancel: []
}>()

const handleSave = () => {
  // Mock data for demonstration
  const mockReceptionData = {
    warehouse_id: 'mock-warehouse-id',
    reception_date: new Date().toISOString().split('T')[0],
    status: 'COMPLETE',
    notes: 'Recepción de demo'
  }
  
  emit('save', mockReceptionData)
}
</script>