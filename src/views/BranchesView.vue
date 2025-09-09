<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Sucursales</h1>
        <p class="text-muted-foreground">
          {{ currentCompanyName ? `Sucursales de ${currentCompanyName}` : 'Administra las sucursales de la empresa' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button v-if="selectedCompanyId" variant="outline" size="sm" @click="refreshData" :disabled="loading">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualizar
        </Button>
        <Button v-if="selectedCompanyId" size="sm" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>
    </div>

    <!-- Warning when no company selected -->
    <div v-if="!currentCompanyName" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">No hay empresa seleccionada</p>
          <p class="text-xs text-yellow-600 dark:text-yellow-300">Selecciona una empresa en el header para ver sus sucursales</p>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div v-if="selectedCompanyId" class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Sucursales</p>
              <p class="text-2xl font-bold">{{ branchesStore.branches.length }}</p>
            </div>
            <Building class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Almacenes</p>
              <p class="text-2xl font-bold">{{ totalWarehouses }}</p>
            </div>
            <Warehouse class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Con Ubicación</p>
              <p class="text-2xl font-bold">{{ branchesWithLocation }}</p>
            </div>
            <MapPin class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Creadas Este Mes</p>
              <p class="text-2xl font-bold text-emerald-600">{{ branchesThisMonth }}</p>
            </div>
            <Calendar class="h-8 w-8 text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card v-if="selectedCompanyId">
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Código, nombre o dirección..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Con Ubicación</label>
            <select 
              v-model="locationFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="with">Con ubicación</option>
              <option value="without">Sin ubicación</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Con Almacenes</label>
            <select 
              v-model="warehouseFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="with">Con almacenes</option>
              <option value="without">Sin almacenes</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Branches Table -->
    <Card v-if="selectedCompanyId">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Sucursales ({{ filteredBranches.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <ScrollArea class="h-[600px]">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-2">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <span>Cargando sucursales...</span>
          </div>
        </div>

        <div v-else-if="filteredBranches.length === 0" class="text-center py-12">
          <MapPin class="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 class="mt-2 text-sm font-semibold">No hay sucursales</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ searchTerm ? 'No se encontraron sucursales con ese criterio de búsqueda.' : 'Comienza creando una nueva sucursal.' }}
          </p>
          <Button v-if="!searchTerm" class="mt-4" @click="openCreateModal">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Sucursal
          </Button>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Sucursal</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Almacenes</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="branch in filteredBranches" :key="branch.id">
              <TableCell>
                <div>
                  <p class="font-medium">{{ branch.name }}</p>
                  <Badge variant="outline" class="font-mono text-xs">{{ branch.code }}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div class="max-w-xs">
                  <p class="text-sm truncate">{{ branch.address || 'Sin dirección' }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="getUbigeoInfo(branch.ubigeo_code)" class="text-sm">
                  {{ getUbigeoInfo(branch.ubigeo_code) }}
                </div>
                <span v-else class="text-sm text-muted-foreground">Sin ubicación</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Warehouse class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm font-medium">{{ branch.warehouses?.length || 0 }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  {{ formatDate(branch.created_at) }}
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="viewBranch(branch)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="editBranch(branch)"
                    title="Editar"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    @click="deleteBranch(branch)"
                    title="Eliminar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    <!-- Empty state when no company selected -->
    <Card v-else>
      <CardContent class="text-center py-12">
        <Building class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-sm font-semibold">Selecciona una empresa</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Para gestionar sucursales, primero selecciona una empresa.
        </p>
      </CardContent>
    </Card>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      @click="closeModal"
    >
      <div 
        class="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh]"
        @click.stop
      >
        <div class="sticky top-0 bg-background border-b px-6 py-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              {{ modalMode === 'create' ? 'Nueva Sucursal' : modalMode === 'edit' ? 'Editar Sucursal' : 'Ver Sucursal' }}
            </h2>
            <Button variant="ghost" size="sm" @click="closeModal">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea class="max-h-[calc(90vh-80px)]">
        <div class="p-6">
          <BranchForm
            v-if="modalMode !== 'view' && selectedCompanyId"
            :company-id="selectedCompanyId"
            :initial-data="selectedBranch"
            :mode="modalMode"
            :loading="loading"
            @submit="handleSubmit"
            @cancel="closeModal"
          />
          
          <!-- View Mode -->
          <div v-else-if="selectedBranch" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-lg font-medium border-b pb-2">Información Básica</h3>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Código</label>
                  <p class="font-mono">{{ selectedBranch.code }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p>{{ selectedBranch.name }}</p>
                </div>
                
                <div v-if="selectedBranch.address">
                  <label class="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p>{{ selectedBranch.address }}</p>
                </div>
                
                <div v-if="getUbigeoInfo(selectedBranch.ubigeo_code)">
                  <label class="text-sm font-medium text-muted-foreground">Ubicación</label>
                  <p>{{ getUbigeoInfo(selectedBranch.ubigeo_code) }}</p>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="text-lg font-medium border-b pb-2">Información Adicional</h3>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Empresa</label>
                  <p>{{ selectedBranch.company?.legal_name || selectedBranch.company?.trade_name }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                  <p>{{ formatDate(selectedBranch.created_at) }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Almacenes</label>
                  <p>{{ selectedBranch.warehouses?.length || 0 }} almacenes</p>
                </div>
              </div>
            </div>
            
            <!-- Warehouses -->
            <div v-if="selectedBranch.warehouses?.length" class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Almacenes</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="warehouse in selectedBranch.warehouses"
                  :key="warehouse.id"
                  class="p-4 border rounded-lg"
                >
                  <div class="flex items-center justify-between mb-2">
                    <Badge variant="outline" class="font-mono">{{ warehouse.code }}</Badge>
                    <Badge
                      :variant="warehouse.is_active ? 'default' : 'outline'"
                      class="text-xs"
                    >
                      {{ warehouse.operational_status }}
                    </Badge>
                  </div>
                  <h4 class="font-medium">{{ warehouse.name }}</h4>
                  <p class="text-sm text-muted-foreground mt-1">{{ warehouse.warehouse_type }}</p>
                  <p v-if="warehouse.address" class="text-sm text-muted-foreground">{{ warehouse.address }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <Button @click="openEditMode">
                <Edit class="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="outline" @click="closeModal">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
        </ScrollArea>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteDialog"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      @click="closeDeleteDialog"
    >
      <div 
        class="bg-background rounded-lg shadow-xl w-full max-w-md p-6"
        @click.stop
      >
        <div class="flex items-center mb-4">
          <AlertTriangle class="h-6 w-6 text-destructive mr-2" />
          <h3 class="text-lg font-semibold">Confirmar Eliminación</h3>
        </div>
        
        <p class="text-muted-foreground mb-6">
          ¿Estás seguro de que deseas eliminar la sucursal 
          <strong>"{{ branchToDelete?.name }}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        
        <div class="flex justify-end space-x-3">
          <Button variant="outline" @click="closeDeleteDialog" :disabled="loading">
            Cancelar
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="loading">
            <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            Eliminar
          </Button>
        </div>
      </div>
    </div>

    <!-- Error/Success Toast -->
    <div
      v-if="toast.show"
      :class="[
        'fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300',
        toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-destructive text-destructive-foreground'
      ]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  X, Edit, AlertTriangle, Building, Plus, RefreshCw, MapPin, 
  Eye, Trash2, Warehouse, Calendar
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import ScrollArea from '@/components/ui/ScrollArea.vue'

import BranchForm from '@/components/branches/BranchForm.vue'

import { useCompaniesStore } from '@/stores/companies'
import { useBranchesStore } from '@/stores/branches'

const companiesStore = useCompaniesStore()
const branchesStore = useBranchesStore()

// Filters
const searchTerm = ref('')
const locationFilter = ref('')
const warehouseFilter = ref('')

const showModal = ref(false)
const modalMode = ref<'create' | 'edit' | 'view'>('create')
const selectedBranch = ref<any>(null)
const showDeleteDialog = ref(false)
const branchToDelete = ref<any>(null)

const loading = computed(() => branchesStore.isLoading)

const selectedCompanyId = computed(() => companiesStore.currentCompany?.id || '')
const currentCompanyName = computed(() => {
  return companiesStore.currentCompany?.trade_name || companiesStore.currentCompany?.legal_name || ''
})

// Computed stats
const totalWarehouses = computed(() => {
  return branchesStore.branches.reduce((total, branch) => {
    return total + (branch.warehouses?.length || 0)
  }, 0)
})

const branchesWithLocation = computed(() => {
  return branchesStore.branches.filter(branch => branch.ubigeo_code).length
})

const branchesThisMonth = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return branchesStore.branches.filter(branch => {
    const createdAt = new Date(branch.created_at)
    return createdAt >= startOfMonth
  }).length
})

// Filtered branches
const filteredBranches = computed(() => {
  let filtered = branchesStore.branches

  // Search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(branch => 
      branch.code.toLowerCase().includes(search) ||
      branch.name.toLowerCase().includes(search) ||
      (branch.address && branch.address.toLowerCase().includes(search))
    )
  }

  // Location filter
  if (locationFilter.value) {
    if (locationFilter.value === 'with') {
      filtered = filtered.filter(branch => branch.ubigeo_code)
    } else if (locationFilter.value === 'without') {
      filtered = filtered.filter(branch => !branch.ubigeo_code)
    }
  }

  // Warehouse filter
  if (warehouseFilter.value) {
    if (warehouseFilter.value === 'with') {
      filtered = filtered.filter(branch => branch.warehouses && branch.warehouses.length > 0)
    } else if (warehouseFilter.value === 'without') {
      filtered = filtered.filter(branch => !branch.warehouses || branch.warehouses.length === 0)
    }
  }

  return filtered
})

const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

const refreshData = async () => {
  if (selectedCompanyId.value) {
    await branchesStore.fetchAll(selectedCompanyId.value)
  }
}

const openCreateModal = () => {
  selectedBranch.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const openEditModal = (branch: any) => {
  selectedBranch.value = branch
  modalMode.value = 'edit'
  showModal.value = true
}

const viewBranch = (branch: any) => {
  selectedBranch.value = branch
  modalMode.value = 'view'
  showModal.value = true
}

const editBranch = (branch: any) => {
  selectedBranch.value = branch
  modalMode.value = 'edit'
  showModal.value = true
}

const openEditMode = () => {
  modalMode.value = 'edit'
}

const closeModal = () => {
  showModal.value = false
  selectedBranch.value = null
}

const deleteBranch = (branch: any) => {
  branchToDelete.value = branch
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  branchToDelete.value = null
}

const handleSubmit = async (formData: any) => {
  try {
    if (modalMode.value === 'create') {
      await branchesStore.create(formData)
      showToast('Sucursal creada exitosamente', 'success')
    } else {
      await branchesStore.update(selectedBranch.value.id, formData)
      showToast('Sucursal actualizada exitosamente', 'success')
    }
    closeModal()
  } catch (error) {
    console.error('Error saving branch:', error)
    showToast('Error al guardar la sucursal', 'error')
  }
}

const confirmDelete = async () => {
  if (!branchToDelete.value) return
  
  try {
    await branchesStore.deleteBranch(branchToDelete.value.id)
    showToast('Sucursal eliminada exitosamente', 'success')
    closeDeleteDialog()
  } catch (error) {
    console.error('Error deleting branch:', error)
    showToast('Error al eliminar la sucursal', 'error')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getUbigeoInfo = (ubigeoCode: string | null) => {
  if (!ubigeoCode || !branchesStore.ubigeoData.length) return null
  
  const ubigeo = branchesStore.ubigeoData.find(u => u.code === ubigeoCode)
  return ubigeo ? `${ubigeo.distrito}, ${ubigeo.provincia}` : null
}

const showToast = (message: string, type: 'success' | 'error') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(() => {
  if (selectedCompanyId.value) {
    branchesStore.fetchAll(selectedCompanyId.value)
  }
  if (branchesStore.ubigeoData.length === 0) {
    branchesStore.fetchUbigeoData()
  }
})

watch(selectedCompanyId, (newCompanyId) => {
  if (newCompanyId) {
    branchesStore.fetchAll(newCompanyId)
  } else {
    branchesStore.reset()
  }
}, { immediate: false })
</script>