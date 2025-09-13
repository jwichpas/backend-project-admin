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
    <Dialog v-model="showDetailsModal">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Cliente</DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedCustomer" class="space-y-6">
          <!-- Customer Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre Completo</Label>
              <p class="mt-1 text-foreground">{{ selectedCustomer.fullname }}</p>
            </div>
            
            <div>
              <Label>Tipo de Documento</Label>
              <p class="mt-1 text-foreground">{{ getDocumentTypeName(selectedCustomer.doc_type) }}</p>
            </div>
            
            <div>
              <Label>Número de Documento</Label>
              <p class="mt-1 text-foreground">{{ selectedCustomer.doc_number }}</p>
            </div>
            
            <div>
              <Label>Email</Label>
              <p class="mt-1 text-foreground">{{ selectedCustomer.email || 'No especificado' }}</p>
            </div>
            
            <div>
              <Label>Teléfono</Label>
              <p class="mt-1 text-foreground">{{ selectedCustomer.phone || 'No especificado' }}</p>
            </div>
            
            <div>
              <Label>País</Label>
              <p class="mt-1 text-foreground">{{ selectedCustomer.country_code || 'PE' }}</p>
            </div>
          </div>
          
          <div>
            <Label>Dirección</Label>
            <p class="mt-1 text-foreground">{{ selectedCustomer.address || 'No especificada' }}</p>
          </div>
          
          <!-- Sales Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground">{{ selectedCustomer.total_documents || 0 }}</p>
              <p class="text-sm text-muted-foreground">Documentos</p>
            </div>
            
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground">{{ formatCurrency(selectedCustomer.total_sales || 0) }}</p>
              <p class="text-sm text-muted-foreground">Ventas Totales</p>
            </div>
            
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground">{{ formatCurrency(selectedCustomer.avg_sale_amount || 0) }}</p>
              <p class="text-sm text-muted-foreground">Venta Promedio</p>
            </div>
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
  RefreshCw
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

// Lifecycle
onMounted(() => {
  if (companiesStore.currentCompany?.id) {
    loadCustomers()
  }
})
</script>