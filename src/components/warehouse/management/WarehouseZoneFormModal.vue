<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {{ zone ? 'Editar Zona' : 'Crear Zona' }}
        </DialogTitle>
        <DialogDescription>
          {{ zone 
            ? 'Modifica los detalles de la zona seleccionada.' 
            : 'Completa la información para crear una nueva zona.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="warehouse_id" class="text-sm font-medium">Almacén *</label>
            <select
              id="warehouse_id"
              v-model="form.warehouse_id"
              required
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seleccionar almacén</option>
              <option
                v-for="warehouse in warehouses"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
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
              placeholder="Ej: Z001, A1, etc."
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="name" class="text-sm font-medium">Nombre *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nombre de la zona"
            />
          </div>
          <div>
            <label for="zone_type" class="text-sm font-medium">Tipo de Zona</label>
            <select
              id="zone_type"
              v-model="form.zone_type"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seleccionar tipo</option>
              <option value="storage">Almacenamiento</option>
              <option value="picking">Picking</option>
              <option value="packing">Empaque</option>
              <option value="receiving">Recepción</option>
              <option value="shipping">Envío</option>
              <option value="office">Oficina</option>
              <option value="other">Otro</option>
            </select>
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
            placeholder="Descripción de la zona"
          ></textarea>
        </div>

        <!-- Shape Configuration -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">Configuración de Forma</h3>
          
          <div>
            <label for="shape_type" class="text-sm font-medium">Tipo de Forma</label>
            <select
              id="shape_type"
              v-model="form.shape_type"
              class="mt-1 flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin forma definida</option>
              <option value="rectangle">Rectángulo</option>
              <option value="circle">Círculo</option>
              <option value="polygon">Polígono</option>
            </select>
          </div>

          <!-- Rectangle coordinates -->
          <div v-if="form.shape_type === 'rectangle'" class="space-y-3">
            <p class="text-sm text-muted-foreground">Coordenadas del rectángulo (x, y, ancho, alto)</p>
            <div class="grid grid-cols-4 gap-3">
              <div>
                <label class="text-xs text-muted-foreground">X</label>
                <input
                  v-model.number="rectangleCoords.x"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Y</label>
                <input
                  v-model.number="rectangleCoords.y"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Ancho</label>
                <input
                  v-model.number="rectangleCoords.width"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Alto</label>
                <input
                  v-model.number="rectangleCoords.height"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <!-- Circle coordinates -->
          <div v-if="form.shape_type === 'circle'" class="space-y-3">
            <p class="text-sm text-muted-foreground">Coordenadas del círculo (centro x, centro y, radio)</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-xs text-muted-foreground">Centro X</label>
                <input
                  v-model.number="circleCoords.x"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Centro Y</label>
                <input
                  v-model.number="circleCoords.y"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="text-xs text-muted-foreground">Radio</label>
                <input
                  v-model.number="circleCoords.radius"
                  type="number"
                  step="0.01"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <!-- Polygon coordinates -->
          <div v-if="form.shape_type === 'polygon'" class="space-y-3">
            <p class="text-sm text-muted-foreground">Coordenadas del polígono (formato JSON)</p>
            <textarea
              v-model="polygonCoords"
              rows="4"
              class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder='[{"x": 0, "y": 0}, {"x": 10, "y": 0}, {"x": 10, "y": 10}, {"x": 0, "y": 10}]'
            ></textarea>
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
            Zona activa
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ zone ? 'Actualizar' : 'Crear' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type WarehouseZone, type Warehouse } from '@/composables/useWarehouseManager'
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
  zone?: WarehouseZone | null
  warehouses: Warehouse[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [zone: Partial<WarehouseZone>]
}>()

const saving = ref(false)

const form = ref({
  warehouse_id: '',
  code: '',
  name: '',
  description: '',
  zone_type: '',
  shape_type: '',
  is_active: true
})

const rectangleCoords = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

const circleCoords = ref({
  x: 0,
  y: 0,
  radius: 0
})

const polygonCoords = ref('')

// Computed property to generate shape coordinates based on shape type
const shapeCoordinates = computed(() => {
  switch (form.value.shape_type) {
    case 'rectangle':
      return {
        type: 'rectangle',
        x: rectangleCoords.value.x,
        y: rectangleCoords.value.y,
        width: rectangleCoords.value.width,
        height: rectangleCoords.value.height
      }
    case 'circle':
      return {
        type: 'circle',
        x: circleCoords.value.x,
        y: circleCoords.value.y,
        radius: circleCoords.value.radius
      }
    case 'polygon':
      try {
        const points = JSON.parse(polygonCoords.value)
        return {
          type: 'polygon',
          points: points
        }
      } catch {
        return null
      }
    default:
      return null
  }
})

// Reset form when modal opens/closes or zone changes
watch([() => props.open, () => props.zone], () => {
  if (props.open) {
    if (props.zone) {
      // Edit mode
      form.value = {
        warehouse_id: props.zone.warehouse_id || '',
        code: props.zone.code || '',
        name: props.zone.name || '',
        description: props.zone.description || '',
        zone_type: props.zone.zone_type || '',
        shape_type: props.zone.shape_type || '',
        is_active: props.zone.is_active ?? true
      }
      
      // Parse existing coordinates
      if (props.zone.shape_coordinates) {
        try {
          const coords = typeof props.zone.shape_coordinates === 'string' 
            ? JSON.parse(props.zone.shape_coordinates)
            : props.zone.shape_coordinates
            
          if (coords.type === 'rectangle') {
            rectangleCoords.value = {
              x: coords.x || 0,
              y: coords.y || 0,
              width: coords.width || 0,
              height: coords.height || 0
            }
          } else if (coords.type === 'circle') {
            circleCoords.value = {
              x: coords.x || 0,
              y: coords.y || 0,
              radius: coords.radius || 0
            }
          } else if (coords.type === 'polygon') {
            polygonCoords.value = JSON.stringify(coords.points, null, 2)
          }
        } catch (error) {
          console.error('Error parsing coordinates:', error)
        }
      }
    } else {
      // Create mode
      form.value = {
        warehouse_id: '',
        code: '',
        name: '',
        description: '',
        zone_type: '',
        shape_type: '',
        is_active: true
      }
      rectangleCoords.value = { x: 0, y: 0, width: 0, height: 0 }
      circleCoords.value = { x: 0, y: 0, radius: 0 }
      polygonCoords.value = ''
    }
  }
})

const handleSubmit = async () => {
  saving.value = true
  
  try {
    // Clean up empty values
    const cleanedForm = {
      warehouse_id: form.value.warehouse_id,
      code: form.value.code.trim(),
      name: form.value.name.trim(),
      description: form.value.description?.trim() || null,
      zone_type: form.value.zone_type || null,
      shape_type: form.value.shape_type || null,
      shape_coordinates: shapeCoordinates.value,
      is_active: form.value.is_active
    }
    
    emit('save', cleanedForm)
  } finally {
    saving.value = false
  }
}
</script>