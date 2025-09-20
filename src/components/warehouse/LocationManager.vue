<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Gestión de Ubicaciones</h3>
        <p class="text-muted-foreground text-sm">
          Configure la estructura jerárquica de ubicaciones del almacén
        </p>
      </div>
      <Button @click="showCreateZoneDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        Nueva Zona
      </Button>
    </div>

    <!-- Warehouse Selection -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Seleccionar Almacén</CardTitle>
      </CardHeader>
      <CardContent>
        <select
          v-model="selectedWarehouseId"
          @change="onWarehouseChange"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Seleccionar almacén</option>
          <option
            v-for="warehouse in warehouseManager.activeWarehouses"
            :key="warehouse.id"
            :value="warehouse.id"
          >
            {{ warehouse.name }}
          </option>
        </select>
      </CardContent>
    </Card>

    <!-- Location Hierarchy -->
    <div v-if="selectedWarehouseId" class="space-y-4">
      <!-- Zones -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center justify-between">
            <span>Zonas ({{ filteredZones.length }})</span>
            <Button variant="outline" size="sm" @click="showCreateZoneDialog = true">
              <Plus class="mr-2 h-3 w-3" />
              Agregar Zona
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="filteredZones.length === 0" class="text-center py-8">
            <MapPin class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">No hay zonas configuradas</p>
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="zone in filteredZones"
              :key="zone.id"
              class="cursor-pointer hover:bg-muted/50 transition-colors"
              :class="{ 'ring-2 ring-primary': selectedZoneId === zone.id }"
              @click="selectZone(zone.id)"
            >
              <CardHeader class="pb-2">
                <div class="flex items-center justify-between">
                  <CardTitle class="text-sm">{{ zone.code }}</CardTitle>
                  <Badge variant="outline" class="text-xs">
                    {{ getAisleCount(zone.id) }} pasillos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <p class="text-sm text-muted-foreground">{{ zone.name || 'Sin nombre' }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="editZone(zone)"
                    class="h-6 px-2"
                  >
                    <Edit class="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="deleteZone(zone.id)"
                    class="h-6 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <!-- Aisles for Selected Zone -->
      <Card v-if="selectedZoneId">
        <CardHeader>
          <CardTitle class="text-base flex items-center justify-between">
            <span>Pasillos ({{ filteredAisles.length }})</span>
            <Button variant="outline" size="sm" @click="showCreateAisleDialog = true">
              <Plus class="mr-2 h-3 w-3" />
              Agregar Pasillo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="filteredAisles.length === 0" class="text-center py-6">
            <ArrowRight class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-muted-foreground text-sm">No hay pasillos en esta zona</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="aisle in filteredAisles"
              :key="aisle.id"
              class="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              :class="{ 'bg-primary/10': selectedAisleId === aisle.id }"
              @click="selectAisle(aisle.id)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <code class="bg-background px-2 py-1 rounded text-xs">{{ aisle.code }}</code>
                  <span class="text-sm font-medium">{{ aisle.name || 'Sin nombre' }}</span>
                  <Badge variant="outline" class="text-xs">
                    {{ getShelfCount(aisle.id) }} estantes
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  Dirección: {{ aisle.direction || 'No especificada' }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="editAisle(aisle)"
                  class="h-6 px-2"
                >
                  <Edit class="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="deleteAisle(aisle.id)"
                  class="h-6 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Shelves for Selected Aisle -->
      <Card v-if="selectedAisleId">
        <CardHeader>
          <CardTitle class="text-base flex items-center justify-between">
            <span>Estantes ({{ filteredShelves.length }})</span>
            <Button variant="outline" size="sm" @click="showCreateShelfDialog = true">
              <Plus class="mr-2 h-3 w-3" />
              Agregar Estante
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="filteredShelves.length === 0" class="text-center py-6">
            <Package class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-muted-foreground text-sm">No hay estantes en este pasillo</p>
          </div>
          <div v-else class="grid gap-3 md:grid-cols-2">
            <Card
              v-for="shelf in filteredShelves"
              :key="shelf.id"
              class="cursor-pointer hover:bg-muted/50 transition-colors"
              :class="{ 'ring-2 ring-primary': selectedShelfId === shelf.id }"
              @click="selectShelf(shelf.id)"
            >
              <CardHeader class="pb-2">
                <div class="flex items-center justify-between">
                  <CardTitle class="text-sm">{{ shelf.code }}</CardTitle>
                  <Badge variant="outline" class="text-xs">
                    {{ shelf.levels }} niveles
                  </Badge>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <p class="text-sm text-muted-foreground">{{ shelf.name || 'Sin nombre' }}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-muted-foreground">
                    {{ getPositionCount(shelf.id) }} posiciones
                  </span>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="editShelf(shelf)"
                      class="h-6 px-2"
                    >
                      <Edit class="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="deleteShelf(shelf.id)"
                      class="h-6 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <!-- Shelf Positions for Selected Shelf -->
      <Card v-if="selectedShelfId">
        <CardHeader>
          <CardTitle class="text-base flex items-center justify-between">
            <span>Posiciones del Estante ({{ filteredShelfPositions.length }})</span>
            <Button variant="outline" size="sm" @click="showCreatePositionDialog = true">
              <Plus class="mr-2 h-3 w-3" />
              Agregar Posición
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="filteredShelfPositions.length === 0" class="text-center py-6">
            <Grid class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p class="text-muted-foreground text-sm">No hay posiciones configuradas</p>
          </div>
          <div v-else class="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <div
              v-for="position in filteredShelfPositions"
              :key="position.id"
              class="relative group p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              :class="{
                'bg-primary/10 border-primary': selectedPositionId === position.id,
                'bg-green-50 border-green-200': !position.is_reserved,
                'bg-orange-50 border-orange-200': position.is_reserved
              }"
              @click="selectPosition(position.id)"
            >
              <div class="text-center">
                <code class="text-xs font-mono">{{ position.location_code }}</code>
                <div class="text-xs text-muted-foreground mt-1">
                  Nivel {{ position.level_number }}, Pos {{ position.position_number }}
                </div>
                <Badge
                  :variant="position.is_reserved ? 'outline' : 'success'"
                  class="text-xs mt-1"
                >
                  {{ position.is_reserved ? 'Reservado' : 'Libre' }}
                </Badge>
              </div>
              <div class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="deletePosition(position.id)"
                  class="h-5 w-5 p-0 text-destructive hover:text-destructive"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create Zone Dialog -->
    <Dialog v-model:open="showCreateZoneDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingZone ? 'Editar Zona' : 'Nueva Zona' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="saveZone" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Código de Zona *</label>
            <Input
              v-model="zoneForm.code"
              placeholder="Ej: A, B, RECEPCION"
              required
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Nombre</label>
            <Input
              v-model="zoneForm.name"
              placeholder="Ej: Zona de almacenamiento A"
              class="mt-1"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Ancho (m)</label>
              <Input
                v-model.number="zoneForm.width"
                type="number"
                step="0.01"
                min="0"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Alto (m)</label>
              <Input
                v-model.number="zoneForm.height"
                type="number"
                step="0.01"
                min="0"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Largo (m)</label>
              <Input
                v-model.number="zoneForm.length"
                type="number"
                step="0.01"
                min="0"
                class="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelZoneForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="warehouseManager.loading">
              {{ editingZone ? 'Actualizar' : 'Crear' }} Zona
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Create Aisle Dialog -->
    <Dialog v-model:open="showCreateAisleDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingAisle ? 'Editar Pasillo' : 'Nuevo Pasillo' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="saveAisle" class="space-y-4">
          <div>
            <label class="text-sm font-medium">Código de Pasillo *</label>
            <Input
              v-model="aisleForm.code"
              placeholder="Ej: A1, A2, B1"
              required
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Nombre</label>
            <Input
              v-model="aisleForm.name"
              placeholder="Ej: Pasillo principal A1"
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Dirección</label>
            <select
              v-model="aisleForm.direction"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="HORIZONTAL">Horizontal</option>
              <option value="VERTICAL">Vertical</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Ancho (m)</label>
            <Input
              v-model.number="aisleForm.width"
              type="number"
              step="0.01"
              min="0"
              placeholder="2.0"
              class="mt-1"
            />
          </div>
          <div class="flex items-center space-x-2">
            <input
              id="is_main_aisle"
              type="checkbox"
              v-model="aisleForm.is_main_aisle"
              class="rounded border-gray-300"
            />
            <label for="is_main_aisle" class="text-sm font-medium">Pasillo principal</label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelAisleForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="warehouseManager.loading">
              {{ editingAisle ? 'Actualizar' : 'Crear' }} Pasillo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Create Shelf Dialog -->
    <Dialog v-model:open="showCreateShelfDialog">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingShelf ? 'Editar Estante' : 'Nuevo Estante' }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="saveShelf" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Código de Estante *</label>
              <Input
                v-model="shelfForm.code"
                placeholder="Ej: A1-01, A1-02"
                required
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Niveles *</label>
              <Input
                v-model.number="shelfForm.levels"
                type="number"
                min="1"
                max="10"
                required
                class="mt-1"
              />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Nombre</label>
            <Input
              v-model="shelfForm.name"
              placeholder="Ej: Estante principal A1-01"
              class="mt-1"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Ancho (m)</label>
              <Input
                v-model.number="shelfForm.width"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.2"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Profundidad (m)</label>
              <Input
                v-model.number="shelfForm.depth"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.6"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Alto Total (m)</label>
              <Input
                v-model.number="shelfForm.height"
                type="number"
                step="0.01"
                min="0"
                placeholder="2.4"
                class="mt-1"
              />
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Peso Máximo (kg)</label>
              <Input
                v-model.number="shelfForm.max_weight_kg"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Material</label>
              <select
                v-model="shelfForm.material"
                class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="STEEL">Acero</option>
                <option value="ALUMINUM">Aluminio</option>
                <option value="WOOD">Madera</option>
                <option value="PLASTIC">Plástico</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelShelfForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="warehouseManager.loading">
              {{ editingShelf ? 'Actualizar' : 'Crear' }} Estante
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Create Position Dialog -->
    <Dialog v-model:open="showCreatePositionDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevas Posiciones</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="savePositions" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Nivel *</label>
              <Input
                v-model.number="positionForm.level_number"
                type="number"
                min="1"
                :max="selectedShelfLevels"
                required
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Posiciones a crear *</label>
              <Input
                v-model.number="positionForm.positions_count"
                type="number"
                min="1"
                max="20"
                required
                class="mt-1"
              />
            </div>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm font-medium">Ancho (m)</label>
              <Input
                v-model.number="positionForm.width"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.4"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Profundidad (m)</label>
              <Input
                v-model.number="positionForm.depth"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.6"
                class="mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Alto (m)</label>
              <Input
                v-model.number="positionForm.height"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.5"
                class="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="cancelPositionForm">
              Cancelar
            </Button>
            <Button type="submit" :disabled="warehouseManager.loading">
              Crear Posiciones
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWarehouseManager } from '@/composables/useWarehouseManager'
import { useCompaniesStore } from '@/stores/companies'
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  ArrowRight,
  Package,
  Grid,
  X
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'

