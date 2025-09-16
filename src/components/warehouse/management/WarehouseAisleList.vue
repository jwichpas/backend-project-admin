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
      v-else-if="aisles.length === 0" 
      class="text-center py-12 border border-dashed border-border rounded-lg"
    >
      <Navigation class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-2 text-sm font-semibold text-foreground">Sin pasillos</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Los pasillos organizan el flujo dentro de las zonas
      </p>
    </div>

    <!-- Aisle list -->
    <div v-else class="grid gap-4">
      <div 
        v-for="aisle in aisles" 
        :key="aisle.id"
        class="group relative rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-colors"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Navigation class="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-foreground">
                    {{ aisle.name }}
                  </h3>
                  <span class="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {{ aisle.code }}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ getZoneName(aisle.warehouse_zone_id) }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" @click="$emit('view-shelves', aisle)">
              <Boxes class="mr-2 h-4 w-4" />
              Ver Estantes
            </Button>
            <Button variant="outline" size="sm" @click="$emit('edit', aisle)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="$emit('delete', aisle)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Details -->
        <div v-if="aisle.description" class="mt-4">
          <p class="text-sm text-muted-foreground">{{ aisle.description }}</p>
        </div>

        <!-- Dimensions and direction -->
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div v-if="aisle.width" class="flex items-center gap-2 text-sm">
            <Ruler class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Ancho:</span>
            <span class="font-medium">{{ aisle.width }}m</span>
          </div>
          <div v-if="aisle.direction" class="flex items-center gap-2 text-sm">
            <ArrowUpDown class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Dirección:</span>
            <span class="font-medium capitalize">{{ aisle.direction }}</span>
          </div>
        </div>

        <!-- Status -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'h-2 w-2 rounded-full',
                aisle.is_active ? 'bg-green-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-sm text-muted-foreground">
              {{ aisle.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          
          <div class="text-sm text-muted-foreground">
            Creado: {{ formatDate(aisle.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type WarehouseAisle, type WarehouseZone } from '@/composables/useWarehouseManager'
import { Navigation, Edit, Trash2, Boxes, Ruler, ArrowUpDown } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  aisles: WarehouseAisle[]
  zones: WarehouseZone[]
  loading: boolean
}>()

defineEmits<{
  edit: [aisle: WarehouseAisle]
  delete: [aisle: WarehouseAisle]
  'view-shelves': [aisle: WarehouseAisle]
}>()

const getZoneName = (zoneId: string) => {
  const zone = props.zones.find(z => z.id === zoneId)
  return zone ? `${zone.code} - ${zone.name}` : 'Zona desconocida'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>