<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ shelf ? 'Editar Estante' : 'Crear Estante' }}</DialogTitle>
        <DialogDescription>{{ shelf ? 'Modifica los detalles del estante seleccionado.' : 'Completa la información para crear un nuevo estante.' }}</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="warehouse_aisle_id" class="text-sm font-medium">Pasillo *</label>
            <select id="warehouse_aisle_id" v-model="form.warehouse_aisle_id" required class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Seleccionar pasillo</option>
              <option v-for="aisle in aisles" :key="aisle.id" :value="aisle.id">{{ aisle.code }} - {{ aisle.name }}</option>
            </select>
          </div>
          <div>
            <label for="code" class="text-sm font-medium">Código *</label>
            <input id="code" v-model="form.code" type="text" required class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ej: E001, S-1, etc." />
          </div>
        </div>

        <div>
          <label for="name" class="text-sm font-medium">Nombre *</label>
          <input id="name" v-model="form.name" type="text" required class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nombre del estante" />
        </div>

        <div>
          <label for="description" class="text-sm font-medium">Descripción</label>
          <textarea id="description" v-model="form.description" rows="3" class="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Descripción del estante"></textarea>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label for="levels" class="text-sm font-medium">Niveles</label>
            <input id="levels" v-model.number="form.levels" type="number" min="1" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="1" />
          </div>
          <div>
            <label for="capacity" class="text-sm font-medium">Capacidad</label>
            <input id="capacity" v-model.number="form.capacity" type="number" min="0" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div>
            <label for="height" class="text-sm font-medium">Altura (m)</label>
            <input id="height" v-model.number="form.height" type="number" step="0.01" min="0" class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0.00" />
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <input id="is_active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-border" />
          <label for="is_active" class="text-sm font-medium">Estante activo</label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">Cancelar</Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ shelf ? 'Actualizar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type WarehouseShelf, type WarehouseAisle } from '@/composables/useWarehouseManager'
import { Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Button from '@/components/ui/Button.vue'

interface Props {
  open: boolean
  shelf?: WarehouseShelf | null
  aisles: WarehouseAisle[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:open': [value: boolean]; save: [shelf: Partial<WarehouseShelf>] }>()

const saving = ref(false)
const form = ref({
  warehouse_aisle_id: '',
  code: '',
  name: '',
  description: '',
  levels: null as number | null,
  capacity: null as number | null,
  height: null as number | null,
  is_active: true
})

watch([() => props.open, () => props.shelf], () => {
  if (props.open) {
    if (props.shelf) {
      form.value = {
        warehouse_aisle_id: props.shelf.warehouse_aisle_id || '',
        code: props.shelf.code || '',
        name: props.shelf.name || '',
        description: props.shelf.description || '',
        levels: props.shelf.levels || null,
        capacity: props.shelf.capacity || null,
        height: props.shelf.height || null,
        is_active: props.shelf.is_active ?? true
      }
    } else {
      form.value = { warehouse_aisle_id: '', code: '', name: '', description: '', levels: null, capacity: null, height: null, is_active: true }
    }
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    const cleanedForm = {
      warehouse_aisle_id: form.value.warehouse_aisle_id,
      code: form.value.code.trim(),
      name: form.value.name.trim(),
      description: form.value.description?.trim() || null,
      levels: form.value.levels || null,
      capacity: form.value.capacity || null,
      height: form.value.height || null,
      is_active: form.value.is_active
    }
    emit('save', cleanedForm)
  } finally {
    saving.value = false
  }
}
</script>