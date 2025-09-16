<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ position ? 'Editar Posición' : 'Crear Posición' }}</DialogTitle>
        <DialogDescription>{{ position ? 'Modifica los detalles de la posición seleccionada.' : 'Completa la información para crear una nueva posición en el estante.' }}</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="warehouse_shelf_id" class="text-sm font-medium">Estante *</label>
            <select id="warehouse_shelf_id" v-model="form.warehouse_shelf_id" required class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Seleccionar estante</option>
              <option v-for="shelf in shelves" :key="shelf.id" :value="shelf.id">{{ shelf.code }} - {{ shelf.name }}</option>
            </select>
          </div>
          <div>
            <label for="code" class="text-sm font-medium">Código *</label>
            <input id="code" v-model="form.code" type="text" required class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ej: P001, A1-L2-P3, etc." />
          </div>
        </div>

        <div>
          <label for="name" class="text-sm font-medium">Nombre</label>
          <input id="name" v-model="form.name" type="text" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre descriptivo de la posición" />
        </div>

        <div>
          <label for="description" class="text-sm font-medium">Descripción</label>
          <textarea id="description" v-model="form.description" rows="3" class="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción de la posición"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="level" class="text-sm font-medium">Nivel</label>
            <input id="level" v-model.number="form.level" type="number" min="1" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="1" />
          </div>
          <div>
            <label for="position_in_level" class="text-sm font-medium">Posición en el nivel</label>
            <input id="position_in_level" v-model.number="form.position_in_level" type="number" min="1" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="1" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="max_weight" class="text-sm font-medium">Peso máximo (kg)</label>
            <input id="max_weight" v-model.number="form.max_weight" type="number" step="0.01" min="0" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.00" />
          </div>
          <div>
            <label for="max_volume" class="text-sm font-medium">Volumen máximo (m³)</label>
            <input id="max_volume" v-model.number="form.max_volume" type="number" step="0.001" min="0" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.000" />
          </div>
        </div>

        <!-- Coordenadas -->
        <div class="border-t border-border pt-4">
          <h4 class="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin class="h-4 w-4" />
            Coordenadas espaciales
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="x" class="text-sm font-medium">Coordenada X</label>
              <input id="x" v-model.number="form.x" type="number" step="0.01" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label for="y" class="text-sm font-medium">Coordenada Y</label>
              <input id="y" v-model.number="form.y" type="number" step="0.01" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label for="z" class="text-sm font-medium">Coordenada Z (altura)</label>
              <input id="z" v-model.number="form.z" type="number" step="0.01" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.00" />
            </div>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">Las coordenadas se calculan automáticamente si se dejan vacías</p>
        </div>

        <div class="flex items-center space-x-2">
          <input id="is_active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-border" />
          <label for="is_active" class="text-sm font-medium">Posición activa</label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">Cancelar</Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ position ? 'Actualizar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type WarehouseShelfPosition, type WarehouseShelf } from '@/composables/useWarehouseManager'
import { Loader2, MapPin } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Button from '@/components/ui/Button.vue'

interface Props {
  open: boolean
  position?: WarehouseShelfPosition | null
  shelves: WarehouseShelf[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:open': [value: boolean]; save: [position: Partial<WarehouseShelfPosition>] }>()

const saving = ref(false)
const form = ref({
  warehouse_shelf_id: '',
  code: '',
  name: '',
  description: '',
  level: null as number | null,
  position_in_level: null as number | null,
  max_weight: null as number | null,
  max_volume: null as number | null,
  x: null as number | null,
  y: null as number | null,
  z: null as number | null,
  is_active: true
})

watch([() => props.open, () => props.position], () => {
  if (props.open) {
    if (props.position) {
      form.value = {
        warehouse_shelf_id: props.position.warehouse_shelf_id || '',
        code: props.position.code || '',
        name: props.position.name || '',
        description: props.position.description || '',
        level: props.position.level || null,
        position_in_level: props.position.position_in_level || null,
        max_weight: props.position.max_weight || null,
        max_volume: props.position.max_volume || null,
        x: props.position.x || null,
        y: props.position.y || null,
        z: props.position.z || null,
        is_active: props.position.is_active ?? true
      }
    } else {
      form.value = { 
        warehouse_shelf_id: '', 
        code: '', 
        name: '', 
        description: '', 
        level: null, 
        position_in_level: null, 
        max_weight: null, 
        max_volume: null,
        x: null,
        y: null,
        z: null,
        is_active: true 
      }
    }
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    const cleanedForm = {
      warehouse_shelf_id: form.value.warehouse_shelf_id,
      code: form.value.code.trim(),
      name: form.value.name?.trim() || null,
      description: form.value.description?.trim() || null,
      level: form.value.level || null,
      position_in_level: form.value.position_in_level || null,
      max_weight: form.value.max_weight || null,
      max_volume: form.value.max_volume || null,
      x: form.value.x || null,
      y: form.value.y || null,
      z: form.value.z || null,
      is_active: form.value.is_active
    }
    emit('save', cleanedForm)
  } finally {
    saving.value = false
  }
}
</script>