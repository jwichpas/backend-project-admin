<template>
  <div class="container mx-auto p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Guías de Remisión</h1>
        <p class="text-gray-600">Gestiona las guías de remisión electrónicas</p>
      </div>
      <Button @click="showNewGuideDialog = true" class="bg-blue-600 hover:bg-blue-700">
        <Plus class="h-4 w-4 mr-2" />
        Nueva Guía
      </Button>
    </div>

    <!-- Filtros -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label for="company-filter">Empresa</Label>
            <Select
              v-model="filters.company_id"
              :options="companyOptions"
              value-key="value"
              label-key="label"
              placeholder="Todas las empresas"
            />
          </div>

          <div>
            <Label for="status-filter">Estado</Label>
            <Select
              v-model="filters.estado"
              :options="statusOptions"
              value-key="value"
              label-key="label"
              placeholder="Todos los estados"
            />
          </div>

          <div>
            <Label for="date-from">Fecha desde</Label>
            <Input
              id="date-from"
              type="date"
              v-model="filters.dateFrom"
            />
          </div>

          <div>
            <Label for="date-to">Fecha hasta</Label>
            <Input
              id="date-to"
              type="date"
              v-model="filters.dateTo"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4 space-x-2">
          <Button variant="outline" @click="clearFilters">
            <X class="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          <Button @click="applyFilters" class="bg-blue-600 hover:bg-blue-700">
            <Search class="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <Clock class="h-8 w-8 text-yellow-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pendientes</p>
              <p class="text-2xl font-bold">{{ pendingGuides.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <Send class="h-8 w-8 text-blue-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Enviadas</p>
              <p class="text-2xl font-bold">{{ sentGuides.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <CheckCircle class="h-8 w-8 text-green-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Aceptadas</p>
              <p class="text-2xl font-bold">{{ acceptedGuides.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center">
            <XCircle class="h-8 w-8 text-red-500" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Rechazadas</p>
              <p class="text-2xl font-bold">{{ rejectedGuides.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Tabla de guías -->
    <Card>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinatario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Emisión
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Traslado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  Cargando guías de remisión...
                </td>
              </tr>
              <tr v-else-if="despatchGuides.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  No se encontraron guías de remisión
                </td>
              </tr>
              <tr v-else v-for="guide in despatchGuides" :key="guide.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ guide.serie }}-{{ guide.correlativo }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ guide.company?.business_name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ guide.destinatario_razon_social }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ guide.destinatario_tipo_doc === '6' ? 'RUC' : 'DNI' }}: {{ guide.destinatario_num_doc }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(guide.fecha_emision) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(guide.fecha_traslado) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <Badge :variant="getStatusVariant(guide.estado_sunat)">
                    {{ getStatusText(guide.estado_sunat) }}
                  </Badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="viewGuide(guide)"
                    >
                      <Eye class="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      @click="downloadXML(guide)"
                      v-if="guide.xml"
                    >
                      <FileText class="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      @click="downloadPDF(guide)"
                    >
                      <Download class="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      @click="checkStatus(guide)"
                      v-if="guide.ticket && guide.estado_sunat === 'ENVIADO'"
                    >
                      <RefreshCw class="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Dialog para nueva guía -->
    <DespatchGuideForm
      v-if="showNewGuideDialog"
      @close="showNewGuideDialog = false"
      @success="handleGuideCreated"
    />

    <!-- Dialog para ver guía -->
    <DespatchGuideDetails
      v-if="showGuideDetails"
      :guide="selectedGuide"
      @close="showGuideDetails = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDespatchGuidesStore } from '@/stores/despatchGuides'
import { useCompaniesStore } from '@/stores/companies'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Plus,
  Search,
  X,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Download,
  RefreshCw
} from 'lucide-vue-next'
import DespatchGuideForm from '@/components/DespatchGuideForm.vue'
import DespatchGuideDetails from '@/components/DespatchGuideDetails.vue'

const despatchGuidesStore = useDespatchGuidesStore()
const companiesStore = useCompaniesStore()

const {
  despatchGuides,
  loading,
  error,
  pendingGuides,
  sentGuides,
  acceptedGuides,
  rejectedGuides
} = despatchGuidesStore

const { companies } = companiesStore

// Dialog states
const showNewGuideDialog = ref(false)
const showGuideDetails = ref(false)
const selectedGuide = ref(null)

// Filtros
const filters = ref({
  company_id: '',
  estado: '',
  dateFrom: '',
  dateTo: ''
})

// Computed properties for select options
const companyOptions = computed(() => [
  { value: '', label: 'Todas las empresas' },
  ...companies.map(company => ({
    value: company.id,
    label: company.business_name || company.trade_name || company.legal_name
  }))
])

const statusOptions = computed(() => [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' }
])

// Cargar datos iniciales
onMounted(async () => {
  await Promise.all([
    despatchGuidesStore.fetchDespatchGuides(),
    companiesStore.fetchAll()
  ])
})

// Métodos
const applyFilters = async () => {
  const filterParams: any = {}

  if (filters.value.company_id) {
    filterParams.company_id = filters.value.company_id
  }

  if (filters.value.estado) {
    filterParams.estado = filters.value.estado
  }

  await despatchGuidesStore.fetchDespatchGuides(filterParams)
}

const clearFilters = async () => {
  filters.value = {
    company_id: '',
    estado: '',
    dateFrom: '',
    dateTo: ''
  }
  await despatchGuidesStore.fetchDespatchGuides()
}

const viewGuide = (guide: any) => {
  selectedGuide.value = guide
  showGuideDetails.value = true
}

const downloadXML = (guide: any) => {
  if (guide.xml) {
    const blob = new Blob([guide.xml], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${guide.serie}-${guide.correlativo}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

const downloadPDF = async (guide: any) => {
  try {
    await despatchGuidesStore.generateDespatchGuidePDF({
      company: guide.company,
      serie: guide.serie,
      correlativo: guide.correlativo,
      destinatario: {
        tipoDoc: guide.destinatario_tipo_doc,
        numDoc: guide.destinatario_num_doc,
        rznSocial: guide.destinatario_razon_social
      },
      envio: {
        codTraslado: guide.cod_traslado,
        modTraslado: guide.mod_traslado,
        fechaTraslado: guide.fecha_traslado,
        pesoTotal: guide.peso_total,
        partida: {
          ubigueo: guide.partida_ubigueo,
          direccion: guide.partida_direccion
        },
        llegada: {
          ubigueo: guide.llegada_ubigueo,
          direccion: guide.llegada_direccion
        }
      },
      details: guide.details || []
    })
  } catch (error) {
    console.error('Error al descargar PDF:', error)
  }
}

const checkStatus = async (guide: any) => {
  try {
    await despatchGuidesStore.checkDespatchGuideStatus(guide.ticket, guide.company.ruc)
    await despatchGuidesStore.fetchDespatchGuides()
  } catch (error) {
    console.error('Error al consultar estado:', error)
  }
}

const handleGuideCreated = async () => {
  showNewGuideDialog.value = false
  await despatchGuidesStore.fetchDespatchGuides()
}

// Formateo
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDIENTE': return 'secondary'
    case 'ENVIADO': return 'default'
    case 'ACEPTADO': return 'success'
    case 'RECHAZADO': return 'destructive'
    default: return 'secondary'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDIENTE': return 'Pendiente'
    case 'ENVIADO': return 'Enviado'
    case 'ACEPTADO': return 'Aceptado'
    case 'RECHAZADO': return 'Rechazado'
    default: return status
  }
}
</script>