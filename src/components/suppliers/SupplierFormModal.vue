<template>
  <Dialog :open="open" @update:open="(openValue) => $emit('update:open', openValue)">
    <DialogContent class="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
        </DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Actualiza la información del proveedor' : 'Completa los datos para registrar un nuevo proveedor' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b">
            <User class="h-4 w-4 text-primary" />
            <h3 class="font-semibold">Información Básica</h3>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <Label for="party_type">Tipo de Proveedor *</Label>
              <Select 
                v-model="form.party_type" 
                :options="partyTypeOptions"
                placeholder="Selecciona el tipo"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="doc_type">Tipo de Documento *</Label>
              <SearchableSelect
                v-model="form.doc_type"
                :options="sunatData.documentTypeOptions.value"
                :loading="sunatData.loadingDocTypes.value"
                :error="sunatData.errorDocTypes.value"
                placeholder="Selecciona el tipo de documento"
                input-id="doc_type"
                @search="handleDocumentTypeSearch"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="doc_number">Número de Documento *</Label>
              <Input
                id="doc_number"
                v-model="form.doc_number"
                placeholder="Ingresa el número"
                required
                maxlength="15"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="name">
                {{ form.party_type === 'company' ? 'Razón Social' : 'Nombres y Apellidos' }} *
              </Label>
              <Input
                id="name"
                v-model="form.name"
                :placeholder="form.party_type === 'company' ? 'Ej: ACME Corp S.A.C.' : 'Ej: Juan Pérez García'"
                required
                maxlength="100"
              />
            </div>

            <div v-if="form.party_type === 'company'" class="space-y-2">
              <Label for="commercial_name">Nombre Comercial</Label>
              <Input
                id="commercial_name"
                v-model="form.commercial_name"
                placeholder="Ej: ACME Store"
                maxlength="100"
              />
            </div>
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b">
            <Mail class="h-4 w-4 text-primary" />
            <h3 class="font-semibold">Información de Contacto</h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="email">Correo Electrónico</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="proveedor@empresa.com"
                maxlength="100"
              />
            </div>

            <div class="space-y-2">
              <Label for="phone">Teléfono</Label>
              <Input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="(01) 234-5678"
                maxlength="20"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="mobile">Celular</Label>
              <Input
                id="mobile"
                v-model="form.mobile"
                type="tel"
                placeholder="987 654 321"
                maxlength="20"
              />
            </div>

            <div v-if="form.party_type === 'company'" class="space-y-2">
              <Label for="website">Sitio Web</Label>
              <Input
                id="website"
                v-model="form.website"
                type="url"
                placeholder="https://empresa.com"
                maxlength="200"
              />
            </div>
          </div>
        </div>

        <!-- Address Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b">
            <MapPin class="h-4 w-4 text-primary" />
            <h3 class="font-semibold">Información de Ubicación</h3>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="address">Dirección</Label>
              <Textarea
                id="address"
                v-model="form.address"
                placeholder="Av. Principal 123, Distrito"
                rows="2"
                maxlength="200"
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="ubigeo">Ubigeo (Distrito)</Label>
                <SearchableSelect
                  v-model="form.ubigeo"
                  :options="sunatData.ubigeoOptions.value"
                  :loading="sunatData.loadingUbigeo.value"
                  :error="sunatData.errorUbigeo.value"
                  placeholder="Buscar distrito..."
                  input-id="ubigeo"
                  @search="handleUbigeoSearch"
                  :allow-search="true"
                />
              </div>

              <div class="space-y-2">
                <Label for="reference">Referencia</Label>
                <Input
                  id="reference"
                  v-model="form.reference"
                  placeholder="Cerca al parque central"
                  maxlength="100"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="coordinates">Coordenadas GPS</Label>
              <div class="flex gap-2">
                <Input
                  id="coordinates"
                  v-model="form.coordinates"
                  placeholder="-12.046374, -77.042793"
                  readonly
                  class="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  @click="getCurrentLocation"
                  :disabled="loadingLocation"
                >
                  <MapPin class="h-4 w-4" :class="{ 'animate-spin': loadingLocation }" />
                  {{ loadingLocation ? 'Ubicando...' : 'Ubicación' }}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                Haz clic en "Ubicación" para obtener las coordenadas actuales
              </p>
            </div>
          </div>
        </div>

        <!-- Additional Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b">
            <FileText class="h-4 w-4 text-primary" />
            <h3 class="font-semibold">Información Adicional</h3>
          </div>

          <div class="space-y-2">
            <Label for="notes">Notas</Label>
            <Textarea
              id="notes"
              v-model="form.notes"
              placeholder="Observaciones adicionales sobre el proveedor..."
              rows="3"
              maxlength="500"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            @click="$emit('update:open', false)"
            class="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full sm:w-auto"
          >
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
            {{ isEditing ? 'Actualizar' : 'Registrar' }} Proveedor
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useSuppliersStore, type Supplier, type CreateSupplierRequest } from '@/stores/suppliers'
import { useCompaniesStore } from '@/stores/companies'
import { useSunatData } from '@/composables/useSunatData'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Select from '@/components/ui/Select.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { User, Mail, MapPin, FileText } from 'lucide-vue-next'

