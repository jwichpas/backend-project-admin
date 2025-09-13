<template>
  <Dialog v-model="isOpen">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}
        </DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Modifica la información del cliente' : 'Ingresa los datos del nuevo cliente' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Document Type Selection -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="doc_type">Tipo de Documento *</Label>
            <Select v-model="form.doc_type" required>
              <option value="">Seleccionar...</option>
              <option value="1">DNI</option>
              <option value="6">RUC</option>
              <option value="7">Pasaporte</option>
              <option value="A">Cédula Diplomática</option>
              <option value="B">Carnet de Extranjería</option>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="doc_number">Número de Documento *</Label>
            <Input
              id="doc_number"
              v-model="form.doc_number"
              :placeholder="getDocumentPlaceholder(form.doc_type)"
              required
            />
          </div>
        </div>

        <!-- Customer Type Based Fields -->
        <div v-if="isCompany" class="space-y-4">
          <div class="space-y-2">
            <Label for="razon_social">Razón Social *</Label>
            <Input
              id="razon_social"
              v-model="form.razon_social"
              placeholder="Nombre de la empresa"
              required
            />
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="nombres">Nombres *</Label>
              <Input
                id="nombres"
                v-model="form.nombres"
                placeholder="Nombres"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="apellido_paterno">Apellido Paterno *</Label>
              <Input
                id="apellido_paterno"
                v-model="form.apellido_paterno"
                placeholder="Apellido paterno"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="apellido_materno">Apellido Materno</Label>
            <Input
              id="apellido_materno"
              v-model="form.apellido_materno"
              placeholder="Apellido materno"
            />
          </div>
        </div>

        <!-- Contact Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-foreground">Información de Contacto</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div class="space-y-2">
              <Label for="phone">Teléfono</Label>
              <Input
                id="phone"
                v-model="form.phone"
                placeholder="+51 999 999 999"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="address">Dirección</Label>
            <Input
              id="address"
              v-model="form.address"
              placeholder="Dirección completa"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="ubigeo_code">Ubigeo</Label>
              <Input
                id="ubigeo_code"
                v-model="form.ubigeo_code"
                placeholder="150101"
                maxlength="6"
              />
            </div>

            <div class="space-y-2">
              <Label for="country_code">País</Label>
              <Select v-model="form.country_code">
                <option value="PE">Perú</option>
                <option value="US">Estados Unidos</option>
                <option value="AR">Argentina</option>
                <option value="BR">Brasil</option>
                <option value="CL">Chile</option>
                <option value="CO">Colombia</option>
                <option value="EC">Ecuador</option>
                <option value="MX">México</option>
              </Select>
            </div>
          </div>
        </div>

        <!-- Location Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Ubicación GPS</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="getCurrentLocation"
              :disabled="gettingLocation"
            >
              <MapPin class="mr-2 h-4 w-4" />
              {{ gettingLocation ? 'Obteniendo...' : 'Mi Ubicación' }}
            </Button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="latitude">Latitud</Label>
              <Input
                id="latitude"
                v-model="form.latitude"
                type="number"
                step="any"
                placeholder="-12.0464"
              />
            </div>

            <div class="space-y-2">
              <Label for="longitude">Longitud</Label>
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
            <Label for="location_description">Descripción de la Ubicación</Label>
            <Input
              id="location_description"
              v-model="form.location_description"
              placeholder="Oficina principal, almacén, etc."
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>

        <!-- Actions -->
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleCancel">
            Cancelar
          </Button>
          <Button type="submit" :disabled="loading || !isFormValid">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isEditing ? 'Actualizar' : 'Crear' }} Cliente
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCustomersStore, type Customer } from '@/stores/customers'
import { useCompaniesStore } from '@/stores/companies'
import { MapPin, Loader2 } from 'lucide-vue-next'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'

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

// State
const loading = ref(false)
const error = ref<string | null>(null)
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
  if (!form.value.doc_type || !form.value.doc_number) return false
  
  if (isCompany.value) {
    return !!form.value.razon_social
  } else {
    return !!form.value.nombres && !!form.value.apellido_paterno
  }
})

// Methods
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
}

const loadCustomerData = () => {
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
  } else {
    resetForm()
  }
}

const getDocumentPlaceholder = (docType: string) => {
  const placeholders: Record<string, string> = {
    '1': '12345678',
    '6': '20123456789',
    '7': 'A12345678',
    'A': 'CD123456',
    'B': 'CE123456'
  }
  return placeholders[docType] || ''
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'La geolocalización no está soportada en este navegador'
    return
  }

  gettingLocation.value = true
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.latitude = position.coords.latitude.toString()
      form.value.longitude = position.coords.longitude.toString()
      gettingLocation.value = false
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

const handleSubmit = async () => {
  if (!isFormValid.value || !companiesStore.currentCompany?.id) return

  loading.value = true
  error.value = null

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
      country_code: form.value.country_code
    }

    let customer: Customer
    
    if (isEditing.value && props.customer) {
      customer = await customersStore.updateCustomer(props.customer.id, customerData)
    } else {
      customer = await customersStore.createCustomer(companiesStore.currentCompany.id, customerData)
    }

    // Add location if provided
    if (form.value.latitude && form.value.longitude) {
      await customersStore.addCustomerLocation(customer.id, {
        latitude: parseFloat(form.value.latitude),
        longitude: parseFloat(form.value.longitude),
        sequence: null,
        is_primary: true,
        description: form.value.location_description || null
      })
    }

    emit('saved')
    handleCancel()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al guardar cliente'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  isOpen.value = false
  resetForm()
}

// Watch for changes in modal visibility and customer prop
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

// Clear company-specific fields when document type changes
watch(() => form.value.doc_type, () => {
  if (isCompany.value) {
    form.value.nombres = ''
    form.value.apellido_paterno = ''
    form.value.apellido_materno = ''
  } else {
    form.value.razon_social = ''
  }
})
</script>