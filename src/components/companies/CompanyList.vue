<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Building class="h-5 w-5 text-blue-500" />
          <CardTitle>Gestión de Empresas</CardTitle>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="refreshData" :disabled="loading">
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
            Actualizar
          </Button>
          <Button size="sm" @click="openCreateModal">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Filtros y búsqueda -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <Input
            v-model="searchTerm"
            placeholder="Buscar por RUC, razón social o nombre comercial..."
            class="w-full"
          >
            <template #prefix>
              <Search class="h-4 w-4 text-gray-400" />
            </template>
          </Input>
        </div>
        <div class="w-full sm:w-auto">
          <select
            v-model="currencyFilter"
            class="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">Todas las monedas</option>
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-2">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span>Cargando empresas...</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredCompanies.length === 0" class="text-center py-12">
        <Building class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-semibold text-gray-900">No hay empresas</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ searchTerm ? 'No se encontraron empresas con ese criterio de búsqueda.' : 'Comienza creando una nueva empresa.' }}
        </p>
        <Button v-if="!searchTerm" class="mt-4" @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      <!-- Companies grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="company in filteredCompanies"
          :key="company.id"
          class="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <Badge variant="outline" class="text-xs">
                    {{ company.currency_code }}
                  </Badge>
                  <Badge 
                    :variant="company.production ? 'default' : 'outline'"
                    class="text-xs"
                  >
                    {{ company.production ? 'Producción' : 'Pruebas' }}
                  </Badge>
                </div>
                <CardTitle class="text-base leading-tight">
                  {{ company.trade_name || company.legal_name }}
                </CardTitle>
                <p class="text-sm text-gray-600 mt-1">
                  RUC: {{ company.ruc }}
                </p>
              </div>
              <div class="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="viewCompany(company)"
                  class="h-8 w-8 p-0"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="editCompany(company)"
                  class="h-8 w-8 p-0"
                >
                  <Edit class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="deleteCompany(company)"
                  class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent class="pt-0">
            <div class="space-y-2">
              <div v-if="company.email" class="flex items-center gap-2 text-sm text-gray-600">
                <Mail class="h-3 w-3" />
                {{ company.email }}
              </div>
              <div v-if="company.phone" class="flex items-center gap-2 text-sm text-gray-600">
                <Phone class="h-3 w-3" />
                {{ company.phone }}
              </div>
              <div v-if="company.website" class="flex items-center gap-2 text-sm text-gray-600">
                <Globe class="h-3 w-3" />
                <a :href="company.website" target="_blank" class="text-blue-600 hover:underline">
                  {{ formatWebsite(company.website) }}
                </a>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <Calendar class="h-3 w-3" />
                {{ formatDate(company.created_at) }}
              </div>
            </div>

            <!-- Branches count -->
            <div v-if="company.branches?.length" class="mt-3 pt-3 border-t">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <MapPin class="h-3 w-3" />
                {{ company.branches.length }} {{ company.branches.length === 1 ? 'sucursal' : 'sucursales' }}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-6 pt-6 border-t">
        <div class="text-sm text-gray-600">
          Mostrando {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredCompanies.length) }} de {{ filteredCompanies.length }} empresas
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
import { ref, computed, onMounted } from 'vue'
import { 
  Building, 
  Plus, 
  RefreshCw, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
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

import { useCompaniesStore } from '@/stores/companies'

const emit = defineEmits<{
  create: []
  edit: [company: any]
  view: [company: any]
  delete: [company: any]
}>()

const companiesStore = useCompaniesStore()

const searchTerm = ref('')
const currencyFilter = ref('')
const currentPage = ref(1)
const pageSize = 12

const loading = computed(() => companiesStore.isLoading)

const filteredCompanies = computed(() => {
  let filtered = companiesStore.companies

  // Filtrar por búsqueda
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(company => 
      company.ruc.toLowerCase().includes(search) ||
      company.legal_name.toLowerCase().includes(search) ||
      (company.trade_name && company.trade_name.toLowerCase().includes(search))
    )
  }

  // Filtrar por moneda
  if (currencyFilter.value) {
    filtered = filtered.filter(company => company.currency_code === currencyFilter.value)
  }

  // Paginar
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = companiesStore.companies

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(company => 
      company.ruc.toLowerCase().includes(search) ||
      company.legal_name.toLowerCase().includes(search) ||
      (company.trade_name && company.trade_name.toLowerCase().includes(search))
    )
  }

  if (currencyFilter.value) {
    filtered = filtered.filter(company => company.currency_code === currencyFilter.value)
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

const formatWebsite = (website: string) => {
  return website.replace(/^https?:\/\//, '')
}

const refreshData = async () => {
  await companiesStore.fetchAll()
}

const openCreateModal = () => {
  emit('create')
}

const viewCompany = (company: any) => {
  emit('view', company)
}

const editCompany = (company: any) => {
  emit('edit', company)
}

const deleteCompany = (company: any) => {
  emit('delete', company)
}

onMounted(() => {
  if (companiesStore.companies.length === 0) {
    refreshData()
  }
})
</script>