const warehouseManager = useWarehouseManager()
const companiesStore = useCompaniesStore()

// State
const selectedWarehouseId = ref('')
const selectedZoneId = ref('')
const selectedAisleId = ref('')
const selectedShelfId = ref('')
const selectedPositionId = ref('')

// Dialog states
const showCreateZoneDialog = ref(false)
const showCreateAisleDialog = ref(false)
const showCreateShelfDialog = ref(false)
const showCreatePositionDialog = ref(false)

// Editing states
const editingZone = ref(false)
const editingAisle = ref(false)
const editingShelf = ref(false)

// Form data
const zoneForm = ref({
  code: '',
  name: '',
  width: 0,
  height: 0,
  length: 0
})

const aisleForm = ref({
  code: '',
  name: '',
  direction: 'HORIZONTAL',
  width: 2.0,
  is_main_aisle: false
})

const shelfForm = ref({
  code: '',
  name: '',
  levels: 4,
  width: 1.2,
  depth: 0.6,
  height: 2.4,
  max_weight_kg: 1000,
  material: 'STEEL'
})

const positionForm = ref({
  level_number: 1,
  positions_count: 1,
  width: 0.4,
  depth: 0.6,
  height: 0.5
})

// Computed properties
const filteredZones = computed(() => {
  if (!selectedWarehouseId.value) return []
  return warehouseManager.zones.filter(zone => zone.warehouse_id === selectedWarehouseId.value)
})

