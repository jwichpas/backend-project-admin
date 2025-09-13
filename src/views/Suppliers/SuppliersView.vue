<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Proveedores</h1>
        <p class="text-muted-foreground">
          Gestiona y administra todos tus proveedores
        </p>
      </div>
      <Button @click="showCreateModal = true" class="w-full sm:w-auto">
        <Plus class="mr-2 h-4 w-4" />
        Nuevo Proveedor
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Proveedores</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ suppliersStore.stats.total }}</div>
          <p class="text-xs text-muted-foreground">
            Proveedores activos registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Empresas</CardTitle>
          <Building2 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ suppliersStore.stats.companies }}</div>
          <p class="text-xs text-muted-foreground">
            Proveedores corporativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Personas</CardTitle>
          <User class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ suppliersStore.stats.individuals }}</div>
          <p class="text-xs text-muted-foreground">
            Proveedores individuales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Recientes</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ suppliersStore.stats.recentlyAdded }}</div>
          <p class="text-xs text-muted-foreground">
            Últimos 30 días
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Search and Filters -->
    <Card>
      <CardContent class="pt-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                placeholder="Buscar proveedores..."
                class="pl-8"
              />
            </div>
          </div>
          <Select 
            v-model="typeFilter" 
            :options="typeFilterOptions"
            placeholder="Tipo"
            class="w-full sm:w-[180px]"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Suppliers Table -->
    <Card>
      <CardHeader>
        <CardTitle>Lista de Proveedores</CardTitle>
        <CardDescription>
          {{ filteredSuppliers.length }} proveedor{{ filteredSuppliers.length !== 1 ? 'es' : '' }} encontrado{{ filteredSuppliers.length !== 1 ? 's' : '' }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="suppliersStore.loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        
        <div v-else-if="suppliersStore.error" class="text-center py-8">
          <div class="text-destructive mb-2">Error al cargar los proveedores</div>
          <p class="text-sm text-muted-foreground mb-4">{{ suppliersStore.error }}</p>
          <Button @click="loadSuppliers" variant="outline">
            <RotateCcw class="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
        
        <div v-else-if="filteredSuppliers.length === 0" class="text-center py-8">
          <Users class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No hay proveedores</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery ? 'No se encontraron proveedores con ese criterio' : 'Comienza agregando tu primer proveedor' }}
          </p>
          <Button v-if="!searchQuery" @click="showCreateModal = true">
            <Plus class="mr-2 h-4 w-4" />
            Agregar Proveedor
          </Button>
        </div>
        
        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="supplier in filteredSuppliers" :key="supplier.id">
                <TableCell>
                  <div class="flex items-center space-x-3">
                    <Avatar class="h-8 w-8">
                      <AvatarFallback class="text-xs">
                        {{ getSupplierInitials(supplier) }}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div class="font-medium">{{ supplier.name }}</div>
                      <div v-if="supplier.commercial_name" class="text-sm text-muted-foreground">
                        {{ supplier.commercial_name }}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div class="font-medium">{{ supplier.doc_number }}</div>
                    <div class="text-sm text-muted-foreground">{{ supplier.doc_type }}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div v-if="supplier.email" class="text-sm">{{ supplier.email }}</div>
                    <div v-if="supplier.phone" class="text-sm text-muted-foreground">{{ supplier.phone }}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="supplier.party_type === 'company' ? 'default' : 'secondary'">
                    {{ supplier.party_type === 'company' ? 'Empresa' : 'Persona' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="text-sm">
                    {{ formatDate(supplier.created_at) }}
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">Abrir menú</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="viewSupplierDetails(supplier)">
                        <Eye class="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="editSupplier(supplier)">
                        <Edit class="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        @click="deleteSupplier(supplier)" 
                        class="text-destructive focus:text-destructive"
                      >
                        <Trash2 class="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Supplier Modal -->
    <SupplierFormModal 
      :open="showCreateModal || showEditModal"
      @update:open="(open) => {
        if (!open) {
          showCreateModal = false
          showEditModal = false
          selectedSupplier = null
        }
      }"
      :supplier="selectedSupplier"
      @supplier-saved="handleSupplierSaved"
    />

    <!-- Supplier Details Modal -->
    <Dialog :open="showDetailsModal" @update:open="(open) => showDetailsModal = open">
      <DialogContent class="max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Proveedor</DialogTitle>
          <DialogDescription>
            Información completa del proveedor seleccionado
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedSupplier" class="space-y-6">
          <!-- Header Section -->
          <div class="flex flex-col sm:flex-row gap-6">
            <div class="flex-1">
              <div class="flex items-start gap-4">
                <Avatar class="h-16 w-16">
                  <AvatarFallback class="text-xl">
                    {{ getSupplierInitials(selectedSupplier) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex-1">
                  <h2 class="text-2xl font-bold">{{ selectedSupplier.name }}</h2>
                  <p v-if="selectedSupplier.commercial_name" class="text-lg text-muted-foreground">
                    {{ selectedSupplier.commercial_name }}
                  </p>
                  <div class="flex items-center gap-2 mt-2">
                    <Badge :variant="selectedSupplier.party_type === 'company' ? 'default' : 'secondary'">
                      {{ selectedSupplier.party_type === 'company' ? 'Empresa' : 'Persona' }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex flex-col sm:flex-row gap-2">
              <Button @click="editSupplier(selectedSupplier)" variant="outline">
                <Edit class="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          <!-- Information Grid -->
          <div class="grid gap-6 md:grid-cols-2">
            <!-- Document Information -->
            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <FileText class="h-5 w-5" />
                  Información de Documento
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Tipo de Documento</Label>
                  <p class="text-sm">{{ selectedSupplier.doc_type }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Número</Label>
                  <p class="text-sm font-mono">{{ selectedSupplier.doc_number }}</p>
                </div>
              </CardContent>
            </Card>

            <!-- Contact Information -->
            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <Mail class="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div v-if="selectedSupplier.email">
                  <Label class="text-sm font-medium text-muted-foreground">Email</Label>
                  <div class="flex items-center justify-between">
                    <p class="text-sm">{{ selectedSupplier.email }}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      @click="openEmailClient(selectedSupplier.email!)"
                    >
                      <Mail class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div v-if="selectedSupplier.phone">
                  <Label class="text-sm font-medium text-muted-foreground">Teléfono</Label>
                  <div class="flex items-center justify-between">
                    <p class="text-sm">{{ selectedSupplier.phone }}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      @click="callPhone(selectedSupplier.phone!)"
                    >
                      <Phone class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div v-if="selectedSupplier.mobile">
                  <Label class="text-sm font-medium text-muted-foreground">Celular</Label>
                  <div class="flex items-center justify-between">
                    <p class="text-sm">{{ selectedSupplier.mobile }}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      @click="callPhone(selectedSupplier.mobile!)"
                    >
                      <Smartphone class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div v-if="selectedSupplier.website">
                  <Label class="text-sm font-medium text-muted-foreground">Sitio Web</Label>
                  <div class="flex items-center justify-between">
                    <p class="text-sm">{{ selectedSupplier.website }}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      @click="openWebsite(selectedSupplier.website!)"
                    >
                      <ExternalLink class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Address Information -->
            <Card v-if="selectedSupplier.address || selectedSupplier.ubigeo">
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <MapPin class="h-5 w-5" />
                  Información de Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div v-if="selectedSupplier.address">
                  <Label class="text-sm font-medium text-muted-foreground">Dirección</Label>
                  <p class="text-sm">{{ selectedSupplier.address }}</p>
                </div>
                
                <div v-if="selectedSupplier.reference">
                  <Label class="text-sm font-medium text-muted-foreground">Referencia</Label>
                  <p class="text-sm">{{ selectedSupplier.reference }}</p>
                </div>
                
                <div v-if="selectedSupplier.ubigeo">
                  <Label class="text-sm font-medium text-muted-foreground">Ubigeo</Label>
                  <p class="text-sm font-mono">{{ selectedSupplier.ubigeo }}</p>
                </div>
                
                <div v-if="selectedSupplier.coordinates">
                  <Label class="text-sm font-medium text-muted-foreground">Coordenadas</Label>
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-mono">{{ selectedSupplier.coordinates }}</p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      @click="openMaps(selectedSupplier.coordinates!)"
                    >
                      <MapPin class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Additional Information -->
            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <Clock class="h-5 w-5" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Fecha de Registro</Label>
                  <p class="text-sm">{{ formatDate(selectedSupplier.created_at) }}</p>
                </div>
                
                <div>
                  <Label class="text-sm font-medium text-muted-foreground">Última Actualización</Label>
                  <p class="text-sm">{{ formatDate(selectedSupplier.updated_at) }}</p>
                </div>
                
                <div v-if="selectedSupplier.notes">
                  <Label class="text-sm font-medium text-muted-foreground">Notas</Label>
                  <p class="text-sm">{{ selectedSupplier.notes }}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSuppliersStore, type Supplier } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'
import { useCompaniesStore } from '@/stores/companies'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Input from '@/components/ui/Input.vue'
import Table from '@/components/ui/Table.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import DropdownMenuContent from '@/components/ui/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/ui/DropdownMenuItem.vue'
import DropdownMenuSeparator from '@/components/ui/DropdownMenuSeparator.vue'
import DropdownMenuTrigger from '@/components/ui/DropdownMenuTrigger.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Avatar from '@/components/ui/Avatar.vue'
import AvatarFallback from '@/components/ui/AvatarFallback.vue'
import Label from '@/components/ui/Label.vue'
import {
  Plus, Users, Building2, User, TrendingUp, Search,
  MoreHorizontal, Eye, Edit, Trash2, RotateCcw,
  FileText, Mail, Phone, Smartphone, MapPin, Clock,
  ExternalLink
} from 'lucide-vue-next'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'

// Stores
const suppliersStore = useSuppliersStore()
const authStore = useAuthStore()
const companiesStore = useCompaniesStore()

// Reactive state
const searchQuery = ref('')
const typeFilter = ref('all')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const selectedSupplier = ref<Supplier | null>(null)

// Computed
const typeFilterOptions = computed(() => [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'individual', label: 'Personas' },
  { value: 'company', label: 'Empresas' }
])

const filteredSuppliers = computed(() => {
  let suppliers = suppliersStore.suppliers
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    suppliers = suppliersStore.searchSuppliers(searchQuery.value)
  }
  
  // Filter by type
  if (typeFilter.value !== 'all') {
    suppliers = suppliers.filter(s => s.party_type === typeFilter.value)
  }
  
  return suppliers
})

// Methods
const loadSuppliers = async () => {
  if (!companiesStore.currentCompany?.id) return
  await suppliersStore.fetchSuppliers(companiesStore.currentCompany.id)
}

const getSupplierInitials = (supplier: Supplier): string => {
  const name = supplier.commercial_name || supplier.name
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const viewSupplierDetails = (supplier: Supplier) => {
  selectedSupplier.value = supplier
  showDetailsModal.value = true
}

const editSupplier = (supplier: Supplier) => {
  selectedSupplier.value = supplier
  showEditModal.value = true
}

const deleteSupplier = async (supplier: Supplier) => {
  if (confirm(`¿Estás seguro de que deseas eliminar al proveedor "${supplier.name}"?`)) {
    const success = await suppliersStore.deleteSupplier(supplier.id)
    if (success) {
      showDetailsModal.value = false
    }
  }
}

const handleSupplierSaved = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedSupplier.value = null
}

// Contact actions
const openEmailClient = (email: string) => {
  window.open(`mailto:${email}`, '_blank')
}

const callPhone = (phone: string) => {
  window.open(`tel:${phone}`, '_blank')
}

const openWebsite = (website: string) => {
  const url = website.startsWith('http') ? website : `https://${website}`
  window.open(url, '_blank')
}

const openMaps = (coordinates: string) => {
  const [lat, lng] = coordinates.split(',')
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
}

// Lifecycle
onMounted(() => {
  if (companiesStore.currentCompany?.id) {
    loadSuppliers()
  }
})
</script>