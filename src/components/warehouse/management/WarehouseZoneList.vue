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
      v-else-if="zones.length === 0" 
      class="text-center py-12 border border-dashed border-border rounded-lg"
    >
      <Layers class="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 class="mt-2 text-sm font-semibold text-foreground">Sin zonas</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Las zonas te ayudan a organizar el espacio de tus almacenes
      </p>
    </div>

    <!-- Zone list -->
    <div v-else class="grid gap-4">
      <div 
        v-for="zone in zones" 
        :key="zone.id"
        class="group relative rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-colors"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Layers class="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-foreground">
                    {{ zone.name }}
                  </h3>
                  <span class="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {{ zone.code }}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground">
                  Almacén: {{ getWarehouseName(zone.warehouse_id) }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="sm" @click="$emit('view-aisles', zone)">
              <Navigation class="mr-2 h-4 w-4" />
              Ver Pasillos
            </Button>
            <Button variant="outline" size="sm" @click="$emit('edit', zone)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" @click="$emit('delete', zone)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>


        <!-- Dimensions and coordinates -->
        <div class="mt-4 space-y-3">
          <div v-if="zone.shape_type" class="flex items-center gap-2 text-sm">
            <Square class="h-4 w-4 text-muted-foreground" />
            <span class="text-muted-foreground">Forma:</span>
            <span class="font-medium capitalize">{{ zone.shape_type.toLowerCase() }}</span>
          </div>

          <!-- Dimensions -->
          <div v-if="zone.width || zone.length" class="flex items-center gap-4 text-sm">
            <div v-if="zone.width" class="flex items-center gap-1">
              <span class="text-muted-foreground">Ancho:</span>
              <span class="font-medium">{{ zone.width }}m</span>
            </div>
            <div v-if="zone.length" class="flex items-center gap-1">
              <span class="text-muted-foreground">Largo:</span>
              <span class="font-medium">{{ zone.length }}m</span>
            </div>
          </div>

          <!-- Position -->
          <div v-if="zone.x_coordinate || zone.y_coordinate" class="space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <MapPin class="h-4 w-4 text-muted-foreground" />
              <span class="text-muted-foreground">Posición:</span>
            </div>
            <div class="bg-muted/30 rounded p-2 text-xs font-mono">
              X: {{ zone.x_coordinate || 0 }}, Y: {{ zone.y_coordinate || 0 }}, Z: {{ zone.z_coordinate || 0 }}
            </div>
          </div>
        </div>

        <!-- Zone capacity -->
        <div v-if="zone.capacity_kg" class="mt-4">
          <div class="flex items-center gap-2">
            <div class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Capacidad: {{ zone.capacity_kg }}kg
            </div>
          </div>
        </div>

        <!-- Color and dates -->
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="h-4 w-4 rounded-full border-2 border-white shadow-sm"
              :style="{ backgroundColor: zone.color_hex }"
            ></div>
            <span class="text-sm text-muted-foreground">
              Color: {{ zone.color_hex }}
            </span>
          </div>

          <div class="text-sm text-muted-foreground">
            Creado: {{ formatDate(zone.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type WarehouseZone, type Warehouse } from '@/composables/useWarehouseManager'
import { Layers, Edit, Trash2, Navigation, Square, MapPin } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  zones: WarehouseZone[]
  warehouses: Warehouse[]
  loading: boolean
}>()

defineEmits<{
  edit: [zone: WarehouseZone]
  delete: [zone: WarehouseZone]
  'view-aisles': [zone: WarehouseZone]
}>()

const getWarehouseName = (warehouseId: string) => {
  const warehouse = props.warehouses.find(w => w.id === warehouseId)
  return warehouse ? warehouse.name : 'Almacén desconocido'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>