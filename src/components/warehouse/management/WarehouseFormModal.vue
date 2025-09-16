<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ warehouse ? 'Editar Almacén' : 'Crear Almacén' }}
        </DialogTitle>
        <DialogDescription>
          {{ warehouse 
            ? 'Modifica los detalles del almacén seleccionado.' 
            : 'Completa la información para crear un nuevo almacén.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="name" class="text-sm font-medium">Nombre *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nombre del almacén"
            />
          </div>
          <div>
            <label for="code" class="text-sm font-medium">Código</label>
            <input
              id="code"
              v-model="form.code"
              type="text"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Código único"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="text-sm font-medium">Descripción</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descripción del almacén"
          ></textarea>
        </div>

        <!-- Dimensions -->
        <div>
          <h3 class="text-sm font-medium mb-3">Dimensiones (metros)</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="width" class="text-sm text-muted-foreground">Ancho</label>
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
              <label for="height" class="text-sm text-muted-foreground">Alto</label>
              <input
                id="height"
                v-model.number="form.height"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label for="length" class="text-sm text-muted-foreground">Largo</label>
              <input
                id="length"
                v-model.number="form.length"
                type="number"
                step="0.01"
                min="0"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <!-- Address -->
        <div>
          <label for="address" class="text-sm font-medium">Dirección</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="2"
            class="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Dirección física del almacén"
          ></textarea>
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
            Almacén activo
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ warehouse ? 'Actualizar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type Warehouse } from '@/composables/useWarehouseManager'
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
  warehouse?: Warehouse | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [warehouse: Partial<Warehouse>]
}>()

const saving = ref(false)

const form = ref({
  name: '',
  code: '',
  description: '',
  width: null as number | null,
  height: null as number | null,
  length: null as number | null,
  address: '',
  is_active: true
})

// Reset form when modal opens/closes or warehouse changes
watch([() => props.open, () => props.warehouse], () => {
  if (props.open) {
    if (props.warehouse) {
      // Edit mode
      form.value = {
        name: props.warehouse.name || '',
        code: props.warehouse.code || '',
        description: props.warehouse.description || '',
        width: props.warehouse.width || null,
        height: props.warehouse.height || null,
        length: props.warehouse.length || null,
        address: props.warehouse.address || '',
        is_active: props.warehouse.is_active ?? true
      }
    } else {
      // Create mode
      form.value = {
        name: '',
        code: '',
        description: '',
        width: null,
        height: null,
        length: null,
        address: '',
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
      name: form.value.name.trim(),
      code: form.value.code?.trim() || null,
      description: form.value.description?.trim() || null,
      width: form.value.width || null,
      height: form.value.height || null,
      length: form.value.length || null,
      address: form.value.address?.trim() || null,
      is_active: form.value.is_active
    }
    
    emit('save', cleanedForm)
  } finally {
    saving.value = false
  }
}
</script>