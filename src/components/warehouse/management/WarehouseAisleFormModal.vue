<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ aisle ? 'Editar Pasillo' : 'Crear Pasillo' }}
        </DialogTitle>
        <DialogDescription>
          {{ aisle 
            ? 'Modifica los detalles del pasillo seleccionado.' 
            : 'Completa la información para crear un nuevo pasillo.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="warehouse_zone_id" class="text-sm font-medium">Zona *</label>
            <select
              id="warehouse_zone_id"
              v-model="form.warehouse_zone_id"
              required
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seleccionar zona</option>
              <option
                v-for="zone in zones"
                :key="zone.id"
                :value="zone.id"
              >
                {{ zone.code }} - {{ zone.name }}
              </option>
            </select>
          </div>
          <div>
            <label for="code" class="text-sm font-medium">Código *</label>
            <input
              id="code"
              v-model="form.code"
              type="text"
              required
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ej: P001, A-1, etc."
            />
          </div>
        </div>

        <div>
          <label for="name" class="text-sm font-medium">Nombre *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Nombre del pasillo"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="text-sm font-medium">Descripción</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descripción del pasillo"
          ></textarea>
        </div>

        <!-- Dimensions -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="width" class="text-sm font-medium">Ancho (metros)</label>
            <input
              id="width"
              v-model.number="form.width"
              type="number"
              step="0.01"
              min="0"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label for="direction" class="text-sm font-medium">Dirección</label>
            <select
              id="direction"
              v-model="form.direction"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin dirección específica</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
        </div>

        <!-- Status -->
        <div class="flex items-center space-x-2">
          <input
            id="is_active"
            v-model="form.is_active"
            type="checkbox"
            class="h-4 w-4 rounded border-border"
          />
          <label for="is_active" class="text-sm font-medium">
            Pasillo activo
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ aisle ? 'Actualizar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type WarehouseAisle, type WarehouseZone } from '@/composables/useWarehouseManager'
import { Loader2 } from 'lucide-vue-next'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Button from '@/components/ui/Button.vue'

interface Props {
  open: boolean
  aisle?: WarehouseAisle | null
  zones: WarehouseZone[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [aisle: Partial<WarehouseAisle>]
}>()

const saving = ref(false)

const form = ref({
  warehouse_zone_id: '',
  code: '',
  name: '',
  description: '',
  width: null as number | null,
  direction: '',
  is_active: true
})

// Reset form when modal opens/closes or aisle changes
watch([() => props.open, () => props.aisle], () => {
  if (props.open) {
    if (props.aisle) {
      // Edit mode
      form.value = {
        warehouse_zone_id: props.aisle.warehouse_zone_id || '',
        code: props.aisle.code || '',
        name: props.aisle.name || '',
        description: props.aisle.description || '',
        width: props.aisle.width || null,
        direction: props.aisle.direction || '',
        is_active: props.aisle.is_active ?? true
      }
    } else {
      // Create mode
      form.value = {
        warehouse_zone_id: '',
        code: '',
        name: '',
        description: '',
        width: null,
        direction: '',
        is_active: true
      }
    }
  }
})

const handleSubmit = async () => {
  saving.value = true
  
  try {
    // Clean up empty values
    const cleanedForm = {
      warehouse_zone_id: form.value.warehouse_zone_id,
      code: form.value.code.trim(),
      name: form.value.name.trim(),
      description: form.value.description?.trim() || null,
      width: form.value.width || null,
      direction: form.value.direction || null,
      is_active: form.value.is_active
    }
    
    emit('save', cleanedForm)
  } finally {
    saving.value = false
  }
}
</script>