<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nueva Guía de Remisión</DialogTitle>
        <DialogDescription>
          Complete la información para generar la guía de remisión electrónica
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Información de la empresa -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Información de la Empresa</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Empresa</Label>
                <div class="p-3 bg-gray-50 rounded-md border">
                  <span class="text-sm font-medium">{{ currentCompanyName }}</span>
                </div>
              </div>

              <div>
                <Label>Sucursal</Label>
                <div class="p-3 bg-gray-50 rounded-md border">
                  <span class="text-sm font-medium">{{ currentBranchName }}</span>
                </div>
              </div>

              <div>
                <Label for="series">Serie</Label>
                <Select
                  v-model="form.series_id"
                  :options="seriesOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Seleccionar serie"
                  required
                />
              </div>

              <div>
                <Label for="fecha-emision">Fecha de Emisión</Label>
                <Input
                  id="fecha-emision"
                  type="date"
                  v-model="form.fechaEmision"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Información del destinatario -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Destinatario</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-4">
              <div>
                <Label for="destinatario">Seleccionar Destinatario</Label>
                <SearchableSelect
                  :options="customerOptions"
                  placeholder="Buscar por nombre o documento..."
                  @search="searchCustomers"
                  @select="onCustomerSelect"
                  required
                />
              </div>

              <!-- Campos del destinatario seleccionado (solo lectura) -->
              <div v-if="form.destinatario.numDoc" class="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-md">
                <div>
                  <Label class="text-sm text-gray-600">Tipo de Documento</Label>
                  <p class="font-medium">{{ form.destinatario.tipoDoc === '6' ? 'RUC' : 'DNI' }}</p>
                </div>
                <div>
                  <Label class="text-sm text-gray-600">Número de Documento</Label>
                  <p class="font-medium">{{ form.destinatario.numDoc }}</p>
                </div>
                <div>
                  <Label class="text-sm text-gray-600">Razón Social / Nombre</Label>
                  <p class="font-medium">{{ form.destinatario.rznSocial }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Información del envío -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Información del Envío</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="motivo-traslado">Motivo de Traslado</Label>
                <Select
                  v-model="form.envio.codTraslado"
                  :options="transferReasonOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Seleccionar motivo"
                  required
                />
              </div>

              <div>
                <Label for="modalidad-transporte">Modalidad de Transporte</Label>
                <Select
                  v-model="form.envio.modTraslado"
                  :options="transferModalityOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Seleccionar modalidad"
                  @update:model-value="onTransportModeChange"
                  required
                />
              </div>

              <div>
                <Label for="fecha-traslado">Fecha de Traslado</Label>
                <Input
                  id="fecha-traslado"
                  type="date"
                  v-model="form.envio.fechaTraslado"
                  required
                />
              </div>

              <div>
                <Label for="peso-total">Peso Total (KG)</Label>
                <Input
                  id="peso-total"
                  type="number"
                  step="0.001"
                  v-model.number="form.envio.pesoTotal"
                  placeholder="0.000"
                  required
                />
              </div>
            </div>

            <!-- Direcciones -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Punto de Partida</Label>
                <div class="space-y-2">
                  <Input
                    v-model="form.envio.partida.ubigueo"
                    placeholder="Ubigeo (150101)"
                    required
                  />
                  <Input
                    v-model="form.envio.partida.direccion"
                    placeholder="Dirección completa"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Punto de Llegada</Label>
                <div class="space-y-2">
                  <Input
                    v-model="form.envio.llegada.ubigueo"
                    placeholder="Ubigeo (150203)"
                    required
                  />
                  <Input
                    v-model="form.envio.llegada.direccion"
                    placeholder="Dirección completa"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Transporte público -->
            <div v-if="form.envio.modTraslado === '01'" class="border-t pt-4">
              <h4 class="font-medium mb-3">Datos del Transportista</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label for="transportista-ruc">RUC del Transportista</Label>
                  <Input
                    id="transportista-ruc"
                    v-model="form.envio.transportista.numDoc"
                    placeholder="20123456789"
                    required
                  />
                </div>
                <div>
                  <Label for="transportista-razon">Razón Social</Label>
                  <Input
                    id="transportista-razon"
                    v-model="form.envio.transportista.rznSocial"
                    placeholder="TRANSPORTES SA"
                    required
                  />
                </div>
                <div>
                  <Label for="transportista-mtc">Número MTC</Label>
                  <Input
                    id="transportista-mtc"
                    v-model="form.envio.transportista.nroMtc"
                    placeholder="0001"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Transporte privado -->
            <div v-if="form.envio.modTraslado === '02'" class="border-t pt-4">
              <h4 class="font-medium mb-3">Datos del Vehículo y Conductor</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label for="vehiculo-placa">Placa del Vehículo</Label>
                  <Input
                    id="vehiculo-placa"
                    v-model="form.envio.vehiculo.placa"
                    placeholder="ABC-123"
                    required
                  />
                </div>
              </div>

              <div class="mt-4">
                <h5 class="font-medium mb-3">Conductor (Opcional)</h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label for="conductor-tipo">Tipo de Documento</Label>
                    <Select v-model="form.envio.conductor.tipoDoc">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">DNI</SelectItem>
                        <SelectItem value="6">RUC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label for="conductor-doc">Número de Documento</Label>
                    <Input
                      id="conductor-doc"
                      v-model="form.envio.conductor.numDoc"
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <Label for="conductor-licencia">Licencia</Label>
                    <Input
                      id="conductor-licencia"
                      v-model="form.envio.conductor.licencia"
                      placeholder="B2377373"
                    />
                  </div>
                  <div>
                    <Label for="conductor-nombres">Nombres</Label>
                    <Input
                      id="conductor-nombres"
                      v-model="form.envio.conductor.nombres"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <Label for="conductor-apellidos">Apellidos</Label>
                    <Input
                      id="conductor-apellidos"
                      v-model="form.envio.conductor.apellidos"
                      placeholder="Pérez García"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Productos -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg flex items-center justify-between">
              Productos/Servicios
              <Button type="button" @click="addProduct" variant="outline">
                <Plus class="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="(detail, index) in form.details"
                :key="index"
                class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg"
              >
                <div>
                  <Label>Código</Label>
                  <Input v-model="detail.codigo" placeholder="PROD001" required />
                </div>
                <div class="md:col-span-2">
                  <Label>Descripción</Label>
                  <Input v-model="detail.descripcion" placeholder="Descripción del producto" required />
                </div>
                <div>
                  <Label>Unidad</Label>
                  <Select v-model="detail.unidad">
                    <SelectTrigger>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIU">UNIDAD</SelectItem>
                      <SelectItem value="KGM">KILOGRAMO</SelectItem>
                      <SelectItem value="MTR">METRO</SelectItem>
                      <SelectItem value="LTR">LITRO</SelectItem>
                      <SelectItem value="ZZ">SERVICIOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      step="0.001"
                      v-model.number="detail.cantidad"
                      placeholder="0.000"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="removeProduct(index)"
                    class="mt-6"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div v-if="form.details.length === 0" class="text-center text-gray-500 py-8">
                No hay productos agregados. Haga clic en "Agregar" para incluir productos.
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Botones -->
        <div class="flex justify-end space-x-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            @click="generatePreview"
            :disabled="loading"
          >
            <Eye class="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button type="submit" :disabled="loading">
            <Send class="h-4 w-4 mr-2" />
            {{ loading ? 'Enviando...' : 'Enviar a SUNAT' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDespatchGuidesStore } from '@/stores/despatchGuides'
import { useCompaniesStore } from '@/stores/companies'
import { useBranchesStore } from '@/stores/branches'
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
import { Plus, X, Send, Eye } from 'lucide-vue-next'

const emit = defineEmits(['close', 'success'])

const despatchGuidesStore = useDespatchGuidesStore()
const companiesStore = useCompaniesStore()
const branchesStore = useBranchesStore()

const { companies, userCompanies } = companiesStore
const { branches } = branchesStore

// Obtener empresa y sucursal actual desde localStorage
const selectedCompanyId = localStorage.getItem('selectedCompanyId')
const selectedBranchId = localStorage.getItem('selectedBranchId')
const { loading } = despatchGuidesStore

const availableSeries = ref([])
const transferReasons = ref([])
const transferModalities = ref([])
const customers = ref([])

// Formulario - usar empresa y sucursal actual
const form = ref({
  company_id: selectedCompanyId || '',
  branch_id: selectedBranchId || '',
  series_id: '',
  fechaEmision: new Date().toISOString().split('T')[0],
  destinatario: {
    tipoDoc: '',
    numDoc: '',
    rznSocial: ''
  },
  envio: {
    codTraslado: '01',
    modTraslado: '',
    fechaTraslado: new Date().toISOString().split('T')[0],
    pesoTotal: 0,
    partida: {
      ubigueo: '',
      direccion: ''
    },
    llegada: {
      ubigueo: '',
      direccion: ''
    },
    transportista: {
      tipoDoc: '6',
      numDoc: '',
      rznSocial: '',
      nroMtc: ''
    },
    vehiculo: {
      placa: ''
    },
    conductor: {
      tipoDoc: '1',
      numDoc: '',
      nombres: '',
      apellidos: '',
      licencia: ''
    }
  },
  details: []
})

// Computed
const availableBranches = computed(() => {
  if (!form.value.company_id) return []
  return branches.filter(branch => branch.company_id === form.value.company_id)
})

// Computed properties para mostrar empresa y sucursal actual
const currentCompanyName = computed(() => {
  const userCompany = userCompanies.find(uc => uc.company.id === selectedCompanyId)
  return userCompany ? (userCompany.company.trade_name || userCompany.company.legal_name) : 'No seleccionada'
})

const currentBranchName = computed(() => {
  const branch = branches.find(b => b.id === selectedBranchId)
  return branch ? branch.name : 'No seleccionada'
})

// Computed properties para options de los selects
const transferReasonOptions = computed(() =>
  transferReasons.value.map(reason => ({
    value: reason.code,
    label: `${reason.code} - ${reason.descripcion}`
  }))
)

const transferModalityOptions = computed(() =>
  transferModalities.value.map(modality => ({
    value: modality.code,
    label: `${modality.code} - ${modality.descripcion}`
  }))
)

const seriesOptions = computed(() =>
  availableSeries.value.map(series => ({
    value: series.id,
    label: `${series.serie} - ${series.correlativo_actual + 1}`
  }))
)

const customerOptions = computed(() =>
  customers.value.map(customer => ({
    value: customer.id,
    label: `${customer.razon_social || customer.fullname} - ${customer.doc_number}`,
    razon_social: customer.razon_social,
    fullname: customer.fullname,
    doc_type: customer.doc_type,
    doc_number: customer.doc_number
  }))
)

// Función para buscar customers
const searchCustomers = async (searchTerm: string) => {
  try {
    const results = await despatchGuidesStore.getCustomers(searchTerm)
    customers.value = results
  } catch (error) {
    console.error('Error al buscar customers:', error)
  }
}

// Función para seleccionar customer
const onCustomerSelect = (customer: any) => {
  form.value.destinatario = {
    tipoDoc: customer.doc_type,
    numDoc: customer.doc_number,
    rznSocial: customer.razon_social || customer.fullname
  }
}

// Cargar datos iniciales
onMounted(async () => {
  try {
    // Cargar datos básicos
    await companiesStore.fetchAll()

    // Obtener el usuario actual para cargar sus empresas
    const userId = localStorage.getItem('userId')
    if (userId) {
      await companiesStore.fetchUserCompanies(userId)
    }

    // Si hay empresa seleccionada, cargar sus sucursales
    if (selectedCompanyId) {
      await branchesStore.fetchAll(selectedCompanyId)
    }

    // Cargar datos en paralelo
    const promises = []

    // Si hay empresa y sucursal seleccionadas, cargar series disponibles
    if (selectedCompanyId && selectedBranchId) {
      promises.push(
        despatchGuidesStore.getAvailableDocumentSeries(
          selectedBranchId,
          selectedCompanyId,
          '09' // Código para guías de remisión
        ).then(series => availableSeries.value = series)
      )
    }

    // Cargar motivos de traslado de SUNAT
    promises.push(
      despatchGuidesStore.getSunatTransferReasons()
        .then(reasons => transferReasons.value = reasons)
    )

    // Cargar modalidades de traslado de SUNAT
    promises.push(
      despatchGuidesStore.getSunatTransferModalities()
        .then(modalities => transferModalities.value = modalities)
    )

    // Cargar customers iniciales
    promises.push(
      despatchGuidesStore.getCustomers()
        .then(customerList => customers.value = customerList)
    )

    await Promise.all(promises)
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
  }
})

// Métodos
const onTransportModeChange = (mode: string) => {
  // Limpiar datos según el modo de transporte
  if (mode === '01') {
    // Transporte público - limpiar datos de vehículo
    form.value.envio.vehiculo.placa = ''
    form.value.envio.conductor = {
      tipoDoc: '1',
      numDoc: '',
      nombres: '',
      apellidos: '',
      licencia: ''
    }
  } else if (mode === '02') {
    // Transporte privado - limpiar datos de transportista
    form.value.envio.transportista = {
      tipoDoc: '6',
      numDoc: '',
      rznSocial: '',
      nroMtc: ''
    }
  }
}

const addProduct = () => {
  form.value.details.push({
    codigo: '',
    descripcion: '',
    unidad: 'NIU',
    cantidad: 1
  })
}

const removeProduct = (index: number) => {
  form.value.details.splice(index, 1)
}

const generatePreview = async () => {
  try {
    const guideData = await buildGuideData()
    await despatchGuidesStore.generateDespatchGuideXML(guideData)
  } catch (error) {
    console.error('Error al generar vista previa:', error)
  }
}

const submitForm = async () => {
  try {
    const guideData = await buildGuideData()
    await despatchGuidesStore.sendDespatchGuide(guideData)
    emit('success')
  } catch (error) {
    console.error('Error al enviar guía:', error)
  }
}

const buildGuideData = async () => {
  const selectedCompany = companies.find(c => c.id === form.value.company_id)
  const selectedSeries = availableSeries.value.find(s => s.id === form.value.series_id)

  if (!selectedCompany || !selectedSeries) {
    throw new Error('Empresa o serie no seleccionada')
  }

  const guideData = {
    company: {
      ruc: selectedCompany.ruc,
      razonSocial: selectedCompany.business_name,
      nombreComercial: selectedCompany.commercial_name,
      address: {
        ubigueo: selectedCompany.ubigueo,
        departamento: selectedCompany.department,
        provincia: selectedCompany.province,
        distrito: selectedCompany.district,
        direccion: selectedCompany.address,
        codLocal: '0000'
      }
    },
    serie: selectedSeries.series_number,
    correlativo: (selectedSeries.current_number + 1).toString().padStart(8, '0'),
    fechaEmision: form.value.fechaEmision,
    destinatario: form.value.destinatario,
    envio: {
      ...form.value.envio,
      undPesoTotal: 'KGM'
    },
    details: form.value.details
  }

  return guideData
}
</script>