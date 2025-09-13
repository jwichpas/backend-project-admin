<template>
  <Dialog :open="isOpen" @update:open="(open) => isOpen = open">
    <DialogContent class="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <User v-if="!isCompany" class="h-5 w-5" />
          <Building v-else class="h-5 w-5" />
          {{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}
        </DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Modifica la información del cliente' : 'Ingresa los datos del nuevo cliente' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Document Type and Number -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="doc_type" class="text-sm font-medium">Tipo de Documento *</Label>
            <SearchableSelect
              v-model="form.doc_type"
              :options="sunatData.documentTypeOptions.value"
              :loading="sunatData.loadingDocTypes.value"
              placeholder="Selecciona el tipo de documento"
              loadingMessage="Cargando tipos de documento..."
              emptyMessage="No hay tipos de documento disponibles"
              :allow-search="false"
              input-id="doc_type"
            />
            <div v-if="sunatData.errorDocTypes.value" class="text-xs text-destructive">
              {{ sunatData.errorDocTypes.value }}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="doc_number" class="text-sm font-medium">Número de Documento *</Label>
            <Input
              id="doc_number"
              v-model="form.doc_number"
              :placeholder="getDocumentPlaceholder(form.doc_type)"
              :maxlength="getDocumentMaxLength(form.doc_type)"
              required
              class="font-mono"
            />
            <div class="text-xs text-muted-foreground">
              {{ getDocumentHelperText(form.doc_type) }}
            </div>
          </div>
        </div>

        <!-- Dynamic Fields Based on Document Type -->
        <div class="border border-border rounded-lg p-4 space-y-4">
          <h3 class="font-semibold text-sm text-foreground flex items-center gap-2">
            <User v-if="!isCompany" class="h-4 w-4" />
            <Building v-else class="h-4 w-4" />
            {{ isCompany ? 'Información de la Empresa' : 'Información Personal' }}
          </h3>
          
          <!-- Company Fields -->
          <div v-if="isCompany" class="space-y-4">
            <div class="space-y-2">
              <Label for="razon_social" class="text-sm font-medium">Razón Social *</Label>
              <Input
                id="razon_social"
                v-model="form.razon_social"
                placeholder="Nombre completo de la empresa"
                required
              />
            </div>
          </div>

          <!-- Individual Fields -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="nombres" class="text-sm font-medium">Nombres *</Label>
                <Input
                  id="nombres"
                  v-model="form.nombres"
                  placeholder="Nombres completos"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="apellido_paterno" class="text-sm font-medium">Apellido Paterno *</Label>
                <Input
                  id="apellido_paterno"
                  v-model="form.apellido_paterno"
                  placeholder="Apellido paterno"
                  required
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="apellido_materno" class="text-sm font-medium">Apellido Materno</Label>
              <Input
                id="apellido_materno"
                v-model="form.apellido_materno"
                placeholder="Apellido materno (opcional)"
              />
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="border border-border rounded-lg p-4 space-y-4">
          <h3 class="font-semibold text-sm text-foreground flex items-center gap-2">
            <Mail class="h-4 w-4" />
            Información de Contacto
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="email" class="text-sm font-medium">Email</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div class="space-y-2">
              <Label for="phone" class="text-sm font-medium">Teléfono</Label>
              <Input
                id="phone"
                v-model="form.phone"
                placeholder="+51 999 999 999"
              />
            </div>
          </div>
        </div>

        <!-- Address and Location -->
        <div class="border border-border rounded-lg p-4 space-y-4">
          <h3 class="font-semibold text-sm text-foreground flex items-center gap-2">
            <MapPin class="h-4 w-4" />
            Dirección y Ubicación
          </h3>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="address" class="text-sm font-medium">Dirección</Label>
              <Input
                id="address"
                v-model="form.address"
                placeholder="Av. Principal 123, Urbanización..."
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="ubigeo_search" class="text-sm font-medium">Ubicación (Ubigeo)</Label>
                <SearchableSelect
                  v-model="form.ubigeo_code"
                  :options="sunatData.ubigeoOptions.value"
                  :loading="sunatData.loadingUbigeo.value"
                  placeholder="Buscar departamento, provincia o distrito..."
                  loadingMessage="Buscando ubicaciones..."
                  emptyMessage="Ingresa al menos 2 caracteres para buscar"
                  @search="handleUbigeoSearch"
                  input-id="ubigeo_search"
                  :search-delay="500"
                />
                <div v-if="sunatData.errorUbigeo.value" class="text-xs text-destructive">
                  {{ sunatData.errorUbigeo.value }}
                </div>
              </div>

              <div class="space-y-2">
                <Label for="country_code" class="text-sm font-medium">País</Label>
                <select 
                  id="country_code" 
                  v-model="form.country_code"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="PE">Perú</option>
                  <option value="US">Estados Unidos</option>
                  <option value="AR">Argentina</option>
                  <option value="BR">Brasil</option>
                  <option value="CL">Chile</option>
                  <option value="CO">Colombia</option>
                  <option value="EC">Ecuador</option>
                  <option value="MX">México</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- GPS Location (Collapsible) -->
        <div class="border border-border rounded-lg p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-sm text-foreground flex items-center gap-2">
              <Navigation class="h-4 w-4" />
              Coordenadas GPS
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              @click="getCurrentLocation"
              :disabled="gettingLocation"
            >
              <Loader2 v-if="gettingLocation" class="mr-2 h-4 w-4 animate-spin" />
              <MapPin v-else class="mr-2 h-4 w-4" />
              {{ gettingLocation ? 'Obteniendo...' : 'Obtener Ubicación' }}
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="latitude" class="text-sm font-medium">Latitud</Label>
              <Input
                id="latitude"
                v-model="form.latitude"
                type="number"
                step="any"
                placeholder="-12.0464"
              />
            </div>

            <div class="space-y-2">
              <Label for="longitude" class="text-sm font-medium">Longitud</Label>
              <Input
                id="longitude"
                v-model="form.longitude"
                type="number"
                step="any"
                placeholder="-77.0428"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="location_description" class="text-sm font-medium">Descripción de la Ubicación</Label>
            <Input
              id="location_description"
              v-model="form.location_description"
              placeholder="Oficina principal, almacén, tienda, etc."
            />
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-4 w-4 text-destructive" />
            <p class="text-sm text-destructive font-medium">Error</p>
          </div>
          <p class="text-sm text-destructive mt-1">{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div class="flex items-center gap-2">
            <CheckCircle class="h-4 w-4 text-green-600" />
            <p class="text-sm text-green-600 font-medium">{{ successMessage }}</p>
          </div>
        </div>

        <!-- Actions -->
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="handleCancel">
            <X class="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" :disabled="loading || !isFormValid" class="min-w-[120px]">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            {{ isEditing ? 'Actualizar' : 'Crear' }} Cliente
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCustomersStore, type Customer } from '@/stores/customers'
import { useCompaniesStore } from '@/stores/companies'
import { useSunatData } from '@/composables/useSunatData'
import { 
  MapPin, 
  Loader2, 
  User, 
  Building, 
  Mail, 
  Navigation,
  AlertCircle,
  CheckCircle,
  X,
  Save
} from 'lucide-vue-next'

// UI Components
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'

interface Props {
  modelValue: boolean
  customer?: Customer | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const customersStore = useCustomersStore()
const companiesStore = useCompaniesStore()
const sunatData = useSunatData()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const gettingLocation = ref(false)

// Form data
const form = ref({
  doc_type: '',
  doc_number: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  razon_social: '',
  email: '',
  phone: '',
  address: '',
  ubigeo_code: '',
  country_code: 'PE',
  latitude: '',
  longitude: '',
  location_description: ''
})

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.customer)
const isCompany = computed(() => form.value.doc_type === '6')

const isFormValid = computed(() => {
  const hasDocInfo = form.value.doc_type && form.value.doc_number
  const hasNameInfo = isCompany.value 
    ? form.value.razon_social.trim() 
    : form.value.nombres.trim() && form.value.apellido_paterno.trim()
  
  return hasDocInfo && hasNameInfo
})

// Methods
const getDocumentPlaceholder = (docType: string) => {
  const placeholders: Record<string, string> = {
    '1': '12345678 (8 dígitos)',
    '6': '20123456789 (11 dígitos)',
    '7': 'A12345678',
    'A': 'CD123456',
    'B': 'CE123456'
  }
  return placeholders[docType] || 'Número de documento'
}

const getDocumentMaxLength = (docType: string) => {
  const maxLengths: Record<string, number> = {
    '1': 8,
    '6': 11,
    '7': 12,
    'A': 8,
    'B': 8
  }
  return maxLengths[docType] || 20
}

const getDocumentHelperText = (docType: string) => {
  const helpers: Record<string, string> = {
    '1': 'DNI debe tener 8 dígitos',
    '6': 'RUC debe tener 11 dígitos',
    '7': 'Pasaporte: letras y números',
    'A': 'Cédula Diplomática',
    'B': 'Carnet de Extranjería'
  }
  return helpers[docType] || ''
}

const handleUbigeoSearch = (searchTerm: string) => {
  sunatData.searchUbigeo(searchTerm)
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'La geolocalización no está soportada en este navegador'
    return
  }

  gettingLocation.value = true
  error.value = null
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.latitude = position.coords.latitude.toString()
      form.value.longitude = position.coords.longitude.toString()
      gettingLocation.value = false
      successMessage.value = 'Ubicación obtenida exitosamente'
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    },
    (err) => {
      error.value = 'No se pudo obtener la ubicación: ' + err.message
      gettingLocation.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

const resetForm = () => {
  form.value = {
    doc_type: '',
    doc_number: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    razon_social: '',
    email: '',
    phone: '',
    address: '',
    ubigeo_code: '',
    country_code: 'PE',
    latitude: '',
    longitude: '',
    location_description: ''
  }
  
  error.value = null
  successMessage.value = null
}

const loadCustomerData = async () => {
  if (props.customer) {
    form.value = {
      doc_type: props.customer.doc_type,
      doc_number: props.customer.doc_number,
      nombres: props.customer.nombres || '',
      apellido_paterno: props.customer.apellido_paterno || '',
      apellido_materno: props.customer.apellido_materno || '',
      razon_social: props.customer.razon_social || '',
      email: props.customer.email || '',
      phone: props.customer.phone || '',
      address: props.customer.address || '',
      ubigeo_code: props.customer.ubigeo_code || '',
      country_code: props.customer.country_code || 'PE',
      latitude: props.customer.primary_location?.latitude?.toString() || '',
      longitude: props.customer.primary_location?.longitude?.toString() || '',
      location_description: props.customer.primary_location?.description || ''
    }
    
    // Load ubigeo display name for editing if code exists
    if (props.customer.ubigeo_code) {
      try {
        const ubigeoLocation = await sunatData.findUbigeoByCode(props.customer.ubigeo_code)
        if (ubigeoLocation) {
          // The SearchableSelect will automatically show the correct label
          // We just need to make sure the ubigeo options contain this item
          if (!sunatData.ubigeoLocations.value.find(loc => loc.code === props.customer.ubigeo_code)) {
            sunatData.ubigeoLocations.value.unshift(ubigeoLocation)
          }
        }
      } catch (error) {
        console.warn('Could not load ubigeo for editing:', error)
      }
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value || !companiesStore.currentCompany?.id) return

  loading.value = true
  error.value = null
  successMessage.value = null

  try {
    const customerData = {
      doc_type: form.value.doc_type,
      doc_number: form.value.doc_number,
      nombres: isCompany.value ? null : form.value.nombres,
      apellido_paterno: isCompany.value ? null : form.value.apellido_paterno,
      apellido_materno: isCompany.value ? null : (form.value.apellido_materno || null),
      razon_social: isCompany.value ? form.value.razon_social : null,
      email: form.value.email || null,
      phone: form.value.phone || null,
      address: form.value.address || null,
      ubigeo_code: form.value.ubigeo_code || null,
      country_code: form.value.country_code || 'PE'
    }

    let customer
    if (isEditing.value && props.customer) {
      customer = await customersStore.updateCustomer(props.customer.id, customerData)
      successMessage.value = 'Cliente actualizado exitosamente'
    } else {
      customer = await customersStore.createCustomer(companiesStore.currentCompany.id, customerData)
      successMessage.value = 'Cliente creado exitosamente'
    }

    // Add or update location if provided
    if (form.value.latitude && form.value.longitude) {
      await customersStore.addCustomerLocation(customer.id, {
        latitude: parseFloat(form.value.latitude),
        longitude: parseFloat(form.value.longitude),
        sequence: null,
        is_primary: true,
        description: form.value.location_description || null
      })
    }

    setTimeout(() => {
      emit('saved')
      handleCancel()
    }, 1500)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al guardar cliente'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  isOpen.value = false
  setTimeout(() => {
    resetForm()
  }, 300)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadCustomerData()
  }
})

watch(() => props.customer, () => {
  if (props.modelValue) {
    loadCustomerData()
  }
})

// Clear type-specific fields when document type changes
watch(() => form.value.doc_type, () => {
  if (isCompany.value) {
    form.value.nombres = ''
    form.value.apellido_paterno = ''
    form.value.apellido_materno = ''
  } else {
    form.value.razon_social = ''
  }
})

// Load initial data
onMounted(async () => {
  await sunatData.fetchDocumentTypes()
})
</script>