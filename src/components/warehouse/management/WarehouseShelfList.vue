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
    <div v-else-if="shelves.length === 0" class="text-center py-12 border border-dashed border-border rounded-lg">
      <Boxes class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-2 text-sm font-semibold text-foreground">Sin estantes</h3>
      <p class="mt-1 text-sm text-muted-foreground">Los estantes organizan productos dentro de los pasillos</p>
    </div>

    <!-- Shelf list -->
    <div v-else class="grid gap-4">
      <div v-for="shelf in shelves" :key="shelf.id" class="group relative rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Boxes class="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-foreground">{{ shelf.name }}</h3>
                  <span class="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{{ shelf.code }}</span>
                </div>
                <p class="text-sm text-muted-foreground">{{ getAisleName(shelf.warehouse_aisle_id) }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" @click="$emit('view-positions', shelf)">
              <MapPin class="mr-2 h-4 w-4" />
              Ver Posiciones
            </Button>
            <Button variant="outline" size="sm" @click="$emit('edit', shelf)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="$emit('delete', shelf)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div v-if="shelf.description" class="mt-4">
          <p class="text-sm text-muted-foreground">{{ shelf.description }}</p>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div v-if="shelf.levels" class="flex items-center gap-2">
            <Layers class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Niveles:</span>
            <span class="font-medium">{{ shelf.levels }}</span>
          </div>
          <div v-if="shelf.capacity" class="flex items-center gap-2">
            <Package class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Capacidad:</span>
            <span class="font-medium">{{ shelf.capacity }}</span>
          </div>
          <div v-if="shelf.height" class="flex items-center gap-2">
            <Ruler class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Alto:</span>
            <span class="font-medium">{{ shelf.height }}m</span>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div :class="['h-2 w-2 rounded-full', shelf.is_active ? 'bg-green-500' : 'bg-red-500']"></div>
            <span class="text-sm text-muted-foreground">{{ shelf.is_active ? 'Activo' : 'Inactivo' }}</span>
          </div>
          <div class="text-sm text-muted-foreground">Creado: {{ formatDate(shelf.created_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type WarehouseShelf, type WarehouseAisle } from '@/composables/useWarehouseManager'
import { Boxes, Edit, Trash2, MapPin, Layers, Package, Ruler } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  shelves: WarehouseShelf[]
  aisles: WarehouseAisle[]
  loading: boolean
}>()

defineEmits<{
  edit: [shelf: WarehouseShelf]
  delete: [shelf: WarehouseShelf]
  'view-positions': [shelf: WarehouseShelf]
}>()

const getAisleName = (aisleId: string) => {
  const aisle = props.aisles.find(a => a.id === aisleId)
  return aisle ? `${aisle.code} - ${aisle.name}` : 'Pasillo desconocido'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>