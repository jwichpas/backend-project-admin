<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Resumen de Despacho - Venta {{ saleDocumentNumber }}</DialogTitle>
        <DialogDescription>
          Revise la información antes de generar la guía de remisión
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Información de la venta -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm font-medium text-gray-600">Documento:</Label>
                <p class="font-medium">{{ saleDocumentNumber }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Cliente:</Label>
                <p class="font-medium">{{ saleCustomerName }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Total:</Label>
                <p class="font-medium">{{ formatCurrency(saleTotalAmount) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Documento Relacionado -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Documento Relacionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="bg-muted/50 p-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-600">Número de Documento:</Label>
                  <p class="font-medium">{{ saleDocumentNumber }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Tipo de Documento:</Label>
                  <p class="font-medium">{{ getSaleDocumentTypeName() }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">RUC Emisor:</Label>
                  <p class="font-medium">{{ senderCompanyData?.ruc || 'Cargando...' }}</p>
                </div>
              </div>
              <p class="text-sm text-muted-foreground mt-2">
                Esta información se toma automáticamente de la venta seleccionada y la empresa emisora configurada.
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Datos de despacho -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Datos de Despacho</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="dispatch-date">Fecha de Despacho</Label>
                <Input
                  id="dispatch-date"
                  type="date"
                  v-model="dispatchData.dispatch_date"
                  required
                />
              </div>

              <div>
                <Label for="transport-type">Tipo de Transporte</Label>
                <Select
                  v-model="dispatchData.vehicle_type"
                  :options="transportTypeOptions"
                  placeholder="Seleccionar tipo"
                  @update:model-value="onTransportTypeChange"
                />
              </div>
            </div>

            <!-- Dirección de destino -->
            <div>
              <Label for="destination">Dirección de Destino</Label>
              <div class="space-y-3 mt-2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label class="text-sm text-gray-600">Ubigeo</Label>
                    <Input
                      v-model="dispatchData.destination_ubigeo"
                      placeholder="Ubigeo (150101)"
                      required
                    />
                  </div>
                  <div>
                    <Label class="text-sm text-gray-600">Dirección Completa</Label>
                    <Input
                      v-model="dispatchData.destination_address"
                      placeholder="Dirección completa"
                      required
                    />
                  </div>
                </div>
                <div v-if="ubigeoDetails" class="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p class="text-sm font-medium text-blue-800">
                    📍 {{ ubigeoDetails.full_name }}
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    {{ ubigeoDetails.departamento }} > {{ ubigeoDetails.provincia }} > {{ ubigeoDetails.distrito }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Peso total -->
            <div>
              <Label for="total-weight">Peso Total (KG)</Label>
              <Input
                id="total-weight"
                type="number"
                step="0.001"
                v-model.number="dispatchData.total_weight"
                placeholder="0.000"
                required
              />
            </div>

            <!-- Vehículo propio -->
            <div v-if="dispatchData.vehicle_type === 'own'" class="border-t pt-4">
              <h4 class="font-medium mb-3">Datos del Vehículo Propio</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label for="vehicle-plate">Placa del Vehículo</Label>
                  <SearchableSelect
                    v-model="dispatchData.vehicle_plate"
                    :options="availableVehicles"
                    value-key="plate"
                    label-key="display_label"
                    placeholder="Buscar vehículo por placa..."
                    :allow-search="true"
                    :class="{ 'border-red-500': !plateValidation.isValid }"
                  />
                  <div v-if="!plateValidation.isValid" class="text-sm text-red-600 mt-1">
                    {{ plateValidation.message }}
                  </div>
                  <div v-if="plateValidation.isValid && dispatchData.vehicle_plate" class="text-sm text-green-600 mt-1">
                    ✅ Formato válido para SUNAT
                  </div>
                </div>

                <div>
                  <Label for="driver">Conductor</Label>
                  <Select
                    v-model="dispatchData.driver_id"
                    :options="driverOptions"
                    placeholder="Seleccionar conductor"
                    :class="{ 'border-red-500': !licenseValidation.isValid }"
                  />
                  <div v-if="!licenseValidation.isValid" class="text-sm text-red-600 mt-1">
                    {{ licenseValidation.message }}
                  </div>
                  <div v-if="licenseValidation.isValid && dispatchData.driver_id" class="text-sm text-green-600 mt-1">
                    ✅ Licencia válida para SUNAT
                  </div>
                </div>
              </div>
            </div>

            <!-- Vehículo de tercero -->
            <div v-if="dispatchData.vehicle_type === 'third_party'" class="border-t pt-4">
              <h4 class="font-medium mb-3">Datos del Transportista</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label for="carrier-ruc">RUC del Transportista</Label>
                  <Input
                    id="carrier-ruc"
                    v-model="dispatchData.carrier_ruc"
                    placeholder="20123456789"
                    required
                  />
                </div>
                <div>
                  <Label for="carrier-name">Razón Social</Label>
                  <Input
                    id="carrier-name"
                    v-model="dispatchData.carrier_name"
                    placeholder="TRANSPORTES SA"
                    required
                  />
                </div>
                <div>
                  <Label for="carrier-mtc">Número MTC</Label>
                  <Input
                    id="carrier-mtc"
                    v-model="dispatchData.carrier_mtc"
                    placeholder="0001"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Serie de guía -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Serie de Guía de Remisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="series">Serie Disponible</Label>
                <Select
                  v-model="selectedSeriesId"
                  :options="seriesOptions"
                  placeholder="Seleccionar serie"
                  required
                />
              </div>
              <div v-if="selectedSeries">
                <Label class="text-sm font-medium text-gray-600">Número de Guía:</Label>
                <p class="text-lg font-bold text-blue-600">
                  {{ selectedSeries.series }}-{{ String(selectedSeries.last_number + 1).padStart(8, '0') }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Productos -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Productos a Despachar</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2 px-4">Código</th>
                    <th class="text-left py-2 px-4">Descripción</th>
                    <th class="text-left py-2 px-4">Unidad</th>
                    <th class="text-right py-2 px-4">Cantidad</th>
                    <th class="text-right py-2 px-4">Precio Unit.</th>
                    <th class="text-right py-2 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="saleItems.length === 0">
                    <td colspan="6" class="py-4 text-center text-gray-500">
                      No se encontraron productos para despachar
                    </td>
                  </tr>
                  <tr
                    v-else
                    v-for="item in saleItems"
                    :key="item.id"
                    class="border-b"
                  >
                    <td class="py-2 px-4 font-mono">{{ item.product?.code || item.code || 'N/A' }}</td>
                    <td class="py-2 px-4">{{ item.product?.description || item.description || 'N/A' }}</td>
                    <td class="py-2 px-4">{{ item.unit_code || 'NIU' }}</td>
                    <td class="py-2 px-4 text-right">{{ item.quantity || 0 }}</td>
                    <td class="py-2 px-4 text-right">{{ formatCurrency(item.unit_price || 0) }}</td>
                    <td class="py-2 px-4 text-right">{{ formatCurrency(item.total_amount || item.total || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <!-- Vista previa de la guía -->
        <div v-if="showPreview" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Vista Previa de la Guía de Remisión</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p><strong>Emisor:</strong> {{ senderCompanyData?.legal_name || senderCompanyData?.trade_name || 'N/A' }}</p>
                  <p><strong>RUC:</strong> {{ senderCompanyData?.ruc || 'N/A' }}</p>
                  <p><strong>Destinatario:</strong> {{ saleCustomerName }}</p>
                  <p><strong>Documento:</strong> {{ generateGuideNumber() }}</p>
                </div>
                <div>
                  <p><strong>Modalidad:</strong> {{ dispatchData.vehicle_type === 'own' ? 'Transporte Privado' : 'Transporte Público' }}</p>
                  <p><strong>Fecha de Traslado:</strong> {{ formatDate(dispatchData.dispatch_date) }}</p>
                  <p><strong>Peso Total:</strong> {{ dispatchData.total_weight }} KG</p>
                  <p><strong>Total de Items:</strong> {{ saleItems.length }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Mensaje de confirmación -->
        <div v-if="showPreview" class="flex items-start space-x-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle class="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 class="font-medium text-orange-800">Confirmación</h4>
            <p class="text-sm text-orange-700 mt-1">
              Al confirmar el despacho se generará automáticamente la guía de remisión electrónica
              con la serie <strong>{{ selectedSeries?.series }}-{{ String(selectedSeries?.last_number + 1).padStart(8, '0') }}</strong>
              y se enviará a SUNAT.
            </p>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" @click="$emit('close')">
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          @click="generatePreview"
          :disabled="!isValidForPreview"
        >
          <Eye class="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
        <Button
          type="button"
          @click="downloadPDF"
          variant="outline"
          :disabled="!showPreview || loading"
        >
          <Download class="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
        <Button
          @click="confirmDispatch"
          :disabled="!showPreview || loading"
          class="bg-green-600 hover:bg-green-700"
        >
          <Truck class="h-4 w-4 mr-2" />
          {{ loading ? 'Despachando...' : 'Confirmar Despacho' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDespatchGuidesStore } from '@/stores/despatchGuides'
import { useSalesStore } from '@/stores/sales'
import { useCompaniesStore } from '@/stores/companies'
import { useBranchesStore } from '@/stores/branches'
import { supabase } from '@/lib/supabase'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogDescription from '@/components/ui/DialogDescription.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { AlertTriangle, Eye, Download, Truck } from 'lucide-vue-next'

const props = defineProps<{
  sale: any
}>()

const emit = defineEmits(['close', 'success'])

const despatchGuidesStore = useDespatchGuidesStore()
const salesStore = useSalesStore()
const companiesStore = useCompaniesStore()
const branchesStore = useBranchesStore()

const { loading } = despatchGuidesStore

// Estados
const showPreview = ref(false)
const availableSeries = ref([])
const availableDrivers = ref([])
const availableVehicles = ref([])
const selectedSeriesId = ref('')
const ubigeoDetails = ref(null)
const senderCompanyData = ref(null)
const customerData = ref(null)
const branchData = ref(null)

// Validation state for vehicle plate and driver license
const plateValidation = ref({ isValid: true, message: '' })
const licenseValidation = ref({ isValid: true, message: '' })

// Vehicle plate validation function (SUNAT UBL rules)
const validateVehiclePlate = (plate) => {
  if (!plate) {
    plateValidation.value = { isValid: true, message: '' }
    return true
  }

  // SUNAT UBL rules for vehicle plates:
  // - Alfanumérico de 6 a 8 caracteres
  // - Solo letras mayúsculas y números
  // - No espacios, guiones, ni solo ceros

  // Check length (6-8 characters)
  if (plate.length < 6 || plate.length > 8) {
    plateValidation.value = {
      isValid: false,
      message: '⚠️ La placa debe tener entre 6 y 8 caracteres'
    }
    return false
  }

  // Check only uppercase letters and numbers
  const alphanumericRegex = /^[A-Z0-9]+$/
  if (!alphanumericRegex.test(plate)) {
    plateValidation.value = {
      isValid: false,
      message: '⚠️ Solo se permiten letras mayúsculas y números (sin espacios ni guiones)'
    }
    return false
  }

  // Check not only zeros
  if (/^0+$/.test(plate)) {
    plateValidation.value = {
      isValid: false,
      message: '⚠️ No se permite una placa con solo ceros'
    }
    return false
  }

  plateValidation.value = { isValid: true, message: '' }
  return true
}

// Driver license validation function (SUNAT UBL rules)
const validateDriverLicense = (license) => {
  if (!license) {
    licenseValidation.value = { isValid: true, message: '' }
    return true
  }

  // SUNAT UBL rules for driver licenses:
  // - Alfanumérico de 9 a 10 caracteres
  // - Solo letras mayúsculas y números
  // - No solo ceros

  // Check length (9-10 characters)
  if (license.length < 9 || license.length > 10) {
    licenseValidation.value = {
      isValid: false,
      message: '⚠️ La licencia debe tener entre 9 y 10 caracteres'
    }
    return false
  }

  // Check only uppercase letters and numbers
  const alphanumericRegex = /^[A-Z0-9]+$/
  if (!alphanumericRegex.test(license)) {
    licenseValidation.value = {
      isValid: false,
      message: '⚠️ Solo se permiten letras mayúsculas y números (sin espacios ni caracteres especiales)'
    }
    return false
  }

  // Check not only zeros
  if (/^0+$/.test(license)) {
    licenseValidation.value = {
      isValid: false,
      message: '⚠️ No se permite una licencia con solo ceros'
    }
    return false
  }

  licenseValidation.value = { isValid: true, message: '' }
  return true
}

// Datos automáticos del documento relacionado (calculados desde la venta)

// Datos de despacho
const dispatchData = ref({
  dispatch_date: new Date().toISOString().split('T')[0],
  vehicle_type: '',
  destination_ubigeo: '',
  destination_address: '',
  total_weight: 0,
  vehicle_plate: '',
  driver_id: '',
  carrier_ruc: '',
  carrier_name: '',
  carrier_mtc: ''
})

// Watch for plate changes to validate
watch(() => dispatchData.value.vehicle_plate, (newPlate) => {
  validateVehiclePlate(newPlate)
})

// Watch for driver changes to validate license
watch(() => dispatchData.value.driver_id, (newDriverId) => {
  if (newDriverId) {
    const selectedDriver = availableDrivers.value.find(d => d.id === newDriverId)
    if (selectedDriver?.license_number) {
      validateDriverLicense(selectedDriver.license_number)
    }
  } else {
    licenseValidation.value = { isValid: true, message: '' }
  }
})

// Computed - Handle different sale data structures
const saleDocumentNumber = computed(() => {
  return props.sale.document_number || `${props.sale.series}-${String(props.sale.number).padStart(8, '0')}`
})

const saleCustomerName = computed(() => {
  return props.sale.customer?.business_name ||
         props.sale.customer?.full_name ||
         props.sale.customer_name ||
         'Cliente general'
})

const saleTotalAmount = computed(() => {
  return props.sale.total_amount || props.sale.total || 0
})

const saleItems = computed(() => {
  return props.sale.items || []
})

const saleCustomerData = computed(() => {
  return {
    ubigeo_code: props.sale.parties?.ubigeo_code || props.sale.customer?.ubigeo_code,
    address: props.sale.parties?.address || props.sale.customer?.address
  }
})

const transportTypeOptions = computed(() => [
  { value: 'own', label: 'Vehículo Propio (Transporte Privado)' },
  { value: 'third_party', label: 'Vehículo de Tercero (Transporte Público)' }
])

const driverOptions = computed(() => [
  { value: '', label: 'Sin conductor asignado' },
  ...availableDrivers.value.map(driver => ({
    value: driver.id,
    label: `${driver.full_name} - ${driver.license_number}`
  }))
])

const seriesOptions = computed(() =>
  availableSeries.value.map(series => ({
    value: series.id,
    label: `${series.series} (Próximo: ${String(series.last_number + 1).padStart(8, '0')})`
  }))
)

const selectedSeries = computed(() => {
  return availableSeries.value.find(s => s.id === selectedSeriesId.value)
})

const isValidForPreview = computed(() => {
  const basic = dispatchData.value.dispatch_date &&
                 dispatchData.value.vehicle_type &&
                 dispatchData.value.destination_ubigeo &&
                 dispatchData.value.destination_address &&
                 dispatchData.value.total_weight > 0 &&
                 selectedSeriesId.value

  if (!basic) return false

  if (dispatchData.value.vehicle_type === 'own') {
    return dispatchData.value.vehicle_plate
  } else if (dispatchData.value.vehicle_type === 'third_party') {
    return dispatchData.value.carrier_ruc &&
           dispatchData.value.carrier_name &&
           dispatchData.value.carrier_mtc
  }

  return false
})

// Cargar datos iniciales
onMounted(async () => {
  await loadSenderCompanyData()
  await loadBranchData()
  await loadAvailableSeries()
  await loadAvailableDrivers()
  await loadAvailableVehicles()
  await loadCustomerDestinationData()

  // Inicializar peso total basado en los productos
  if (saleItems.value && saleItems.value.length > 0) {
    dispatchData.value.total_weight = saleItems.value.reduce((total, item) => {
      return total + (item.quantity * (item.product?.weight || item.weight || 1))
    }, 0)
  }
})

// Métodos
const loadAvailableSeries = async () => {
  try {
    const branchId = localStorage.getItem('selected_branch_id') || props.sale.branch_id
    const companyId = props.sale.company_id

    const series = await despatchGuidesStore.getAvailableDocumentSeries(
      branchId,
      companyId,
      '09' // Código para guías de remisión
    )

    availableSeries.value = series.filter(s => s.is_active)

    // Auto-seleccionar la primera serie disponible
    if (availableSeries.value.length > 0 && !selectedSeriesId.value) {
      selectedSeriesId.value = availableSeries.value[0].id
      console.log('Serie seleccionada automáticamente:', selectedSeries.value)
    }
  } catch (error) {
    console.error('Error al cargar series:', error)
  }
}

const loadAvailableDrivers = async () => {
  try {
    console.log('🚛 Cargando conductores desde Supabase...')

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')

    if (error) {
      console.error('❌ Error al cargar conductores desde Supabase:', error)
      // Fallback con datos de ejemplo en caso de error
      availableDrivers.value = [
        {
          id: '1',
          full_name: 'Juan Pérez García',
          names: 'Juan',
          last_names: 'Pérez García',
          document_type: 'DNI',
          document_number: '12345678',
          license_number: 'B23773738'
        }
      ]
      return
    }

    if (drivers && drivers.length > 0) {
      console.log('📋 Obteniendo nombres de conductores usando get_driver_name...')

      // Procesar datos reales desde Supabase usando la función get_driver_name
      const processedDrivers = []

      for (const driver of drivers) {
        try {
          // Usar una consulta que replique lo que hace get_driver_name pero retorne todos los campos
          const { data: driverInfoResult, error: infoError } = await supabase
            .from('drivers')
            .select(`
              id,
              license_number,
              parties:party_id (
                fullname,
                doc_number,
                doc_type
              )
            `)
            .eq('id', driver.id)
            .single()

          if (infoError) {
            console.error('❌ Error al obtener información del conductor:', driver.id, infoError)
            continue
          }

          const partyInfo = driverInfoResult?.parties
          const driverName = partyInfo?.fullname || 'Sin nombre'
          const documentNumber = partyInfo?.doc_number || ''
          const documentType = partyInfo?.doc_type || '1'

          console.log('📋 Datos del conductor desde parties:', {
            id: driver.id,
            name: driverName,
            doc_type: documentType,
            doc_number: documentNumber,
            license: driver.license_number
          })

          const processedDriver = {
            id: driver.id,
            full_name: driverName,
            names: driverName.split(' ')[0] || '',
            last_names: driverName.split(' ').slice(1).join(' ') || '',
            document_type: documentType,
            document_number: documentNumber,
            license_number: driver.license_number || ''
          }

          processedDrivers.push(processedDriver)
          console.log('✅ Conductor procesado correctamente:', {
            id: driver.id,
            name: driverName,
            document_type: documentType,
            document_number: documentNumber,
            license: driver.license_number
          })

        } catch (driverError) {
          console.error('❌ Error procesando conductor:', driver.id, driverError)
        }
      }

      availableDrivers.value = processedDrivers
      console.log('✅ Conductores cargados exitosamente:', availableDrivers.value.length, 'conductores')
    } else {
      console.log('ℹ️ No se encontraron conductores en la base de datos')
      availableDrivers.value = []
    }
  } catch (error) {
    console.error('❌ Error al cargar conductores:', error)
    // Fallback con datos de ejemplo en caso de error crítico
    availableDrivers.value = [
      {
        id: '1',
        full_name: 'Juan Pérez García',
        names: 'Juan',
        last_names: 'Pérez García',
        document_type: 'DNI',
        document_number: '12345678',
        license_number: 'B23773738'
      }
    ]
  }
}

const loadAvailableVehicles = async () => {
  try {
    const companyId = localStorage.getItem('selectedCompanyId')
    if (!companyId) return

    // Cargar vehículos desde el sales store
    await salesStore.fetchVehicles(companyId)

    // Formatear vehículos para el SearchableSelect
    availableVehicles.value = salesStore.vehicles.map(vehicle => {
      const plate = vehicle.plate || 'Sin placa'
      const brand = vehicle.brand || ''
      const model = vehicle.model || ''

      let displayLabel = plate
      if (brand || model) {
        const brandModel = [brand, model].filter(Boolean).join(' ')
        displayLabel = `${plate} - ${brandModel}`
      }

      return {
        ...vehicle,
        plate: plate,
        display_label: displayLabel
      }
    })
  } catch (error) {
    console.error('Error al cargar vehículos:', error)
    // Fallback con datos de ejemplo
    availableVehicles.value = [
      {
        id: '1',
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Hiace',
        display_label: 'ABC-123 - Toyota Hiace'
      },
      {
        id: '2',
        plate: 'DEF-456',
        brand: 'Nissan',
        model: 'NV200',
        display_label: 'DEF-456 - Nissan NV200'
      }
    ]
  }
}

const loadBranchData = async () => {
  try {
    const branchId = localStorage.getItem('selected_branch_id') || props.sale.branch_id
    if (!branchId) {
      console.warn('No branch ID found')
      return
    }

    branchData.value = await branchesStore.fetchById(branchId)
    console.log('Branch data loaded:', branchData.value)
  } catch (error) {
    console.error('Error al cargar datos de sucursal:', error)
  }
}

const handleCreateVehicle = (plateValue: string) => {
  // Crear un vehículo temporal para permitir el uso inmediato
  const newVehicle = {
    id: `temp-${Date.now()}`,
    plate: plateValue,
    brand: '',
    model: '',
    display_label: plateValue,
    own: true
  }

  availableVehicles.value.push(newVehicle)
  dispatchData.value.vehicle_plate = plateValue

  // Aquí podrías implementar la lógica para crear el vehículo en el backend
  console.log('Crear nuevo vehículo con placa:', plateValue)
}

const loadUbigeoDetails = async (ubigeoCode, address) => {
  try {
    console.log('Consultando ubigeo:', ubigeoCode)

    // Obtener detalles del ubigeo usando la función de Supabase
    const { data: ubigeoData, error } = await supabase.rpc('get_sunat_ubigeo', {
      search_term: ubigeoCode
    })

    console.log('Respuesta de get_sunat_ubigeo:', { data: ubigeoData, error })

    if (error) {
      console.error('Error al obtener datos de ubigeo:', error)
      // Aún así, prellenar los campos básicos
      dispatchData.value.destination_ubigeo = ubigeoCode
      dispatchData.value.destination_address = address || ''
      return
    }

    if (ubigeoData && ubigeoData.length > 0) {
      const ubigeo = ubigeoData[0]

      // Prellenar campos de destino con datos del cliente
      dispatchData.value.destination_ubigeo = ubigeoCode
      dispatchData.value.destination_address = address || ''

      // Guardar detalles del ubigeo para mostrar al usuario
      ubigeoDetails.value = ubigeo

      console.log('Datos de destino cargados automáticamente:', {
        ubigeo: ubigeoCode,
        details: ubigeo,
        address: address
      })
    } else {
      console.log('No se encontraron datos de ubigeo para:', ubigeoCode)
      // Aún así, prellenar los campos básicos
      dispatchData.value.destination_ubigeo = ubigeoCode
      dispatchData.value.destination_address = address || ''
    }
  } catch (error) {
    console.error('Error al consultar ubigeo:', error)
  }
}

const loadSenderCompanyData = async () => {
  try {
    const companyId = props.sale.company_id
    console.log('Cargando datos de la empresa emisora:', companyId)

    if (!companyId) {
      console.error('Error: company_id no está disponible en sale:', props.sale)
      return
    }

    const { data: companyData, error } = await supabase
      .from('companies')
      .select('id, ruc, legal_name, trade_name, address, ubigeo_code')
      .eq('id', companyId)
      .single()

    if (error) {
      console.error('Error al cargar datos de la empresa:', error)
      return
    }

    if (companyData) {
      senderCompanyData.value = companyData
      console.log('Datos de la empresa cargados exitosamente:', companyData)
    } else {
      console.error('No se encontraron datos de la empresa para ID:', companyId)
    }
  } catch (error) {
    console.error('Error al cargar datos de la empresa emisora:', error)
  }
}

const loadCustomerDestinationData = async () => {
  try {
    console.log('Cargando datos de destino del cliente...')
    console.log('Datos del sale:', props.sale)

    // Siempre cargar los datos completos del cliente si tenemos customer_id
    if (props.sale.customer_id) {
      console.log('Consultando datos completos del cliente con ID:', props.sale.customer_id)

      const { data: partyData, error: partyError } = await supabase
        .from('parties')
        .select('ubigeo_code, address, fullname, razon_social, doc_type, doc_number')
        .eq('id', props.sale.customer_id)
        .single()

      console.log('Datos del cliente obtenidos:', { data: partyData, error: partyError })

      if (partyError) {
        console.error('Error al obtener datos del cliente:', partyError)
        return
      }

      if (partyData) {
        // Guardar datos completos del cliente para usar en buildGuideData
        customerData.value = partyData
        console.log('Datos completos del cliente guardados:', partyData)

        // Preparar customerData para ubigeo
        let customerDataForUbigeo = {
          ubigeo_code: partyData.ubigeo_code,
          address: partyData.address
        }
        console.log('Datos del cliente para ubigeo:', customerDataForUbigeo)

        // Continuar con lógica de ubigeo usando los datos cargados
        if (customerDataForUbigeo.ubigeo_code) {
          console.log('Consultando ubigeo:', customerDataForUbigeo.ubigeo_code)
          await loadUbigeoDetails(customerDataForUbigeo.ubigeo_code, customerDataForUbigeo.address)
        } else {
          console.log('El cliente no tiene ubigeo_code, usando valor por defecto')
          // Establecer valores por defecto cuando el cliente no tiene ubigeo
          dispatchData.value.destination_ubigueo = '150101' // Lima por defecto
          dispatchData.value.destination_address = customerDataForUbigeo.address || 'Dirección no especificada'
        }
        return
      }
    }

    // Fallback: usar datos del computed si no hay customer_id
    let customerDataForUbigeo = saleCustomerData.value
    console.log('Usando datos del cliente del computed (fallback):', customerDataForUbigeo)

    // Si el cliente tiene ubigeo, cargar los datos automáticamente
    if (customerDataForUbigeo.ubigeo_code) {
      await loadUbigeoDetails(customerDataForUbigeo.ubigeo_code, customerDataForUbigeo.address)
    } else {
      console.log('El cliente no tiene ubigeo_code en fallback, usando valor por defecto')
      // Establecer valores por defecto cuando el cliente no tiene ubigeo
      dispatchData.value.destination_ubigueo = '150101' // Lima por defecto
      dispatchData.value.destination_address = customerDataForUbigeo.address || 'Dirección no especificada'
    }
  } catch (error) {
    console.error('Error al cargar datos de destino del cliente:', error)
    // Fallback final: establecer valores por defecto en caso de error
    if (!dispatchData.value.destination_ubigueo) {
      dispatchData.value.destination_ubigueo = '150101' // Lima por defecto
    }
    if (!dispatchData.value.destination_address) {
      dispatchData.value.destination_address = 'Dirección no especificada'
    }
  }
}

const onTransportTypeChange = (type: string) => {
  // Limpiar datos según el tipo seleccionado
  if (type === 'own') {
    dispatchData.value.carrier_ruc = ''
    dispatchData.value.carrier_name = ''
    dispatchData.value.carrier_mtc = ''
  } else if (type === 'third_party') {
    dispatchData.value.vehicle_plate = ''
    dispatchData.value.driver_id = ''
  }
  showPreview.value = false
}

const generatePreview = () => {
  showPreview.value = true
}

const downloadPDF = async () => {
  try {
    const guideData = buildGuideData()
    await despatchGuidesStore.generateDespatchGuidePDF(guideData)
  } catch (error) {
    console.error('Error al generar PDF:', error)
  }
}

const confirmDispatch = async () => {
  try {
    // Validar formato de placa antes de enviar
    if (dispatchData.value.vehicle_type === 'own' && dispatchData.value.vehicle_plate) {
      if (!validateVehiclePlate(dispatchData.value.vehicle_plate)) {
        alert('⚠️ Error: El formato de la placa del vehículo no es válido según SUNAT.\n\n' + plateValidation.value.message)
        return
      }
    }

    // Validar formato de licencia de conductor antes de enviar
    if (dispatchData.value.vehicle_type === 'own' && dispatchData.value.driver_id) {
      const selectedDriver = availableDrivers.value.find(d => d.id === dispatchData.value.driver_id)
      if (selectedDriver?.license_number) {
        if (!validateDriverLicense(selectedDriver.license_number)) {
          alert('⚠️ Error: El formato de la licencia del conductor no es válido según SUNAT.\n\n' + licenseValidation.value.message)
          return
        }
      }
    }

    // Verificar que tenemos los datos necesarios
    if (!senderCompanyData.value) {
      console.error('Error: Datos de la empresa emisora no cargados')
      alert('Error: No se han cargado los datos de la empresa. Por favor, recarga la página.')
      return
    }

    if (!selectedSeries.value) {
      console.error('Error: No se ha seleccionado una serie')
      alert('Error: No se ha seleccionado una serie válida.')
      return
    }

    if (!customerData.value) {
      console.error('Error: Datos del cliente no cargados')
      alert('Error: No se han cargado los datos del cliente. Por favor, recarga la página.')
      return
    }

    if (!branchData.value) {
      console.error('Error: Datos de la sucursal no cargados')
      alert('Error: No se han cargado los datos de la sucursal. Por favor, recarga la página.')
      return
    }


    // Crear objeto sale compatible con el store
    // Debug: Log customer data sources
    console.log('🔍 Customer data sources:', {
      customerData: customerData.value,
      propsParties: props.sale.parties,
      finalDocType: (customerData.value?.doc_type || props.sale.parties?.doc_type),
      finalDocTypeFormatted: (customerData.value?.doc_type || props.sale.parties?.doc_type) === '6' ? 'RUC' : 'DNI'
    })

    const saleDataForStore = {
      ...props.sale,
      company: {
        ruc: senderCompanyData.value.ruc,
        razon_social: senderCompanyData.value.legal_name,
        nombre_comercial: senderCompanyData.value.trade_name,
        address: {
          ubigueo: senderCompanyData.value.ubigeo_code || '150101',
          direccion: senderCompanyData.value.address || 'Sin dirección'
        }
      },
      customer: {
        document_type: (customerData.value?.doc_type || props.sale.parties?.doc_type) === '6' ? 'RUC' : 'DNI',
        document_number: customerData.value?.doc_number || props.sale.parties?.doc_number,
        business_name: customerData.value?.razon_social || props.sale.parties?.razon_social,
        full_name: customerData.value?.fullname || props.sale.parties?.fullname
      },
      branch: {
        ubigueo: branchData.value.ubigeo_code || '150101',
        address: branchData.value.address || 'Sin dirección'
      }
    }

    // Preparar datos de despacho con información completa del conductor
    const enhancedDispatchData = {
      dispatch_date: dispatchData.value.dispatch_date,
      vehicle_type: dispatchData.value.vehicle_type,
      destination_ubigueo: dispatchData.value.destination_ubigueo,
      destination_address: dispatchData.value.destination_address,
      total_weight: dispatchData.value.total_weight,
      vehicle_plate: dispatchData.value.vehicle_plate,
      driver_id: dispatchData.value.driver_id,
      carrier_ruc: dispatchData.value.carrier_ruc,
      carrier_name: dispatchData.value.carrier_name,
      carrier_mtc: dispatchData.value.carrier_mtc
    }

    // Si hay un conductor seleccionado, incluir sus datos completos
    if (dispatchData.value.driver_id) {
      const selectedDriver = availableDrivers.value.find(d => d.id === dispatchData.value.driver_id)
      if (selectedDriver) {
        console.log('🔍 Datos del conductor seleccionado para envío:', {
          id: selectedDriver.id,
          document_type: selectedDriver.document_type,
          document_number: selectedDriver.document_number,
          full_name: selectedDriver.full_name,
          license_number: selectedDriver.license_number
        })

        enhancedDispatchData.driver = {
          document_type: selectedDriver.document_type || '1',
          document_number: selectedDriver.document_number || '',
          names: selectedDriver.names || selectedDriver.full_name?.split(' ')[0] || '',
          last_names: selectedDriver.last_names || selectedDriver.full_name?.split(' ').slice(1).join(' ') || '',
          license_number: selectedDriver.license_number
        }

        console.log('📤 Enhanced dispatch data - driver:', enhancedDispatchData.driver)
      }
    }

    // Log final de datos antes de enviar a SUNAT
    console.log('🚀 Enviando a SUNAT - Datos finales:', {
      saleDataForStore,
      enhancedDispatchData,
      selectedSeries: selectedSeries.value
    })

    // Enviar guía de remisión a SUNAT
    const result = await despatchGuidesStore.createDespatchGuideFromSale(
      saleDataForStore,
      enhancedDispatchData,
      selectedSeries.value
    )

    if (result.success) {
      // Actualizar estado de la venta a despachada
      await salesStore.updateSaleStatus(props.sale.id, 'dispatched')

      console.log('✅ Guía de remisión creada exitosamente, iniciando flujo automático...')

      // Flujo automático: Estado → PDF
      await performAutomaticFlow(result)

      emit('success', {
        sale: props.sale,
        dispatch_data: dispatchData.value,
        guide_result: result
      })
    }
  } catch (error) {
    console.error('Error al confirmar despacho:', error)
  }
}

const buildGuideData = () => {
  const selectedDriver = availableDrivers.value.find(d => d.id === dispatchData.value.driver_id)

  console.log('🔍 BuildGuideData - Conductor seleccionado:', selectedDriver)

  // Verificar que tenemos los datos de la empresa
  if (!senderCompanyData.value) {
    throw new Error('Datos de la empresa emisora no disponibles')
  }

  // Verificar que tenemos los datos del cliente
  if (!customerData.value) {
    throw new Error('Datos del cliente no disponibles')
  }

  return {
    company: {
      ruc: senderCompanyData.value.ruc,
      razonSocial: senderCompanyData.value.legal_name,
      nombreComercial: senderCompanyData.value.trade_name,
      address: {
        ubigueo: senderCompanyData.value.ubigeo_code || '150101', // Default Lima si no hay ubigeo
        departamento: 'Lima', // Podrías obtener esto del ubigeo si es necesario
        provincia: 'Lima',
        distrito: 'Lima',
        direccion: senderCompanyData.value.address || 'Sin dirección',
        codLocal: '0000'
      }
    },
    // Documento relacionado (automático desde la venta)
    relatedDocument: {
      id: saleDocumentNumber.value,
      documentTypeCode: getSaleDocumentTypeCode(),
      documentType: getDocumentTypeDescription(getSaleDocumentTypeCode()),
      issuerPartyRuc: senderCompanyData.value.ruc
    },
    serie: selectedSeries.value.series,
    correlativo: String(selectedSeries.value.last_number + 1).padStart(8, '0'),
    fechaEmision: new Date().toISOString().split('T')[0],
    destinatario: {
      tipoDoc: customerData.value?.doc_type === '6' ? '6' : '1',
      numDoc: customerData.value?.doc_number || 'Sin documento',
      rznSocial: customerData.value?.razon_social || customerData.value?.fullname || 'Cliente sin nombre'
    },
    envio: {
      codTraslado: '01', // Venta
      modTraslado: dispatchData.value.vehicle_type === 'own' ? '02' : '01',
      fechaTraslado: dispatchData.value.dispatch_date,
      pesoTotal: dispatchData.value.total_weight,
      undPesoTotal: 'KGM',
      partida: {
        ubigueo: senderCompanyData.value.ubigeo_code || '150101', // Default Lima si no hay ubigeo
        direccion: senderCompanyData.value.address || 'Sin dirección'
      },
      llegada: {
        ubigueo: dispatchData.value.destination_ubigeo,
        direccion: dispatchData.value.destination_address
      },
      ...(dispatchData.value.vehicle_type === 'own' ? {
        vehiculo: {
          placa: dispatchData.value.vehicle_plate
        },
        ...(selectedDriver ? (() => {
          const conductorData = {
            tipoDoc: selectedDriver.document_type || '1',
            numDoc: selectedDriver.document_number || '',
            nombres: (selectedDriver.full_name || 'Sin nombre').split(' ')[0],
            apellidos: (selectedDriver.full_name || 'Sin apellido').split(' ').slice(1).join(' ') || 'Sin apellido',
            licencia: selectedDriver.license_number || ''
          }

          console.log('📋 BuildGuideData - Datos del conductor para SUNAT:', {
            selectedDriverData: selectedDriver,
            finalConductorData: conductorData
          })

          return { conductor: conductorData }
        })() : {})
      } : {
        transportista: {
          tipoDoc: '6',
          numDoc: dispatchData.value.carrier_ruc,
          rznSocial: dispatchData.value.carrier_name,
          nroMtc: dispatchData.value.carrier_mtc
        }
      })
    },
    details: saleItems.value.map(item => ({
      codigo: item.product?.code || item.code || 'N/A',
      descripcion: item.product?.description || item.description || 'N/A',
      unidad: item.unit_code || 'NIU',
      cantidad: item.quantity || 0
    }))
  }
}

// Formateo
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const getSaleDocumentTypeName = () => {
  // Determinar tipo basado en el número de documento de la venta
  const docNumber = saleDocumentNumber.value
  if (docNumber.startsWith('F')) return 'Factura'
  if (docNumber.startsWith('B')) return 'Boleta de Venta'
  if (docNumber.startsWith('NC')) return 'Nota de Crédito'
  if (docNumber.startsWith('ND')) return 'Nota de Débito'
  return 'Factura' // Default
}

const getSaleDocumentTypeCode = () => {
  // Determinar código de tipo basado en el número de documento de la venta
  const docNumber = saleDocumentNumber.value
  if (docNumber.startsWith('F')) return '01' // Factura
  if (docNumber.startsWith('B')) return '03' // Boleta
  if (docNumber.startsWith('NC')) return '07' // Nota Crédito
  if (docNumber.startsWith('ND')) return '08' // Nota Débito
  return '01' // Default factura
}

const getDocumentTypeDescription = (code) => {
  const types = {
    '01': 'Factura',
    '03': 'Boleta de Venta',
    '07': 'Nota de Crédito',
    '08': 'Nota de Débito'
  }
  return types[code] || 'Descripcion tipo de documento relacionado'
}

const generateGuideNumber = () => {
  if (!selectedSeries.value) return 'N/A'

  const nextNumber = (selectedSeries.value.last_number || 0) + 1
  return `${selectedSeries.value.series}-${nextNumber.toString().padStart(8, '0')}`
}

/**
 * Flujo automático después de crear la guía de remisión:
 * 1. Consultar estado en SUNAT
 * 2. Si es exitoso, descargar PDF automáticamente
 */
const performAutomaticFlow = async (guideResult: any) => {
  try {
    console.log('🔄 Iniciando consulta automática de estado...')

    if (!guideResult.ticket || !senderCompanyData.value?.ruc) {
      console.error('❌ No se puede consultar estado: falta ticket o RUC')
      return
    }

    // Esperar un momento para que SUNAT procese la guía
    console.log('⏳ Esperando 3 segundos antes de consultar estado...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Consultar estado en SUNAT
    const statusResult = await despatchGuidesStore.checkDespatchGuideStatus(
      guideResult.ticket,
      senderCompanyData.value.ruc
    )

    console.log('📋 Resultado de consulta de estado:', statusResult)

    if (statusResult.success) {
      console.log('✅ Estado consultado exitosamente')

      // Si el estado es aceptado o en proceso, descargar PDF automáticamente
      if (statusResult.status === 'ACEPTADO' || statusResult.status === 'EN_PROCESO') {
        console.log('📄 Descargando PDF automáticamente...')

        // Esperar un momento adicional
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Descargar PDF usando los datos de la guía
        await downloadAutomaticPDF(guideResult)
      } else {
        console.log('⚠️ Estado no permite descarga automática:', statusResult.status)
      }
    } else {
      console.log('⚠️ Error al consultar estado, pero continuando:', statusResult.error)

      // Intentar descargar PDF de todas formas
      console.log('📄 Intentando descarga de PDF de todas formas...')
      await downloadAutomaticPDF(guideResult)
    }

  } catch (error) {
    console.error('❌ Error en flujo automático:', error)

    // En caso de error, intentar descargar PDF de todas formas
    try {
      console.log('📄 Intentando descarga de PDF como fallback...')
      await downloadAutomaticPDF(guideResult)
    } catch (pdfError) {
      console.error('❌ Error también en descarga de PDF fallback:', pdfError)
    }
  }
}

/**
 * Descargar PDF automáticamente usando los datos de la guía creada
 */
const downloadAutomaticPDF = async (guideResult: any) => {
  try {
    console.log('📄 Iniciando descarga automática de PDF...')

    // Usar buildGuideData para generar el PDF con los mismos datos
    const guideData = buildGuideData()

    console.log('📋 Datos para PDF:', guideData)

    await despatchGuidesStore.generateDespatchGuidePDF(guideData)

    console.log('✅ PDF descargado automáticamente')

  } catch (error) {
    console.error('❌ Error al descargar PDF automáticamente:', error)
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount)
}
</script>