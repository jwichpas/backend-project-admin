<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Proveedores</h1>
        <p class="text-muted-foreground">
          Gestiona tus proveedores y su información comercial
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button @click="showCreateModal = true" size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>
    </div>

    <!-- Supplier Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Proveedores</p>
              <p class="text-2xl font-bold">{{ suppliersStore.stats.total }}</p>
            </div>
            <Truck class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Empresas</p>
              <p class="text-2xl font-bold text-green-600">{{ suppliersStore.stats.companies }}</p>
            </div>
            <Building2 class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Personas</p>
              <p class="text-2xl font-bold text-amber-600">{{ suppliersStore.stats.individuals }}</p>
            </div>
            <User class="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Recientes (30d)</p>
              <p class="text-2xl font-bold text-purple-600">{{ suppliersStore.stats.recentlyAdded }}</p>
            </div>
            <TrendingUp class="h-8 w-8 text-purple-500" />
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
              v-model="searchQuery" 
              placeholder="Nombre, documento, email..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Tipo</label>
            <select 
              v-model="typeFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos los tipos</option>
              <option value="company">Empresas</option>
              <option value="individual">Personas</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select 
              v-model="statusFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="recent">Recientes</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Documento</label>
            <select 
              v-model="docFilter"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos</option>
              <option value="6">RUC</option>
              <option value="1">DNI</option>
              <option value="7">Pasaporte</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Suppliers Table -->
    <Card>
      <CardHeader>
        <CardTitle>Lista de Proveedores</CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ filteredSuppliers.length }} proveedor{{ filteredSuppliers.length !== 1 ? 'es' : '' }} encontrado{{ filteredSuppliers.length !== 1 ? 's' : '' }}
        </p>
      </CardHeader>
      <CardContent class="p-0">
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
          <Truck class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No hay proveedores</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery ? 'No se encontraron proveedores con ese criterio' : 'Comienza agregando tu primer proveedor' }}
          </p>
          <Button v-if="!searchQuery" @click="showCreateModal = true">
            <Plus class="mr-2 h-4 w-4" />
            Agregar Proveedor
          </Button>
        </div>
        
        <Table v-else>
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
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Building2 v-if="supplier.party_type === 'company'" class="h-5 w-5 text-white" />
                    <User v-else class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ supplier.name }}</p>
                    <p v-if="supplier.commercial_name" class="text-sm text-muted-foreground">{{ supplier.commercial_name }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <code class="bg-muted px-2 py-1 rounded text-sm">{{ supplier.doc_number }}</code>
                  <p class="text-xs text-muted-foreground mt-1">{{ supplier.doc_type }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p class="text-sm">{{ supplier.email || '-' }}</p>
                  <p class="text-sm text-muted-foreground">{{ supplier.phone || supplier.mobile || '-' }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="supplier.party_type === 'company' ? 'default' : 'secondary'">
                  {{ supplier.party_type === 'company' ? 'Empresa' : 'Persona' }}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p class="text-sm">{{ formatDate(supplier.created_at) }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatRelativeDate(supplier.created_at) }}</p>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="viewSupplierDetails(supplier)" title="Ver perfil">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="editSupplier(supplier)" title="Editar">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Más opciones">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
                <div class="h-16 w-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Building2 v-if="selectedSupplier.party_type === 'company'" class="h-8 w-8 text-white" />
                  <User v-else class="h-8 w-8 text-white" />
                </div>
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
import { ref, computed, onMounted } from 'vue'
import { useSuppliersStore, type Supplier } from '@/stores/suppliers'
import { useAuthStore } from '@/stores/auth'
import { useCompaniesStore } from '@/stores/companies'
import {
  Download,
  Plus,
  Truck,
  Building2,
  User,
  TrendingUp,
  Eye,
  Edit,
  MoreVertical,
  RotateCcw,
  FileText,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
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
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Label from '@/components/ui/Label.vue'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'

// Stores
const suppliersStore = useSuppliersStore()
const authStore = useAuthStore()
const companiesStore = useCompaniesStore()

// Reactive state
const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const docFilter = ref('all')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const selectedSupplier = ref<Supplier | null>(null)

// Computed
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
  
  // Filter by status
  if (statusFilter.value === 'recent') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    suppliers = suppliers.filter(s => new Date(s.created_at) > thirtyDaysAgo)
  }
  
  // Filter by document type
  if (docFilter.value !== 'all') {
    suppliers = suppliers.filter(s => s.doc_type === docFilter.value)
  }
  
  return suppliers
})

// Methods
const loadSuppliers = async () => {
  if (!companiesStore.currentCompany?.id) return
  await suppliersStore.fetchSuppliers(companiesStore.currentCompany.id)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Hoy'
  if (diffInDays === 1) return 'Ayer'
  if (diffInDays <= 7) return `Hace ${diffInDays} días`
  if (diffInDays <= 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
  return `Hace ${Math.floor(diffInDays / 30)} meses`
}

const viewSupplierDetails = (supplier: Supplier) => {
  selectedSupplier.value = supplier
  showDetailsModal.value = true
}

const editSupplier = (supplier: Supplier) => {
  selectedSupplier.value = supplier
  showEditModal.value = true
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