<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="rounded-lg border border-border p-4 space-y-3">
        <div class="h-6 bg-muted rounded animate-pulse"></div>
        <div class="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="positions.length === 0" class="text-center py-12 border border-dashed border-border rounded-lg">
      <Target class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-2 text-sm font-semibold text-foreground">Sin posiciones</h3>
      <p class="mt-1 text-sm text-muted-foreground">Las posiciones son ubicaciones específicas dentro de los estantes</p>
    </div>

    <!-- Position list -->
    <div v-else class="grid gap-4">
      <div v-for="position in positions" :key="position.id" class="group relative rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Target class="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-foreground">{{ position.name || position.code }}</h3>
                  <span class="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{{ position.code }}</span>
                </div>
                <p class="text-sm text-muted-foreground">{{ getShelfName(position.warehouse_shelf_id) }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" @click="$emit('edit', position)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="$emit('delete', position)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div v-if="position.description" class="mt-4">
          <p class="text-sm text-muted-foreground">{{ position.description }}</p>
        </div>

        <div class="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div v-if="position.level" class="flex items-center gap-2">
            <Layers class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Nivel:</span>
            <span class="font-medium">{{ position.level }}</span>
          </div>
          <div v-if="position.position_in_level" class="flex items-center gap-2">
            <Hash class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Posición:</span>
            <span class="font-medium">{{ position.position_in_level }}</span>
          </div>
          <div v-if="position.max_weight" class="flex items-center gap-2">
            <Weight class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Peso máx:</span>
            <span class="font-medium">{{ position.max_weight }}kg</span>
          </div>
          <div v-if="position.max_volume" class="flex items-center gap-2">
            <Box class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Vol. máx:</span>
            <span class="font-medium">{{ position.max_volume }}m³</span>
          </div>
        </div>

        <div v-if="position.x !== null && position.y !== null" class="mt-4">
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-2">
              <MapPin class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Coordenadas:</span>
              <span class="font-medium">X: {{ position.x }}, Y: {{ position.y }}</span>
              <span v-if="position.z !== null" class="font-medium">, Z: {{ position.z }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div :class="['h-2 w-2 rounded-full', position.is_active ? 'bg-green-500' : 'bg-red-500']"></div>
            <span class="text-sm text-muted-foreground">{{ position.is_active ? 'Activo' : 'Inactivo' }}</span>
          </div>
          <div class="text-sm text-muted-foreground">Creado: {{ formatDate(position.created_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type WarehouseShelfPosition, type WarehouseShelf } from '@/composables/useWarehouseManager'
import { Target, Edit, Trash2, Layers, Hash, Weight, Box, MapPin } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  positions: WarehouseShelfPosition[]
  shelves: WarehouseShelf[]
  loading: boolean
}>()

defineEmits<{
  edit: [position: WarehouseShelfPosition]
  delete: [position: WarehouseShelfPosition]
}>()

const getShelfName = (shelfId: string) => {
  const shelf = props.shelves.find(s => s.id === shelfId)
  return shelf ? `${shelf.code} - ${shelf.name}` : 'Estante desconocido'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>