const filteredAisles = computed(() => {
  if (!selectedZoneId.value) return []
  return warehouseManager.aisles.filter(aisle => aisle.warehouse_zone_id === selectedZoneId.value)
})

const filteredShelves = computed(() => {
  if (!selectedAisleId.value) return []
  return warehouseManager.shelves.filter(shelf => shelf.warehouse_aisle_id === selectedAisleId.value)
})

const filteredShelfPositions = computed(() => {
  if (!selectedShelfId.value) return []
  return warehouseManager.shelfPositions.filter(position => position.warehouse_shelf_id === selectedShelfId.value)
})

const selectedShelfLevels = computed(() => {
  if (!selectedShelfId.value) return 1
  const shelf = warehouseManager.shelves.find(s => s.id === selectedShelfId.value)
  return shelf?.levels || 1
})

// Methods
const onWarehouseChange = async () => {
  selectedZoneId.value = ''
  selectedAisleId.value = ''
  selectedShelfId.value = ''
  selectedPositionId.value = ''

  if (!selectedWarehouseId.value || !companiesStore.currentCompany) return

  await warehouseManager.fetchZones(companiesStore.currentCompany.id, selectedWarehouseId.value)
}

const selectZone = async (zoneId: string) => {
  selectedZoneId.value = zoneId
  selectedAisleId.value = ''
  selectedShelfId.value = ''
  selectedPositionId.value = ''

  if (!companiesStore.currentCompany) return
  await warehouseManager.fetchAisles(companiesStore.currentCompany.id, zoneId)
}

