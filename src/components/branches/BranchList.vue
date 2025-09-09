<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <MapPin class="h-5 w-5 text-green-500" />
          <CardTitle>Sucursales de {{ companyName }}</CardTitle>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="refreshData" :disabled="loading">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
            Actualizar
          </Button>
          <Button size="sm" @click="openCreateModal">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Sucursal
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Filtros y búsqueda -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              v-model="searchTerm"
              placeholder="Buscar por código, nombre o dirección..."
              class="pl-10"
            />
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span>Cargando sucursales...</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredBranches.length === 0" class="text-center py-12">
        <MapPin class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay sucursales</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchTerm ? 'No se encontraron sucursales con ese criterio de búsqueda.' : 'Comienza creando una nueva sucursal.' }}
        </p>
        <Button v-if="!searchTerm" class="mt-4" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      <!-- Branches table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-medium text-gray-900">Código</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Dirección</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Ubicación</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Almacenes</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Creado</th>
              <th class="text-right py-3 px-4 font-medium text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="branch in filteredBranches"
              :key="branch.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-4 px-4">
                <Badge variant="outline" class="font-mono">
                  {{ branch.code }}
                </Badge>
              </td>
              <td class="py-4 px-4">
                <div class="font-medium text-gray-900">{{ branch.name }}</div>
              </td>
              <td class="py-4 px-4">
                <div class="text-sm text-gray-600 max-w-xs truncate">
                  {{ branch.address || 'Sin dirección' }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div v-if="getUbigeoInfo(branch.ubigeo_code)" class="text-sm text-gray-600">
                  {{ getUbigeoInfo(branch.ubigeo_code) }}
                </div>
                <div v-else class="text-sm text-gray-400">Sin ubicación</div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                  <Warehouse class="h-4 w-4 text-gray-400" />
                  <span class="text-sm text-gray-600">
                    {{ branch.warehouses?.length || 0 }}
                  </span>
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="text-sm text-gray-600">
                  {{ formatDate(branch.created_at) }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="viewBranch(branch)"
                    class="h-8 w-8 p-0"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="editBranch(branch)"
                    class="h-8 w-8 p-0"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="deleteBranch(branch)"
                    class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-6 pt-6 border-t">
        <div class="text-sm text-gray-600">
          Mostrando {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredBranches.length) }} de {{ filteredBranches.length }} sucursales
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="currentPage--"
            :disabled="currentPage === 1"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="currentPage++"
            :disabled="currentPage === totalPages"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  MapPin, 
  Plus, 
  RefreshCw, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Warehouse,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

import { useBranchesStore } from '@/stores/branches'

const props = defineProps<{
  companyId: string
  companyName: string
}>()

const emit = defineEmits<{
  create: []
  edit: [branch: any]
  view: [branch: any]
  delete: [branch: any]
}>()

const branchesStore = useBranchesStore()

const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = 20

const loading = computed(() => branchesStore.isLoading)

const filteredBranches = computed(() => {
  let filtered = branchesStore.branches

  // Filtrar por búsqueda
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(branch => 
      branch.code.toLowerCase().includes(search) ||
      branch.name.toLowerCase().includes(search) ||
      (branch.address && branch.address.toLowerCase().includes(search))
    )
  }

  // Paginar
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = branchesStore.branches

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(branch => 
      branch.code.toLowerCase().includes(search) ||
      branch.name.toLowerCase().includes(search) ||
      (branch.address && branch.address.toLowerCase().includes(search))
    )
  }

  return Math.ceil(filtered.length / pageSize)
})

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

const refreshData = async () => {
  await branchesStore.fetchAll(props.companyId)
}

const openCreateModal = () => {
  emit('create')
}

const viewBranch = (branch: any) => {
  emit('view', branch)
}

const editBranch = (branch: any) => {
  emit('edit', branch)
}

const deleteBranch = (branch: any) => {
  emit('delete', branch)
}

watch(() => props.companyId, (newCompanyId) => {
  if (newCompanyId) {
    currentPage.value = 1
    refreshData()
  }
}, { immediate: true })

onMounted(() => {
  if (branchesStore.ubigeoData.length === 0) {
    branchesStore.fetchUbigeoData()
  }
})
</script>