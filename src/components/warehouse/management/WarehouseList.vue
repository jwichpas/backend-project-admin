<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div 
        v-for="i in 3" 
        :key="i" 
        class="rounded-lg border border-border p-4 space-y-3"
      >
        <div class="h-6 bg-muted rounded animate-pulse"></div>
        <div class="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div 
      v-else-if="warehouses.length === 0" 
      class="text-center py-12 border border-dashed border-border rounded-lg"
    >
      <WarehouseIcon class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-2 text-sm font-semibold text-foreground">Sin almacenes</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Comienza creando tu primer almacén
      </p>
    </div>

    <!-- Warehouse list -->
    <div v-else class="grid gap-4">
      <div 
        v-for="warehouse in warehouses" 
        :key="warehouse.id"
        class="group relative rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-colors"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <WarehouseIcon class="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-foreground">
                  {{ warehouse.name }}
                </h3>
                <p v-if="warehouse.code" class="text-sm text-muted-foreground">
                  Código: {{ warehouse.code }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" @click="$emit('view-zones', warehouse)">
              <Layers class="mr-2 h-4 w-4" />
              Ver Zonas
            </Button>
            <Button variant="outline" size="sm" @click="$emit('edit', warehouse)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="$emit('delete', warehouse)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Details -->
        <div v-if="warehouse.description" class="mt-4">
          <p class="text-sm text-muted-foreground">{{ warehouse.description }}</p>
        </div>

        <!-- Dimensions -->
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-if="warehouse.width" class="flex items-center gap-2 text-sm">
            <Ruler class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Ancho:</span>
            <span class="font-medium">{{ warehouse.width }}m</span>
          </div>
          <div v-if="warehouse.height" class="flex items-center gap-2 text-sm">
            <Ruler class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Alto:</span>
            <span class="font-medium">{{ warehouse.height }}m</span>
          </div>
          <div v-if="warehouse.length" class="flex items-center gap-2 text-sm">
            <Ruler class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Largo:</span>
            <span class="font-medium">{{ warehouse.length }}m</span>
          </div>
        </div>

        <!-- Location -->
        <div v-if="warehouse.address" class="mt-4 flex items-start gap-2 text-sm">
          <MapPin class="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <span class="text-muted-foreground">Ubicación:</span>
            <p class="font-medium">{{ warehouse.address }}</p>
          </div>
        </div>

        <!-- Status -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'h-2 w-2 rounded-full',
                warehouse.is_active ? 'bg-green-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-sm text-muted-foreground">
              {{ warehouse.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          
          <div class="text-sm text-muted-foreground">
            Creado: {{ formatDate(warehouse.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Warehouse } from '@/composables/useWarehouseManager'
import { Warehouse as WarehouseIcon, Edit, Trash2, Layers, Ruler, MapPin } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

defineProps<{
  warehouses: Warehouse[]
  loading: boolean
}>()

defineEmits<{
  edit: [warehouse: Warehouse]
  delete: [warehouse: Warehouse]
  'view-zones': [warehouse: Warehouse]
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>