<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Empresas</h1>
        <p class="text-muted-foreground">
          Administra las empresas del sistema
        </p>
      </div>
      <div class="flex items-center gap-3">
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

    <!-- Quick Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Empresas</p>
              <p class="text-2xl font-bold">{{ companiesStore.companies.length }}</p>
            </div>
            <Building class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Sucursales</p>
              <p class="text-2xl font-bold">{{ totalBranches }}</p>
            </div>
            <MapPin class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Con Sitio Web</p>
              <p class="text-2xl font-bold">{{ companiesWithWebsite }}</p>
            </div>
            <Globe class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Creadas Este Mes</p>
              <p class="text-2xl font-bold text-emerald-600">{{ companiesThisMonth }}</p>
            </div>
            <Calendar class="h-8 w-8 text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="RUC, razón social, nombre comercial..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Moneda</label>
            <select 
              v-model="currencyFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Método de Valuación</label>
            <select 
              v-model="valuationFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="AVERAGE">Promedio</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Con Sitio Web</label>
            <select 
              v-model="websiteFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas</option>
              <option value="with">Con sitio web</option>
              <option value="without">Sin sitio web</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Companies Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Empresas ({{ filteredCompanies.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <ScrollArea class="h-[600px]">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-2">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <span>Cargando empresas...</span>
          </div>
        </div>

        <div v-else-if="filteredCompanies.length === 0" class="text-center py-12">
          <Building class="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 class="mt-2 text-sm font-semibold">No hay empresas</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ searchTerm ? 'No se encontraron empresas con ese criterio de búsqueda.' : 'Comienza creando una nueva empresa.' }}
          </p>
          <Button v-if="!searchTerm" class="mt-4" @click="openCreateModal">
            <Plus class="mr-2 h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Sucursales</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="company in filteredCompanies" :key="company.id">
              <TableCell>
                <div>
                  <p class="font-medium">{{ company.trade_name || company.legal_name }}</p>
                  <p v-if="company.trade_name" class="text-sm text-muted-foreground">{{ company.legal_name }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="font-mono">{{ company.ruc }}</Badge>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  <p v-if="company.email">{{ company.email }}</p>
                  <p v-if="company.phone" class="text-muted-foreground">{{ company.phone }}</p>
                  <div v-if="!company.email && !company.phone" class="text-muted-foreground">Sin contacto</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="company.currency_code === 'PEN' ? 'default' : 'secondary'">
                  {{ company.currency_code }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm font-medium">{{ company.branches?.length || 0 }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  {{ formatDate(company.created_at) }}
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="viewCompany(company)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="editCompany(company)"
                    title="Editar"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    @click="deleteCompany(company)"
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

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      @click="closeModal"
    >
      <div 
        class="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh]"
        @click.stop
      >
        <div class="sticky top-0 bg-background border-b px-6 py-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              {{ modalMode === 'create' ? 'Nueva Empresa' : modalMode === 'edit' ? 'Editar Empresa' : 'Ver Empresa' }}
            </h2>
            <Button variant="ghost" size="sm" @click="closeModal">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea class="max-h-[calc(90vh-80px)]">
        <div class="p-6">
          <CompanyForm
            v-if="modalMode !== 'view'"
            :initial-data="selectedCompany"
            :mode="modalMode"
            :loading="loading"
            @submit="handleSubmit"
            @cancel="closeModal"
          />
          
          <!-- View Mode -->
          <div v-else-if="selectedCompany" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-lg font-medium border-b pb-2">Información Básica</h3>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">RUC</label>
                  <p class="font-mono">{{ selectedCompany.ruc }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Razón Social</label>
                  <p>{{ selectedCompany.legal_name }}</p>
                </div>
                
                <div v-if="selectedCompany.trade_name">
                  <label class="text-sm font-medium text-muted-foreground">Nombre Comercial</label>
                  <p>{{ selectedCompany.trade_name }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Moneda</label>
                  <p>{{ selectedCompany.currency_code }}</p>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Método de Valuación</label>
                  <p>{{ selectedCompany.valuation_method }}</p>
                </div>
              </div>
              
              <div class="space-y-4">
                <h3 class="text-lg font-medium border-b pb-2">Contacto</h3>
                
                <div v-if="selectedCompany.email">
                  <label class="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{{ selectedCompany.email }}</p>
                </div>
                
                <div v-if="selectedCompany.phone">
                  <label class="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p>{{ selectedCompany.phone }}</p>
                </div>
                
                <div v-if="selectedCompany.address">
                  <label class="text-sm font-medium text-muted-foreground">Dirección</label>
                  <p>{{ selectedCompany.address }}</p>
                </div>
                
                <div v-if="selectedCompany.website">
                  <label class="text-sm font-medium text-muted-foreground">Sitio Web</label>
                  <p>
                    <a :href="selectedCompany.website" target="_blank" class="text-primary hover:underline">
                      {{ selectedCompany.website }}
                    </a>
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Branches -->
            <div v-if="selectedCompany.branches?.length" class="space-y-4">
              <h3 class="text-lg font-medium border-b pb-2">Sucursales</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="branch in selectedCompany.branches"
                  :key="branch.id"
                  class="p-4 border rounded-lg"
                >
                  <div class="flex items-center justify-between mb-2">
                    <Badge variant="outline" class="font-mono">{{ branch.code }}</Badge>
                  </div>
                  <h4 class="font-medium">{{ branch.name }}</h4>
                  <p v-if="branch.address" class="text-sm text-muted-foreground mt-1">{{ branch.address }}</p>
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
          ¿Estás seguro de que deseas eliminar la empresa 
          <strong>"{{ companyToDelete?.trade_name || companyToDelete?.legal_name }}"</strong>?
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
import { ref, computed, onMounted } from 'vue'
import { 
  X, Edit, AlertTriangle, Building, Plus, RefreshCw, MapPin, 
  Eye, Trash2, Globe, Calendar
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

import CompanyForm from '@/components/companies/CompanyForm.vue'

import { useCompaniesStore } from '@/stores/companies'

const companiesStore = useCompaniesStore()

// Filters
const searchTerm = ref('')
const currencyFilter = ref('')
const valuationFilter = ref('')
const websiteFilter = ref('')

const showModal = ref(false)
const modalMode = ref<'create' | 'edit' | 'view'>('create')
const selectedCompany = ref<any>(null)
const showDeleteDialog = ref(false)
const companyToDelete = ref<any>(null)

const loading = computed(() => companiesStore.isLoading)

// Computed stats
const totalBranches = computed(() => {
  return companiesStore.companies.reduce((total, company) => {
    return total + (company.branches?.length || 0)
  }, 0)
})

const companiesWithWebsite = computed(() => {
  return companiesStore.companies.filter(company => company.website).length
})

const companiesThisMonth = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  return companiesStore.companies.filter(company => {
    const createdAt = new Date(company.created_at)
    return createdAt >= startOfMonth
  }).length
})

// Filtered companies
const filteredCompanies = computed(() => {
  let filtered = companiesStore.companies

  // Search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(company => 
      company.ruc.toLowerCase().includes(search) ||
      company.legal_name.toLowerCase().includes(search) ||
      (company.trade_name && company.trade_name.toLowerCase().includes(search))
    )
  }

  // Currency filter
  if (currencyFilter.value) {
    filtered = filtered.filter(company => company.currency_code === currencyFilter.value)
  }

  // Valuation method filter
  if (valuationFilter.value) {
    filtered = filtered.filter(company => company.valuation_method === valuationFilter.value)
  }

  // Website filter
  if (websiteFilter.value) {
    if (websiteFilter.value === 'with') {
      filtered = filtered.filter(company => company.website)
    } else if (websiteFilter.value === 'without') {
      filtered = filtered.filter(company => !company.website)
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
  await companiesStore.fetchAll()
}

const openCreateModal = () => {
  selectedCompany.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const viewCompany = (company: any) => {
  selectedCompany.value = company
  modalMode.value = 'view'
  showModal.value = true
}

const editCompany = (company: any) => {
  selectedCompany.value = company
  modalMode.value = 'edit'
  showModal.value = true
}

const openEditMode = () => {
  modalMode.value = 'edit'
}

const closeModal = () => {
  showModal.value = false
  selectedCompany.value = null
}

const deleteCompany = (company: any) => {
  companyToDelete.value = company
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  companyToDelete.value = null
}

const handleSubmit = async (formData: any) => {
  try {
    if (modalMode.value === 'create') {
      await companiesStore.create(formData)
      showToast('Empresa creada exitosamente', 'success')
    } else {
      await companiesStore.update(selectedCompany.value.id, formData)
      showToast('Empresa actualizada exitosamente', 'success')
    }
    closeModal()
  } catch (error) {
    console.error('Error saving company:', error)
    showToast('Error al guardar la empresa', 'error')
  }
}

const confirmDelete = async () => {
  if (!companyToDelete.value) return
  
  try {
    await companiesStore.deleteCompany(companyToDelete.value.id)
    showToast('Empresa eliminada exitosamente', 'success')
    closeDeleteDialog()
  } catch (error) {
    console.error('Error deleting company:', error)
    showToast('Error al eliminar la empresa', 'error')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const showToast = (message: string, type: 'success' | 'error') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(() => {
  if (companiesStore.companies.length === 0) {
    companiesStore.fetchAll()
  }
})
</script>