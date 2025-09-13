<template>
  <div class="p-6 space-y-6">
    <!-- Header with actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
        <p class="text-muted-foreground">Administra la información de tus clientes</p>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar clientes..."
            class="pl-10 w-64"
          />
        </div>
        
        <!-- Filter by document type -->
        <Select v-model="selectedDocType">
          <option value="">Todos los tipos</option>
          <option value="1">DNI</option>
          <option value="6">RUC</option>
          <option value="7">Pasaporte</option>
          <option value="A">Cédula Diplomática</option>
        </Select>
        
        <!-- Add Customer Button -->
        <Button @click="openCreateModal" class="whitespace-nowrap">
          <Plus class="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <Users class="h-8 w-8 text-blue-500 dark:text-blue-400" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Total Clientes</p>
            <p class="text-2xl font-bold text-foreground">{{ customersStore.totalCustomers }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <User class="h-8 w-8 text-green-500 dark:text-green-400" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Personas</p>
            <p class="text-2xl font-bold text-foreground">{{ customersStore.totalIndividuals }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <Building class="h-8 w-8 text-purple-500 dark:text-purple-400" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Empresas</p>
            <p class="text-2xl font-bold text-foreground">{{ customersStore.totalCompanies }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center">
          <MapPin class="h-8 w-8 text-orange-500 dark:text-orange-400" />
          <div class="ml-4">
            <p class="text-sm font-medium text-muted-foreground">Con Ubicación</p>
            <p class="text-2xl font-bold text-foreground">{{ customersStore.totalWithLocation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Customers Table -->
    <div class="bg-card border border-border rounded-lg">
      <div class="p-6">
        <div v-if="customersStore.loading" class="flex justify-center py-8">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        
        <div v-else-if="customersStore.error" class="text-center py-8">
          <p class="text-destructive">{{ customersStore.error }}</p>
          <Button @click="loadCustomers" variant="outline" class="mt-4">
            <RefreshCw class="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-4 font-semibold text-foreground">Cliente</th>
                <th class="text-left p-4 font-semibold text-foreground">Documento</th>
                <th class="text-left p-4 font-semibold text-foreground">Contacto</th>
                <th class="text-left p-4 font-semibold text-foreground">Ubicación</th>
                <th class="text-left p-4 font-semibold text-foreground">Ventas</th>
                <th class="text-right p-4 font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="customer in filteredCustomers" 
                :key="customer.id"
                class="border-b border-border hover:bg-muted/50"
              >
                <td class="p-4">
                  <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                      <User v-if="customer.doc_type === '1'" class="h-5 w-5 text-muted-foreground" />
                      <Building v-else class="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p class="font-medium text-foreground">{{ customer.fullname }}</p>
                      <p class="text-sm text-muted-foreground">{{ getCustomerType(customer.doc_type) }}</p>
                    </div>
                  </div>
                </td>
                
                <td class="p-4">
                  <div>
                    <p class="font-medium text-foreground">{{ customer.doc_number }}</p>
                    <p class="text-sm text-muted-foreground">{{ getDocumentTypeName(customer.doc_type) }}</p>
                  </div>
                </td>
                
                <td class="p-4">
                  <div>
                    <p class="text-sm text-foreground">{{ customer.email || 'Sin email' }}</p>
                    <p class="text-sm text-muted-foreground">{{ customer.phone || 'Sin teléfono' }}</p>
                  </div>
                </td>
                
                <td class="p-4">
                  <div class="flex items-center">
                    <MapPin class="h-4 w-4 text-muted-foreground mr-2" />
                    <div>
                      <p class="text-sm text-foreground">{{ customer.address || 'Sin dirección' }}</p>
                      <p class="text-xs text-muted-foreground">{{ getLocationName(customer.ubigeo_code) }}</p>
                    </div>
                  </div>
                </td>
                
                <td class="p-4">
                  <div>
                    <p class="font-medium text-foreground">{{ formatCurrency(customer.total_sales || 0) }}</p>
                    <p class="text-sm text-muted-foreground">{{ customer.total_documents || 0 }} docs</p>
                  </div>
                </td>
                
                <td class="p-4 text-right">
                  <div class="flex justify-end items-center gap-2">
                    <Button
                      @click="showCustomerDetails(customer)"
                      variant="ghost"
                      size="sm"
                    >
                      <Eye class="h-4 w-4" />
                    </Button>
                    
                    <Button
                      @click="editCustomer(customer)"
                      variant="ghost"
                      size="sm"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                    
                    <Button
                      @click="showCustomerLocation(customer)"
                      variant="ghost"
                      size="sm"
                      :disabled="!customer.has_location"
                    >
                      <MapPin class="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="filteredCustomers.length === 0" class="text-center py-8">
            <Users class="mx-auto h-12 w-12 text-muted-foreground" />
            <p class="mt-4 text-lg font-semibold text-foreground">No se encontraron clientes</p>
            <p class="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Details Modal -->
    <Dialog :open="showDetailsModal" @update:open="(open) => showDetailsModal = open">
      <DialogContent class="max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader class="pb-4">
          <DialogTitle class="flex items-center gap-3 text-xl">
            <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User v-if="selectedCustomer?.doc_type === '1'" class="h-5 w-5 text-primary" />
              <Building v-else class="h-5 w-5 text-primary" />
            </div>
            <div>
              <div class="font-bold">{{ selectedCustomer?.fullname }}</div>
              <div class="text-sm text-muted-foreground font-normal">
                {{ getCustomerType(selectedCustomer?.doc_type || '') }} • {{ getDocumentTypeName(selectedCustomer?.doc_type || '') }}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedCustomer" class="space-y-6">
          <!-- Customer Overview Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Sales Card -->
            <div class="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-200/20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm text-green-700 dark:text-green-400">Ventas Totales</h4>
                <TrendingUp class="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(selectedCustomer.total_sales || 0) }}
              </p>
              <p class="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                Promedio: {{ formatCurrency(selectedCustomer.avg_sale_amount || 0) }}
              </p>
            </div>

            <!-- Documents Card -->
            <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200/20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm text-blue-700 dark:text-blue-400">Documentos</h4>
                <FileText class="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ selectedCustomer.total_documents || 0 }}
              </p>
              <p class="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                Última compra: {{ selectedCustomer.last_purchase_date ? formatDate(selectedCustomer.last_purchase_date) : 'N/A' }}
              </p>
            </div>

            <!-- Location Card -->
            <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-200/20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm text-purple-700 dark:text-purple-400">Ubicación</h4>
                <MapPin class="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p class="text-sm font-medium text-purple-600 dark:text-purple-400">
                {{ selectedCustomer.has_location ? 'GPS Registrada' : 'Sin Coordenadas' }}
              </p>
              <p class="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                {{ getLocationName(selectedCustomer.ubigeo_code) }}
              </p>
            </div>
          </div>

          <!-- Customer Information Sections -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Personal/Company Information -->
            <div class="space-y-4">
              <div class="border border-border rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <IdCard class="h-4 w-4" />
                  Información de Identificación
                </h3>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-start">
                    <span class="text-sm text-muted-foreground">Documento:</span>
                    <div class="text-right">
                      <p class="font-mono text-sm font-medium">{{ selectedCustomer.doc_number }}</p>
                      <p class="text-xs text-muted-foreground">{{ getDocumentTypeName(selectedCustomer.doc_type) }}</p>
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-start">
                    <span class="text-sm text-muted-foreground">Tipo:</span>
                    <span class="text-sm font-medium">{{ getCustomerType(selectedCustomer.doc_type) }}</span>
                  </div>
                  
                  <div class="flex justify-between items-start">
                    <span class="text-sm text-muted-foreground">País:</span>
                    <span class="text-sm font-medium">{{ getCountryName(selectedCustomer.country_code) }}</span>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="border border-border rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mail class="h-4 w-4" />
                  Información de Contacto
                </h3>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-muted-foreground">Email:</span>
                    <div class="text-right">
                      <p class="text-sm font-medium">{{ selectedCustomer.email || 'No especificado' }}</p>
                      <Button 
                        v-if="selectedCustomer.email" 
                        variant="ghost" 
                        size="sm" 
                        class="h-6 px-2 text-xs"
                        @click="copyToClipboard(selectedCustomer.email)"
                      >
                        <Copy class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-muted-foreground">Teléfono:</span>
                    <div class="text-right">
                      <p class="text-sm font-medium">{{ selectedCustomer.phone || 'No especificado' }}</p>
                      <Button 
                        v-if="selectedCustomer.phone" 
                        variant="ghost" 
                        size="sm" 
                        class="h-6 px-2 text-xs"
                        @click="callPhone(selectedCustomer.phone)"
                      >
                        <Phone class="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Address and Location -->
            <div class="space-y-4">
              <div class="border border-border rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin class="h-4 w-4" />
                  Dirección y Ubicación
                </h3>
                
                <div class="space-y-3">
                  <div>
                    <span class="text-sm text-muted-foreground">Dirección:</span>
                    <p class="text-sm font-medium mt-1">
                      {{ selectedCustomer.address || 'No especificada' }}
                    </p>
                  </div>
                  
                  <div>
                    <span class="text-sm text-muted-foreground">Ubigeo:</span>
                    <p class="text-sm font-medium mt-1">
                      {{ getLocationName(selectedCustomer.ubigeo_code) }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Código: {{ selectedCustomer.ubigeo_code || 'N/A' }}
                    </p>
                  </div>
                  
                  <div v-if="selectedCustomer.has_location && selectedCustomer.primary_location" class="pt-2 border-t border-border">
                    <span class="text-sm text-muted-foreground">Coordenadas GPS:</span>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-xs font-mono">
                        {{ selectedCustomer.primary_location.latitude }}, {{ selectedCustomer.primary_location.longitude }}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-6 px-2"
                        @click="openMaps(selectedCustomer.primary_location!.latitude, selectedCustomer.primary_location!.longitude)"
                      >
                        <ExternalLink class="h-3 w-3" />
                      </Button>
                    </div>
                    <p v-if="selectedCustomer.primary_location.description" class="text-xs text-muted-foreground mt-1">
                      {{ selectedCustomer.primary_location.description }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Account Information -->
              <div class="border border-border rounded-lg p-4">
                <h3 class="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  Información de Cuenta
                </h3>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-start">
                    <span class="text-sm text-muted-foreground">Creado:</span>
                    <span class="text-sm font-medium">{{ formatDate(selectedCustomer.created_at) }}</span>
                  </div>
                  
                  <div class="flex justify-between items-start">
                    <span class="text-sm text-muted-foreground">Actualizado:</span>
                    <span class="text-sm font-medium">{{ formatDate(selectedCustomer.updated_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" @click="showDetailsModal = false">
              <X class="mr-2 h-4 w-4" />
              Cerrar
            </Button>
            <Button @click="editCustomer(selectedCustomer)">
              <Pencil class="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Create/Edit Customer Modal -->
    <CustomerFormModal
      v-model="showFormModal"
      :customer="editingCustomer"
      @saved="handleCustomerSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCustomersStore } from '@/stores/customers'
import { useCompaniesStore } from '@/stores/companies'
import {
  Search,
  Plus,
  Users,
  User,
  Building,
  MapPin,
  Eye,
  Pencil,
  Loader2,
  RefreshCw,
  TrendingUp,
  FileText,
  IdCard,
  Mail,
  Copy,
  Phone,
  Clock,
  ExternalLink,
  X
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Label from '@/components/ui/Label.vue'
import CustomerFormModal from '@/components/customers/CustomerFormModal.vue'

const customersStore = useCustomersStore()
const companiesStore = useCompaniesStore()

// State
const searchQuery = ref('')
const selectedDocType = ref('')
const showDetailsModal = ref(false)
const showFormModal = ref(false)
const selectedCustomer = ref(null)
const editingCustomer = ref(null)

// Computed
const filteredCustomers = computed(() => {
  let customers = customersStore.customers

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    customers = customers.filter(customer =>
      customer.fullname?.toLowerCase().includes(query) ||
      customer.doc_number?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    )
  }

  // Filter by document type
  if (selectedDocType.value) {
    customers = customers.filter(customer => customer.doc_type === selectedDocType.value)
  }

  return customers
})

// Methods
const getDocumentTypeName = (docType: string) => {
  const types: Record<string, string> = {
    '1': 'DNI',
    '6': 'RUC',
    '7': 'Pasaporte',
    'A': 'Cédula Diplomática',
    'B': 'Carnet de Extranjería'
  }
  return types[docType] || docType
}

const getCustomerType = (docType: string) => {
  return docType === '6' ? 'Empresa' : 'Persona'
}

const getLocationName = (ubigeoCode: string | null) => {
  if (!ubigeoCode) return 'Sin ubicación'
  // This would ideally come from a ubigeo service/store
  return ubigeoCode
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}

const loadCustomers = async () => {
  if (!companiesStore.currentCompany?.id) return
  
  try {
    await customersStore.fetchCustomers(companiesStore.currentCompany.id)
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

const openCreateModal = () => {
  editingCustomer.value = null
  showFormModal.value = true
}

const editCustomer = (customer: any) => {
  editingCustomer.value = customer
  showFormModal.value = true
}

const showCustomerDetails = (customer: any) => {
  selectedCustomer.value = customer
  showDetailsModal.value = true
}

const showCustomerLocation = (customer: any) => {
  // Navigate to customer location view or show map modal
  // This would integrate with the location features
  console.log('Show location for customer:', customer.id)
}

const handleCustomerSaved = () => {
  showFormModal.value = false
  editingCustomer.value = null
  loadCustomers()
}

const getCountryName = (code: string) => {
  const countries: Record<string, string> = {
    'PE': 'Perú',
    'US': 'Estados Unidos',
    'AR': 'Argentina',
    'BR': 'Brasil',
    'CL': 'Chile',
    'CO': 'Colombia',
    'EC': 'Ecuador',
    'MX': 'México'
  }
  return countries[code] || code
}

const formatDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // Could add a toast notification here
  } catch (err) {
    console.error('Error copying to clipboard:', err)
  }
}

const callPhone = (phone: string) => {
  window.open(`tel:${phone}`)
}

const openMaps = (latitude: number, longitude: number) => {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`
  window.open(url, '_blank')
}

// Lifecycle
onMounted(() => {
  if (companiesStore.currentCompany?.id) {
    loadCustomers()
  }
})
</script>