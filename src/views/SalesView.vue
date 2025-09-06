<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Ventas</h1>
        <p class="text-muted-foreground">
          Gestiona facturas, boletas y documentos de venta
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Hoy</p>
              <p class="text-2xl font-bold">S/ 2,350</p>
            </div>
            <TrendingUp class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Esta Semana</p>
              <p class="text-2xl font-bold">S/ 18,450</p>
            </div>
            <Calendar class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Este Mes</p>
              <p class="text-2xl font-bold">S/ 75,240</p>
            </div>
            <BarChart3 class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Pendientes</p>
              <p class="text-2xl font-bold text-amber-600">8</p>
            </div>
            <Clock class="h-8 w-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-5">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input 
              v-model="searchTerm" 
              placeholder="Número, cliente..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Tipo</label>
            <select 
              v-model="selectedDocType"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="01">Facturas</option>
              <option value="03">Boletas</option>
              <option value="07">Notas de Crédito</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select 
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="SENT">Enviado</option>
              <option value="PAID">Pagado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Desde</label>
            <Input 
              v-model="dateFrom" 
              type="date"
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Hasta</label>
            <Input 
              v-model="dateTo" 
              type="date"
              class="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Sales Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Documentos de Venta ({{ salesDocs.length }})</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter class="mr-2 h-4 w-4" />
              Más Filtros
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>SUNAT</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="doc in salesDocs" :key="doc.id">
              <TableCell>
                <div>
                  <p class="font-medium">{{ getDocTypeName(doc.doc_type) }}</p>
                  <p class="text-sm text-muted-foreground">{{ doc.series }}-{{ String(doc.number).padStart(8, '0') }}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p class="font-medium">{{ doc.customer_name }}</p>
                  <p class="text-sm text-muted-foreground">{{ doc.customer_doc }}</p>
                </div>
              </TableCell>
              <TableCell>
                {{ formatDate(doc.issue_date) }}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{{ doc.currency_code }}</Badge>
              </TableCell>
              <TableCell>
                <span class="font-medium">{{ formatCurrency(doc.total, doc.currency_code) }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(doc.status) as any">
                  {{ getStatusName(doc.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <div :class="getSunatStatusColor(doc.sunat_status)" class="h-2 w-2 rounded-full"></div>
                  <span class="text-sm">{{ getSunatStatusName(doc.sunat_status) }}</span>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Ver PDF">
                    <FileText class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Descargar XML">
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8" title="Enviar por email">
                    <Mail class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Download,
  Plus,
  Filter,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  FileText,
  Mail,
  MoreVertical
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

interface SalesDoc {
  id: string
  doc_type: string
  series: string
  number: number
  customer_name: string
  customer_doc: string
  issue_date: string
  currency_code: string
  total: number
  status: string
  sunat_status: string
}

// Filters
const searchTerm = ref('')
const selectedDocType = ref('')
const selectedStatus = ref('')
const dateFrom = ref('')
const dateTo = ref('')

// Mock data
const salesDocs = ref<SalesDoc[]>([
  {
    id: '1',
    doc_type: '01',
    series: 'F001',
    number: 123,
    customer_name: 'Plaza Vea S.A.',
    customer_doc: '20100033345',
    issue_date: '2024-01-15',
    currency_code: 'PEN',
    total: 885.00,
    status: 'PAID',
    sunat_status: 'ACCEPTED'
  },
  {
    id: '2',
    doc_type: '03',
    series: 'B001',
    number: 456,
    customer_name: 'Juan Pérez García',
    customer_doc: '45879632',
    issue_date: '2024-01-15',
    currency_code: 'PEN',
    total: 45.50,
    status: 'SENT',
    sunat_status: 'PENDING'
  },
  {
    id: '3',
    doc_type: '01',
    series: 'F001',
    number: 124,
    customer_name: 'Tottus S.A.',
    customer_doc: '20100022278',
    issue_date: '2024-01-14',
    currency_code: 'PEN',
    total: 1200.00,
    status: 'DRAFT',
    sunat_status: 'NOT_SENT'
  }
])

// Helper functions
const getDocTypeName = (type: string) => {
  const types: Record<string, string> = {
    '01': 'Factura',
    '03': 'Boleta',
    '07': 'Nota de Crédito'
  }
  return types[type] || type
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    'DRAFT': 'outline',
    'SENT': 'warning',
    'PAID': 'success',
    'CANCELLED': 'destructive'
  }
  return variants[status] || 'outline'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    'DRAFT': 'Borrador',
    'SENT': 'Enviado',
    'PAID': 'Pagado',
    'CANCELLED': 'Cancelado'
  }
  return names[status] || status
}

const getSunatStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'NOT_SENT': 'bg-gray-400',
    'PENDING': 'bg-yellow-400',
    'ACCEPTED': 'bg-green-400',
    'REJECTED': 'bg-red-400'
  }
  return colors[status] || 'bg-gray-400'
}

const getSunatStatusName = (status: string) => {
  const names: Record<string, string> = {
    'NOT_SENT': 'No enviado',
    'PENDING': 'Pendiente',
    'ACCEPTED': 'Aceptado',
    'REJECTED': 'Rechazado'
  }
  return names[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number, currency: string) => {
  const symbol = currency === 'PEN' ? 'S/' : '$'
  return `${symbol} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>