const selectAisle = async (aisleId: string) => {
  selectedAisleId.value = aisleId
  selectedShelfId.value = ''
  selectedPositionId.value = ''

  if (!companiesStore.currentCompany) return
  await warehouseManager.fetchShelves(companiesStore.currentCompany.id, aisleId)
}

const selectShelf = async (shelfId: string) => {
  selectedShelfId.value = shelfId
  selectedPositionId.value = ''

  if (!companiesStore.currentCompany) return
  await warehouseManager.fetchShelfPositions(companiesStore.currentCompany.id, shelfId)
}

const selectPosition = (positionId: string) => {
  selectedPositionId.value = positionId
}

// Zone methods
const saveZone = async () => {
  if (!selectedWarehouseId.value || !companiesStore.currentCompany) return

  try {
    const zoneData = {
      ...zoneForm.value,
      company_id: companiesStore.currentCompany.id,
      warehouse_id: selectedWarehouseId.value
    }

    if (editingZone.value) {
      // TODO: Implement update zone
      console.log('Update zone:', zoneData)
    } else {
      await warehouseManager.createZone(zoneData)
    }

    cancelZoneForm()
    await warehouseManager.fetchZones(companiesStore.currentCompany.id, selectedWarehouseId.value)
  } catch (error) {
    console.error('Error saving zone:', error)
  }
}

const editZone = (zone: any) => {
  zoneForm.value = {
    code: zone.code,
    name: zone.name || '',
    width: zone.width || 0,
    height: zone.height || 0,
    length: zone.length || 0
  }
  editingZone.value = true
  showCreateZoneDialog.value = true
}

const deleteZone = async (zoneId: string) => {
  if (!confirm('¿Está seguro de eliminar esta zona?')) return

  try {
    await warehouseManager.deleteZone(zoneId)
    if (selectedZoneId.value === zoneId) {
      selectedZoneId.value = ''
      selectedAisleId.value = ''
      selectedShelfId.value = ''
      selectedPositionId.value = ''
    }
  } catch (error) {
    console.error('Error deleting zone:', error)
  }
}

const cancelZoneForm = () => {
  showCreateZoneDialog.value = false
  editingZone.value = false
  zoneForm.value = {
    code: '',
    name: '',
    width: 0,
    height: 0,
    length: 0
  }
}

// Aisle methods
const saveAisle = async () => {
  if (!selectedZoneId.value || !companiesStore.currentCompany) return

  try {
    const aisleData = {
      ...aisleForm.value,
      company_id: companiesStore.currentCompany.id,
      warehouse_zone_id: selectedZoneId.value
    }

    await warehouseManager.createAisle(aisleData)
    cancelAisleForm()
    await warehouseManager.fetchAisles(companiesStore.currentCompany.id, selectedZoneId.value)
  } catch (error) {
    console.error('Error saving aisle:', error)
  }
}

const editAisle = (aisle: any) => {
  aisleForm.value = {
    code: aisle.code,
    name: aisle.name || '',
    direction: aisle.direction || 'HORIZONTAL',
    width: aisle.width || 2.0,
    is_main_aisle: aisle.is_main_aisle || false
  }
  editingAisle.value = true
  showCreateAisleDialog.value = true
}

const deleteAisle = async (aisleId: string) => {
  if (!confirm('¿Está seguro de eliminar este pasillo?')) return

  try {
    // TODO: Implement delete aisle in composable
    console.log('Delete aisle:', aisleId)
    if (selectedAisleId.value === aisleId) {
      selectedAisleId.value = ''
      selectedShelfId.value = ''
      selectedPositionId.value = ''
    }
  } catch (error) {
    console.error('Error deleting aisle:', error)
  }
}

