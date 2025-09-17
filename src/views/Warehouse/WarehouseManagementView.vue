<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Gestión de Almacenes</h1>
        <p class="text-muted-foreground">
          Administra almacenes, zonas, pasillos, estantes y ubicaciones de productos
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="showCreateWarehouse = true">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Almacén
        </Button>
      </div>
    </div>


    <!-- Navigation Tabs -->
    <div class="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
      <Button
        v-for="tab in tabs"
        :key="tab.key"
        variant="ghost"
        size="sm"
        :class="{ 'bg-background shadow-sm': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" class="mr-2 h-4 w-4" />
        {{ tab.label }}
      </Button>
    </div>

    <!-- Warehouses Tab -->
    <div v-if="activeTab === 'warehouses'" class="space-y-6">
      <WarehouseList
        :warehouses="warehouseManager.activeWarehouses.value"
        :loading="warehouseManager.loading.value"
        @edit="editWarehouse"
        @delete="deleteWarehouse"
        @view-zones="viewWarehouseZones"
      />
    </div>

    <!-- Zones Tab -->
    <div v-if="activeTab === 'zones'" class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <label class="text-sm font-medium">Filtrar por Almacén</label>
          <select
            v-model="selectedWarehouseFilter"
            class="mt-1 flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            @change="filterZones"
          >
            <option value="">Todos los almacenes</option>
            <option
              v-for="warehouse in warehouseManager.activeWarehouses.value"
              :key="warehouse.id"
              :value="warehouse.id"
            >
              {{ warehouse.name }}
            </option>
          </select>
        </div>
        <Button variant="outline" @click="showCreateZone = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Zona
        </Button>
      </div>

      <WarehouseZoneList
        :zones="warehouseManager.filteredZones.value"
        :warehouses="warehouseManager.activeWarehouses.value"
        :loading="warehouseManager.loading.value"
        @edit="editZone"
        @delete="deleteZone"
        @view-aisles="viewZoneAisles"
      />
    </div>

    <!-- Aisles Tab -->
    <div v-if="activeTab === 'aisles'" class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="flex-1 grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select
              v-model="selectedWarehouseFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterAisles"
            >
              <option value="">Seleccionar almacén</option>
              <option
                v-for="warehouse in warehouseManager.activeWarehouses.value"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Zona</label>
            <select
              v-model="selectedZoneFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterAisles"
            >
              <option value="">Seleccionar zona</option>
              <option
                v-for="zone in warehouseManager.filteredZones.value"
                :key="zone.id"
                :value="zone.id"
              >
                {{ zone.code }} - {{ zone.name }}
              </option>
            </select>
          </div>
        </div>
        <Button variant="outline" @click="showCreateAisle = true" :disabled="!selectedZoneFilter">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Pasillo
        </Button>
      </div>

      <WarehouseAisleList
        :aisles="warehouseManager.filteredAisles.value"
        :zones="warehouseManager.zones.value"
        :loading="warehouseManager.loading.value"
        @edit="editAisle"
        @delete="deleteAisle"
        @view-shelves="viewAisleShelves"
      />
    </div>

    <!-- Shelves Tab -->
    <div v-if="activeTab === 'shelves'" class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="flex-1 grid grid-cols-3 gap-4 max-w-3xl">
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select
              v-model="selectedWarehouseFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterShelves"
            >
              <option value="">Seleccionar almacén</option>
              <option
                v-for="warehouse in warehouseManager.activeWarehouses.value"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Zona</label>
            <select
              v-model="selectedZoneFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterShelves"
            >
              <option value="">Seleccionar zona</option>
              <option
                v-for="zone in warehouseManager.filteredZones.value"
                :key="zone.id"
                :value="zone.id"
              >
                {{ zone.code }} - {{ zone.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Pasillo</label>
            <select
              v-model="selectedAisleFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterShelves"
            >
              <option value="">Seleccionar pasillo</option>
              <option
                v-for="aisle in warehouseManager.filteredAisles.value"
                :key="aisle.id"
                :value="aisle.id"
              >
                {{ aisle.code }} - {{ aisle.name }}
              </option>
            </select>
          </div>
        </div>
        <Button variant="outline" @click="showCreateShelf = true" :disabled="!selectedAisleFilter">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Estante
        </Button>
      </div>

      <WarehouseShelfList
        :shelves="warehouseManager.filteredShelves.value"
        :aisles="warehouseManager.aisles.value"
        :loading="warehouseManager.loading.value"
        @edit="editShelf"
        @delete="deleteShelf"
        @view-positions="viewShelfPositions"
      />
    </div>

    <!-- Positions Tab -->
    <div v-if="activeTab === 'positions'" class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="flex-1 grid grid-cols-4 gap-4 max-w-4xl">
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select
              v-model="selectedWarehouseFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterPositions"
            >
              <option value="">Seleccionar almacén</option>
              <option
                v-for="warehouse in warehouseManager.activeWarehouses.value"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Zona</label>
            <select
              v-model="selectedZoneFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterPositions"
            >
              <option value="">Seleccionar zona</option>
              <option
                v-for="zone in warehouseManager.filteredZones.value"
                :key="zone.id"
                :value="zone.id"
              >
                {{ zone.code }} - {{ zone.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Pasillo</label>
            <select
              v-model="selectedAisleFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterPositions"
            >
              <option value="">Seleccionar pasillo</option>
              <option
                v-for="aisle in warehouseManager.filteredAisles.value"
                :key="aisle.id"
                :value="aisle.id"
              >
                {{ aisle.code }} - {{ aisle.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Estante</label>
            <select
              v-model="selectedShelfFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              @change="filterPositions"
            >
              <option value="">Seleccionar estante</option>
              <option
                v-for="shelf in warehouseManager.filteredShelves.value"
                :key="shelf.id"
                :value="shelf.id"
              >
                {{ shelf.code }} - {{ shelf.name }}
              </option>
            </select>
          </div>
        </div>
        <Button variant="outline" @click="showCreatePosition = true" :disabled="!selectedShelfFilter">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Posición
        </Button>
      </div>

      <WarehouseShelfPositionList
        :positions="warehouseManager.filteredShelfPositions.value"
        :shelves="warehouseManager.shelves.value"
        :loading="warehouseManager.loading.value"
        @edit="editPosition"
        @delete="deletePosition"
      />
    </div>

    <!-- Create/Edit Modals -->
    <WarehouseFormModal
      v-model:open="showCreateWarehouse"
      :warehouse="editingWarehouse"
      @save="handleSaveWarehouse"
    />

    <WarehouseZoneFormModal
      v-model:open="showCreateZone"
      :zone="editingZone"
      :warehouses="warehouseManager.activeWarehouses.value"
      @save="handleSaveZone"
    />

    <WarehouseAisleFormModal
      v-model:open="showCreateAisle"
      :aisle="editingAisle"
      :zones="warehouseManager.zones.value"
      @save="handleSaveAisle"
    />

    <WarehouseShelfFormModal
      v-model:open="showCreateShelf"
      :shelf="editingShelf"
      :aisles="warehouseManager.aisles.value"
      @save="handleSaveShelf"
    />

    <WarehouseShelfPositionFormModal
      v-model:open="showCreatePosition"
      :position="editingPosition"
      :shelves="warehouseManager.shelves.value"
      @save="handleSavePosition"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'
import { useWarehouseManager, type Warehouse, type WarehouseZone, type WarehouseAisle, type WarehouseShelf, type WarehouseShelfPosition } from '@/composables/useWarehouseManager'
import { Plus, Warehouse as WarehouseIcon, Layers, Navigation, Boxes, MapPin } from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'

// Warehouse Components (to be created)
import WarehouseList from '@/components/warehouse/management/WarehouseList.vue'
import WarehouseZoneList from '@/components/warehouse/management/WarehouseZoneList.vue'
import WarehouseAisleList from '@/components/warehouse/management/WarehouseAisleList.vue'
import WarehouseShelfList from '@/components/warehouse/management/WarehouseShelfList.vue'
import WarehouseShelfPositionList from '@/components/warehouse/management/WarehouseShelfPositionList.vue'

// Form Modals (to be created)
import WarehouseFormModal from '@/components/warehouse/management/WarehouseFormModal.vue'
import WarehouseZoneFormModal from '@/components/warehouse/management/WarehouseZoneFormModal.vue'
import WarehouseAisleFormModal from '@/components/warehouse/management/WarehouseAisleFormModal.vue'
import WarehouseShelfFormModal from '@/components/warehouse/management/WarehouseShelfFormModal.vue'
import WarehouseShelfPositionFormModal from '@/components/warehouse/management/WarehouseShelfPositionFormModal.vue'

const companiesStore = useCompaniesStore()
const authStore = useAuthStore()
const warehouseManager = useWarehouseManager()

// State
const activeTab = ref('warehouses')
const selectedWarehouseFilter = ref('')
const selectedZoneFilter = ref('')
const selectedAisleFilter = ref('')
const selectedShelfFilter = ref('')

// Modal states
const showCreateWarehouse = ref(false)
const showCreateZone = ref(false)
const showCreateAisle = ref(false)
const showCreateShelf = ref(false)
const showCreatePosition = ref(false)

// Editing states
const editingWarehouse = ref<Warehouse | null>(null)
const editingZone = ref<WarehouseZone | null>(null)
const editingAisle = ref<WarehouseAisle | null>(null)
const editingShelf = ref<WarehouseShelf | null>(null)
const editingPosition = ref<WarehouseShelfPosition | null>(null)

const tabs = [
  { key: 'warehouses', label: 'Almacenes', icon: WarehouseIcon },
  { key: 'zones', label: 'Zonas', icon: Layers },
  { key: 'aisles', label: 'Pasillos', icon: Navigation },
  { key: 'shelves', label: 'Estantes', icon: Boxes },
  { key: 'positions', label: 'Posiciones', icon: MapPin }
]

// Filter methods
const filterZones = () => {
  warehouseManager.setSelectedWarehouse(selectedWarehouseFilter.value)
}

const filterAisles = () => {
  warehouseManager.setSelectedWarehouse(selectedWarehouseFilter.value)
  warehouseManager.setSelectedZone(selectedZoneFilter.value)
}

const filterShelves = () => {
  warehouseManager.setSelectedWarehouse(selectedWarehouseFilter.value)
  warehouseManager.setSelectedZone(selectedZoneFilter.value)
  warehouseManager.setSelectedAisle(selectedAisleFilter.value)
}

const filterPositions = () => {
  warehouseManager.setSelectedWarehouse(selectedWarehouseFilter.value)
  warehouseManager.setSelectedZone(selectedZoneFilter.value)
  warehouseManager.setSelectedAisle(selectedAisleFilter.value)
  warehouseManager.setSelectedShelf(selectedShelfFilter.value)
}

// CRUD handlers
const editWarehouse = (warehouse: Warehouse) => {
  editingWarehouse.value = warehouse
  showCreateWarehouse.value = true
}

const deleteWarehouse = async (warehouse: Warehouse) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el almacén "${warehouse.name}"?`)) {
    try {
      await warehouseManager.deleteWarehouse(warehouse.id)
    } catch (error) {
      console.error('Error deleting warehouse:', error)
    }
  }
}

const viewWarehouseZones = (warehouse: Warehouse) => {
  selectedWarehouseFilter.value = warehouse.id
  activeTab.value = 'zones'
  filterZones()
}

const editZone = (zone: WarehouseZone) => {
  editingZone.value = zone
  showCreateZone.value = true
}

const deleteZone = async (zone: WarehouseZone) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la zona "${zone.code}"?`)) {
    try {
      await warehouseManager.deleteZone(zone.id)
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }
}

const viewZoneAisles = (zone: WarehouseZone) => {
  const warehouse = warehouseManager.activeWarehouses.value.find(w => w.id === zone.warehouse_id)
  if (warehouse) {
    selectedWarehouseFilter.value = warehouse.id
    selectedZoneFilter.value = zone.id
    activeTab.value = 'aisles'
    filterAisles()
  }
}

const editAisle = (aisle: WarehouseAisle) => {
  editingAisle.value = aisle
  showCreateAisle.value = true
}

const deleteAisle = async (aisle: WarehouseAisle) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el pasillo "${aisle.code}"?`)) {
    // TODO: implement delete aisle
  }
}

const viewAisleShelves = (aisle: WarehouseAisle) => {
  const zone = warehouseManager.zones.value.find(z => z.id === aisle.warehouse_zone_id)
  if (zone) {
    selectedWarehouseFilter.value = zone.warehouse_id
    selectedZoneFilter.value = zone.id
    selectedAisleFilter.value = aisle.id
    activeTab.value = 'shelves'
    filterShelves()
  }
}

const editShelf = (shelf: WarehouseShelf) => {
  editingShelf.value = shelf
  showCreateShelf.value = true
}

const deleteShelf = async (shelf: WarehouseShelf) => {
  if (confirm(`¿Estás seguro de que deseas eliminar el estante "${shelf.code}"?`)) {
    // TODO: implement delete shelf
  }
}

const viewShelfPositions = (shelf: WarehouseShelf) => {
  const aisle = warehouseManager.aisles.value.find(a => a.id === shelf.warehouse_aisle_id)
  const zone = aisle ? warehouseManager.zones.value.find(z => z.id === aisle.warehouse_zone_id) : null

  if (zone && aisle) {
    selectedWarehouseFilter.value = zone.warehouse_id
    selectedZoneFilter.value = zone.id
    selectedAisleFilter.value = aisle.id
    selectedShelfFilter.value = shelf.id
    activeTab.value = 'positions'
    filterPositions()
  }
}

const editPosition = (position: WarehouseShelfPosition) => {
  editingPosition.value = position
  showCreatePosition.value = true
}

const deletePosition = async (position: WarehouseShelfPosition) => {
  if (confirm(`¿Estás seguro de que deseas eliminar la posición "${position.location_code}"?`)) {
    // TODO: implement delete position
  }
}

// Save handlers
const handleSaveWarehouse = async (warehouse: Partial<Warehouse>) => {
  try {
    if (editingWarehouse.value) {
      await warehouseManager.updateWarehouse(editingWarehouse.value.id, warehouse)
    } else {
      await warehouseManager.createWarehouse({
        ...warehouse,
        company_id: companiesStore.currentCompany!.id
      } as Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>)
    }
    showCreateWarehouse.value = false
    editingWarehouse.value = null
  } catch (error) {
    console.error('Error saving warehouse:', error)
  }
}

const handleSaveZone = async (zone: Partial<WarehouseZone>) => {
  try {
    if (editingZone.value) {
      await warehouseManager.updateZone(editingZone.value.id, zone)
    } else {
      await warehouseManager.createZone({
        ...zone,
        company_id: companiesStore.currentCompany!.id
      } as Omit<WarehouseZone, 'id' | 'created_at' | 'updated_at'>)
    }
    showCreateZone.value = false
    editingZone.value = null
  } catch (error) {
    console.error('Error saving zone:', error)
  }
}

const handleSaveAisle = async (aisle: Partial<WarehouseAisle>) => {
  try {
    await warehouseManager.createAisle({
      ...aisle,
      company_id: companyStore.selectedCompany!.id
    } as Omit<WarehouseAisle, 'id' | 'created_at' | 'updated_at'>)
    showCreateAisle.value = false
    editingAisle.value = null
  } catch (error) {
    console.error('Error saving aisle:', error)
  }
}

const handleSaveShelf = async (shelf: Partial<WarehouseShelf>) => {
  try {
    await warehouseManager.createShelf({
      ...shelf,
      company_id: companyStore.selectedCompany!.id
    } as Omit<WarehouseShelf, 'id' | 'created_at' | 'updated_at'>)
    showCreateShelf.value = false
    editingShelf.value = null
  } catch (error) {
    console.error('Error saving shelf:', error)
  }
}

const handleSavePosition = async (position: Partial<WarehouseShelfPosition>) => {
  try {
    await warehouseManager.createShelfPosition({
      ...position,
      company_id: companyStore.selectedCompany!.id
    } as Omit<WarehouseShelfPosition, 'id' | 'location_code' | 'calculated_x' | 'calculated_y' | 'calculated_z' | 'created_at' | 'updated_at'>)
    showCreatePosition.value = false
    editingPosition.value = null
  } catch (error) {
    console.error('Error saving position:', error)
  }
}

const refreshWarehouseData = async () => {
  if (companiesStore.currentCompany) {
    await warehouseManager.initializeWarehouseData(companiesStore.currentCompany.id)
  }
}

onMounted(async () => {
  console.log('WarehouseManagementView onMounted - currentCompany:', companiesStore.currentCompany)

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length === 0 && authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)
  }

  if (!companiesStore.currentCompany && companiesStore.userCompanies.length > 0) {
    companiesStore.selectCompany(companiesStore.userCompanies[0].company)
  }

  if (companiesStore.currentCompany) {
    await refreshWarehouseData()
  }
})

// Watch for company changes
watch(
  () => companiesStore.currentCompany,
  async (newCompany, oldCompany) => {
    if (newCompany && oldCompany && newCompany.id !== oldCompany.id) {
      console.log('Company changed in WarehouseManagementView, reloading data...', {
        from: oldCompany.id,
        to: newCompany.id
      })
      await refreshWarehouseData()
    }
  }, { deep: true }
)
</script>
