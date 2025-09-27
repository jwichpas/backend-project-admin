<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Guía de Remisión {{ guide.serie }}-{{ guide.correlativo }}</DialogTitle>
        <DialogDescription>
          Detalles de la guía de remisión electrónica
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Estado y acciones -->
        <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-4">
            <Badge :variant="getStatusVariant(guide.estado_sunat)" class="text-sm">
              {{ getStatusText(guide.estado_sunat) }}
            </Badge>
            <span class="text-sm text-gray-600">
              Última actualización: {{ formatDateTime(guide.updated_at) }}
            </span>
          </div>
          <div class="flex space-x-2">
            <Button
              v-if="guide.ticket && guide.estado_sunat === 'ENVIADO'"
              @click="checkStatus"
              variant="outline"
              size="sm"
            >
              <RefreshCw class="h-4 w-4 mr-2" />
              Consultar Estado
            </Button>
            <Button
              v-if="guide.xml"
              @click="downloadXML"
              variant="outline"
              size="sm"
            >
              <FileText class="h-4 w-4 mr-2" />
              Descargar XML
            </Button>
            <Button
              @click="downloadPDF"
              variant="outline"
              size="sm"
            >
              <Download class="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <!-- Información general -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Información del Documento</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-600">Número:</Label>
                  <p class="font-medium">{{ guide.serie }}-{{ guide.correlativo }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Tipo:</Label>
                  <p>{{ guide.tipo_doc === '09' ? 'Guía de Remisión' : guide.tipo_doc }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Fecha de Emisión:</Label>
                  <p>{{ formatDate(guide.fecha_emision) }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Fecha de Traslado:</Label>
                  <p>{{ formatDate(guide.fecha_traslado) }}</p>
                </div>
              </div>
              <div v-if="guide.ticket">
                <Label class="text-sm font-medium text-gray-600">Ticket SUNAT:</Label>
                <p class="font-mono text-sm">{{ guide.ticket }}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Empresa Emisora</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div>
                <Label class="text-sm font-medium text-gray-600">Razón Social:</Label>
                <p class="font-medium">{{ guide.company?.business_name }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">RUC:</Label>
                <p>{{ guide.company?.ruc }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Dirección:</Label>
                <p>{{ guide.company?.address }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Destinatario -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Destinatario</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm font-medium text-gray-600">Tipo de Documento:</Label>
                <p>{{ guide.destinatario_tipo_doc === '6' ? 'RUC' : 'DNI' }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Número:</Label>
                <p class="font-mono">{{ guide.destinatario_num_doc }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Razón Social / Nombre:</Label>
                <p class="font-medium">{{ guide.destinatario_razon_social }}</p>
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm font-medium text-gray-600">Motivo de Traslado:</Label>
                <p>{{ getMotiveText(guide.cod_traslado) }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Modalidad de Transporte:</Label>
                <p>{{ guide.mod_traslado === '01' ? 'Transporte Público' : 'Transporte Privado' }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium text-gray-600">Peso Total:</Label>
                <p>{{ guide.peso_total }} {{ guide.und_peso_total }}</p>
              </div>
            </div>

            <!-- Direcciones -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 rounded-lg">
                <h4 class="font-medium text-blue-900 mb-2">Punto de Partida</h4>
                <p class="text-sm text-blue-700">{{ guide.partida_direccion }}</p>
                <p class="text-xs text-blue-600 mt-1">Ubigeo: {{ guide.partida_ubigueo }}</p>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <h4 class="font-medium text-green-900 mb-2">Punto de Llegada</h4>
                <p class="text-sm text-green-700">{{ guide.llegada_direccion }}</p>
                <p class="text-xs text-green-600 mt-1">Ubigeo: {{ guide.llegada_ubigueo }}</p>
              </div>
            </div>

            <!-- Información de transporte -->
            <div v-if="guide.mod_traslado === '01'" class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-3">Datos del Transportista</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-600">RUC:</Label>
                  <p class="font-mono">{{ guide.transportista_num_doc }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Razón Social:</Label>
                  <p>{{ guide.transportista_razon_social }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Nro. MTC:</Label>
                  <p>{{ guide.transportista_nro_mtc }}</p>
                </div>
              </div>
            </div>

            <div v-if="guide.mod_traslado === '02'" class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-3">Datos del Vehículo y Conductor</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-600">Placa del Vehículo:</Label>
                  <p class="font-mono font-bold">{{ guide.vehiculo_placa }}</p>
                </div>
                <div v-if="guide.conductor_nombres">
                  <Label class="text-sm font-medium text-gray-600">Conductor:</Label>
                  <p>{{ guide.conductor_nombres }} {{ guide.conductor_apellidos }}</p>
                  <p class="text-sm text-gray-500">
                    {{ guide.conductor_tipo_doc === '1' ? 'DNI' : 'RUC' }}: {{ guide.conductor_num_doc }}
                  </p>
                  <p class="text-sm text-gray-500" v-if="guide.conductor_licencia">
                    Licencia: {{ guide.conductor_licencia }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Detalles de productos -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Productos / Servicios</CardTitle>
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
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in guide.details"
                    :key="detail.id"
                    class="border-b"
                  >
                    <td class="py-2 px-4 font-mono">{{ detail.codigo }}</td>
                    <td class="py-2 px-4">{{ detail.descripcion }}</td>
                    <td class="py-2 px-4">{{ detail.unidad }}</td>
                    <td class="py-2 px-4 text-right">{{ detail.cantidad }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <!-- Respuesta SUNAT -->
        <div v-if="guide.sunat_response" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Respuesta de SUNAT</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label class="text-sm font-medium text-gray-600">Código:</Label>
                  <p class="font-mono">{{ guide.sunat_response.code }}</p>
                </div>
                <div>
                  <Label class="text-sm font-medium text-gray-600">Descripción:</Label>
                  <p>{{ guide.sunat_response.description }}</p>
                </div>
              </div>
              <div v-if="guide.sunat_response.notes && guide.sunat_response.notes.length > 0" class="mt-4">
                <Label class="text-sm font-medium text-gray-600">Observaciones:</Label>
                <ul class="list-disc list-inside mt-2 space-y-1">
                  <li v-for="note in guide.sunat_response.notes" :key="note" class="text-sm">
                    {{ note }}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <Button @click="$emit('close')" variant="outline">
          Cerrar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useDespatchGuidesStore } from '@/stores/despatchGuides'
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
import Label from '@/components/ui/Label.vue'
import Badge from '@/components/ui/Badge.vue'
import { RefreshCw, FileText, Download } from 'lucide-vue-next'

const props = defineProps<{
  guide: any
}>()

const emit = defineEmits(['close'])

const despatchGuidesStore = useDespatchGuidesStore()

// Métodos
const checkStatus = async () => {
  try {
    await despatchGuidesStore.checkDespatchGuideStatus(
      props.guide.ticket,
      props.guide.company.ruc
    )
    // Actualizar la guía actual
    await despatchGuidesStore.fetchDespatchGuide(props.guide.id)
  } catch (error) {
    console.error('Error al consultar estado:', error)
  }
}

const downloadXML = () => {
  if (props.guide.xml) {
    const blob = new Blob([props.guide.xml], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.guide.serie}-${props.guide.correlativo}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

const downloadPDF = async () => {
  try {
    // Construir datos para generar PDF
    const guideData = {
      company: props.guide.company,
      serie: props.guide.serie,
      correlativo: props.guide.correlativo,
      fechaEmision: props.guide.fecha_emision,
      destinatario: {
        tipoDoc: props.guide.destinatario_tipo_doc,
        numDoc: props.guide.destinatario_num_doc,
        rznSocial: props.guide.destinatario_razon_social
      },
      envio: {
        codTraslado: props.guide.cod_traslado,
        modTraslado: props.guide.mod_traslado,
        fechaTraslado: props.guide.fecha_traslado,
        pesoTotal: props.guide.peso_total,
        partida: {
          ubigueo: props.guide.partida_ubigueo,
          direccion: props.guide.partida_direccion
        },
        llegada: {
          ubigueo: props.guide.llegada_ubigueo,
          direccion: props.guide.llegada_direccion
        }
      },
      details: props.guide.details || []
    }

    await despatchGuidesStore.generateDespatchGuidePDF(guideData)
  } catch (error) {
    console.error('Error al descargar PDF:', error)
  }
}

// Formateo
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-PE')
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

const getMotiveText = (code: string) => {
  const motives = {
    '01': 'Venta',
    '03': 'Venta con entrega a terceros',
    '04': 'Traslado entre establecimientos de la misma empresa',
    '08': 'Importación',
    '09': 'Exportación',
    '13': 'Otros'
  }
  return motives[code] || code
}
</script>