const cancelAisleForm = () => {
  showCreateAisleDialog.value = false
  editingAisle.value = false
  aisleForm.value = {
    code: '',
    name: '',
    direction: 'HORIZONTAL',
    width: 2.0,
    is_main_aisle: false
  }
}

// Shelf methods
const saveShelf = async () => {
  if (!selectedAisleId.value || !companiesStore.currentCompany) return

  try {
    const shelfData = {
      ...shelfForm.value,
      company_id: companiesStore.currentCompany.id,
      warehouse_aisle_id: selectedAisleId.value
    }

    await warehouseManager.createShelf(shelfData)
    cancelShelfForm()
    await warehouseManager.fetchShelves(companiesStore.currentCompany.id, selectedAisleId.value)
  } catch (error) {
    console.error('Error saving shelf:', error)
  }
}

const editShelf = (shelf: any) => {
  shelfForm.value = {
    code: shelf.code,
    name: shelf.name || '',
    levels: shelf.levels || 4,
    width: shelf.width || 1.2,
    depth: shelf.depth || 0.6,
    height: shelf.height || 2.4,
    max_weight_kg: shelf.max_weight_kg || 1000,
    material: shelf.material || 'STEEL'
  }
  editingShelf.value = true
  showCreateShelfDialog.value = true
}

const deleteShelf = async (shelfId: string) => {
  if (!confirm('¿Está seguro de eliminar este estante?')) return

  try {
    // TODO: Implement delete shelf in composable
    console.log('Delete shelf:', shelfId)
    if (selectedShelfId.value === shelfId) {
      selectedShelfId.value = ''
      selectedPositionId.value = ''
    }
  } catch (error) {
    console.error('Error deleting shelf:', error)
  }
}

const cancelShelfForm = () => {
  showCreateShelfDialog.value = false
  editingShelf.value = false
  shelfForm.value = {
    code: '',
    name: '',
    levels: 4,
    width: 1.2,
    depth: 0.6,
    height: 2.4,
    max_weight_kg: 1000,
    material: 'STEEL'
  }
}

// Position methods
const savePositions = async () => {
  if (!selectedShelfId.value || !companiesStore.currentCompany) return

  try {
    for (let i = 1; i <= positionForm.value.positions_count; i++) {
      const positionData = {
        company_id: companiesStore.currentCompany.id,
        warehouse_shelf_id: selectedShelfId.value,
        level_number: positionForm.value.level_number,
        position_number: i,
        width: positionForm.value.width,
        depth: positionForm.value.depth,
        height: positionForm.value.height,
        is_reserved: false,
        is_active: true,
        condition: 'GOOD'
      }

      await warehouseManager.createShelfPosition(positionData)
    }

    cancelPositionForm()
    await warehouseManager.fetchShelfPositions(companiesStore.currentCompany.id, selectedShelfId.value)
  } catch (error) {
    console.error('Error saving positions:', error)
  }
}

const deletePosition = async (positionId: string) => {
  if (!confirm('¿Está seguro de eliminar esta posición?')) return

  try {
    // TODO: Implement delete position in composable
    console.log('Delete position:', positionId)
    if (selectedPositionId.value === positionId) {
      selectedPositionId.value = ''
    }
  } catch (error) {
    console.error('Error deleting position:', error)
  }
}

const cancelPositionForm = () => {
  showCreatePositionDialog.value = false
  positionForm.value = {
    level_number: 1,
    positions_count: 1,
    width: 0.4,
    depth: 0.6,
    height: 0.5
  }
}

// Helper methods
const getAisleCount = (zoneId: string) => {
  return warehouseManager.aisles.filter(aisle => aisle.warehouse_zone_id === zoneId).length
}

const getShelfCount = (aisleId: string) => {
  return warehouseManager.shelves.filter(shelf => shelf.warehouse_aisle_id === aisleId).length
}

const getPositionCount = (shelfId: string) => {
  return warehouseManager.shelfPositions.filter(position => position.warehouse_shelf_id === shelfId).length
}

// Initialize data when component is mounted
watch(() => companiesStore.currentCompany, async (newCompany) => {
  if (newCompany) {
    await warehouseManager.initializeWarehouseData(newCompany.id)
  }
}, { immediate: true })
</script>