interface Props {
  open: boolean
  supplier?: Supplier | null
}

interface Emits {
  (e: 'update:open', open: boolean): void
  (e: 'supplier-saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Stores and composables
const suppliersStore = useSuppliersStore()
const companiesStore = useCompaniesStore()
const sunatData = useSunatData()

// Form state
const form = ref<CreateSupplierRequest>({
  party_type: 'individual',
  doc_type: '',
  doc_number: '',
  name: '',
  commercial_name: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  address: '',
  reference: '',
  ubigeo: '',
  coordinates: '',
  notes: ''
})

const loading = ref(false)
const loadingLocation = ref(false)

// Computed properties
const isEditing = computed(() => !!props.supplier)

const partyTypeOptions = computed(() => [
  { value: 'individual', label: 'Persona Natural' },
  { value: 'company', label: 'Empresa' }
])

const isFormValid = computed(() => {
  return !!(
    form.value.party_type &&
    form.value.doc_type &&
    form.value.doc_number.trim() &&
    form.value.name.trim()
  )
})

// Methods
const resetForm = () => {
  form.value = {
    party_type: 'individual',
    doc_type: '',
    doc_number: '',
    name: '',
    commercial_name: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    reference: '',
    ubigeo: '',
    coordinates: '',
    notes: ''
  }
}

const loadFormData = (supplier: Supplier) => {
  form.value = {
    party_type: supplier.party_type,
    doc_type: supplier.doc_type,
    doc_number: supplier.doc_number,
    name: supplier.name,
    commercial_name: supplier.commercial_name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    mobile: supplier.mobile || '',
    website: supplier.website || '',
    address: supplier.address || '',
    reference: supplier.reference || '',
    ubigeo: supplier.ubigeo || '',
    coordinates: supplier.coordinates || '',
    notes: supplier.notes || ''
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  if (!companiesStore.currentCompany?.id) {
    console.error('No company selected')
    return
  }

  loading.value = true
  try {
    let result
    if (isEditing.value && props.supplier) {
      result = await suppliersStore.updateSupplier({
        id: props.supplier.id,
        ...form.value
      })
    } else {
      result = await suppliersStore.createSupplier(form.value, companiesStore.currentCompany.id)
    }

    if (result) {
      emit('supplier-saved')
      resetForm()
    }
  } catch (error) {
    console.error('Error saving supplier:', error)
  } finally {
    loading.value = false
  }
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('La geolocalización no es compatible con este navegador')
    return
  }

  loadingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      form.value.coordinates = `${latitude}, ${longitude}`
      loadingLocation.value = false
    },
    (error) => {
      console.error('Error getting location:', error)
      alert('No se pudo obtener la ubicación')
      loadingLocation.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  )
}

const handleDocumentTypeSearch = async (query: string) => {
  // Document types are loaded once and filtered client-side
  if (sunatData.documentTypes.value.length === 0) {
    await sunatData.fetchDocumentTypes()
  }
}

const handleUbigeoSearch = async (query: string) => {
  if (query.trim().length >= 2) {
    await sunatData.searchUbigeo(query)
  }
}

// Watchers
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    // Load SUNAT data when modal opens
    await sunatData.fetchDocumentTypes()
    
    if (props.supplier) {
      loadFormData(props.supplier)
      
      // Load ubigeo data if supplier has ubigeo
      if (props.supplier.ubigeo) {
        await sunatData.findUbigeoByCode(props.supplier.ubigeo)
      }
    } else {
      resetForm()
    }
  }
})

watch(() => form.value.party_type, (newType) => {
  // Reset commercial name and website when switching to individual
  if (newType === 'individual') {
    form.value.commercial_name = ''
    form.value.website = ''
  }
})

watch(() => form.value.doc_type, (newDocType) => {
  // Clear doc number when doc type changes
  form.value.doc_number = ''
})
</script>