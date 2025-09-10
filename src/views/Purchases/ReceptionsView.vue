<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Recepciones</h1>
        <p class="text-muted-foreground">
          Gestiona la recepción de mercancías y actualización de inventario
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportReceptions">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showCreateReceptionDialog = true">
          <Plus class="mr-2 h-4 w-4" />
          Nueva Recepción
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">Buscar</label>
            <Input
              v-model="searchTerm"
              placeholder="Número de documento, almacén..."
              class="mt-1"
            />
          </div>
          <div>
            <label class="text-sm font-medium">Estado</label>
            <select
              v-model="selectedStatus"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los estados</option>
              <option value="PARTIAL">Parcial</option>
              <option value="COMPLETE">Completa</option>
              <option value="REJECTED">Rechazada</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Almacén</label>
            <select
              v-model="selectedWarehouse"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los almacenes</option>
              <option
                v-for="warehouse in productsStore.activeWarehouses"
                :key="warehouse.id"
                :value="warehouse.id"
              >
                {{ warehouse.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium">Fecha</label>
            <select
              v-model="selectedDateRange"
              class="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Statistics Cards -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Total Recepciones</p>
              <p class="text-2xl font-bold">{{ filteredReceptions.length }}</p>
            </div>
            <Package class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Completas</p>
              <p class="text-2xl font-bold text-green-600">{{ completeCount }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Parciales</p>
              <p class="text-2xl font-bold text-orange-600">{{ partialCount }}</p>
            </div>
            <Clock class="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Este Mes</p>
              <p class="text-2xl font-bold">{{ currentMonthCount }}</p>
            </div>
            <Calendar class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Receptions Table -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Recepciones ({{ filteredReceptions.length }})</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="refreshData">
              <RefreshCw class="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Almacén</TableHead>
              <TableHead>Documento Origen</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Items</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="purchasesStore.loading">
              <TableCell colspan="6" class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin mr-2" />
                  Cargando recepciones...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredReceptions.length === 0">
              <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
                No se encontraron recepciones
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="reception in filteredReceptions" :key="reception.id" class="hover:bg-muted/50">
              <TableCell>
                <div class="font-medium">{{ formatDate(reception.reception_date) }}</div>
                <div class="text-xs text-muted-foreground">{{ formatDateTime(reception.created_at) }}</div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Warehouse class="h-4 w-4 text-muted-foreground" />
                  <span class="font-medium">{{ reception.warehouse_name || 'Almacén desconocido' }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="reception.purchase_doc_number" class="flex items-center gap-2">
                  <FileText class="h-4 w-4 text-muted-foreground" />
                  <span class="font-mono text-sm">{{ reception.purchase_doc_number }}</span>
                </div>
                <div v-else-if="reception.purchase_order_number" class="flex items-center gap-2">
                  <ShoppingCart class="h-4 w-4 text-muted-foreground" />
                  <span class="font-mono text-sm">Orden: {{ reception.purchase_order_number }}</span>
                </div>
                <div v-else class="text-muted-foreground">Sin documento</div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(reception.status)">
                  {{ getStatusText(reception.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Package class="h-4 w-4 text-muted-foreground" />
                  <span class="text-sm">{{ getReceptionItemsCount(reception.id) }} productos</span>
                </div>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="viewReception(reception)"
                    title="Ver detalles"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="editReception(reception)"
                    title="Editar"
                    :disabled="reception.status === 'COMPLETE'"
                  >
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8" 
                    @click="showReceptionActions(reception)"
                    title="Más acciones"
                  >
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Create Reception Dialog -->
    <Dialog v-model:open="showCreateReceptionDialog">
      <DialogContent class="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nueva Recepción</DialogTitle>
        </DialogHeader>
        <ReceptionForm
          @save="handleSaveReception"
          @cancel="showCreateReceptionDialog = false"
        />
      </DialogContent>
    </Dialog>

    <!-- View Reception Dialog -->
    <Dialog v-model:open="showViewReceptionDialog">
      <DialogContent class="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Detalles de Recepción
          </DialogTitle>
        </DialogHeader>
        <ReceptionDetails
          v-if="selectedReception"
          :reception="selectedReception"
          @close="showViewReceptionDialog = false"
          @edit="handleEditFromView"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore, type Reception } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import {
  Download,
  Plus,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  Calendar,
  Warehouse,
  FileText,
  ShoppingCart,
  Eye,
  Edit,
  MoreVertical,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import Table from '@/components/ui/Table.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'

// Reception Components (to be created)
import ReceptionForm from '@/components/purchases/ReceptionForm.vue'
import ReceptionDetails from '@/components/purchases/ReceptionDetails.vue'

const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()

// State
const searchTerm = ref('')
const selectedStatus = ref('')
const selectedWarehouse = ref('')
const selectedDateRange = ref('')
const showCreateReceptionDialog = ref(false)
const showViewReceptionDialog = ref(false)
const selectedReception = ref<Reception | null>(null)

// Computed
const filteredReceptions = computed(() => {
  let receptions = purchasesStore.activeReceptions

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    receptions = receptions.filter(reception => 
      reception.warehouse_name?.toLowerCase().includes(term) ||
      reception.purchase_doc_number?.toLowerCase().includes(term) ||
      reception.notes?.toLowerCase().includes(term)
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    receptions = receptions.filter(reception => reception.status === selectedStatus.value)
  }

  // Filter by warehouse
  if (selectedWarehouse.value) {
    receptions = receptions.filter(reception => reception.warehouse_id === selectedWarehouse.value)
  }

  // Filter by date range
  if (selectedDateRange.value) {
    const today = new Date()
    const receptionDate = (reception: Reception) => new Date(reception.reception_date)

    switch (selectedDateRange.value) {
      case 'today':
        receptions = receptions.filter(reception => 
          receptionDate(reception).toDateString() === today.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        receptions = receptions.filter(reception => receptionDate(reception) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        receptions = receptions.filter(reception => receptionDate(reception) >= monthAgo)
        break
    }
  }

  return receptions
})

const completeCount = computed(() => {
  return filteredReceptions.value.filter(r => r.status === 'COMPLETE').length
})

const partialCount = computed(() => {
  return filteredReceptions.value.filter(r => r.status === 'PARTIAL').length
})

const currentMonthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return filteredReceptions.value.filter(reception => {
    const receptionDate = new Date(reception.reception_date)
    return receptionDate.getMonth() === currentMonth && receptionDate.getFullYear() === currentYear
  }).length
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'PARTIAL': return 'warning'
    case 'COMPLETE': return 'success'
    case 'REJECTED': return 'destructive'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PARTIAL': 'Parcial',
    'COMPLETE': 'Completa',
    'REJECTED': 'Rechazada'
  }
  return statusMap[status] || status
}

const getReceptionItemsCount = (receptionId: string) => {
  return purchasesStore.getReceptionItems(receptionId).length
}

const viewReception = (reception: Reception) => {
  selectedReception.value = reception
  purchasesStore.selectReception(reception)
  showViewReceptionDialog.value = true
}

const editReception = (reception: Reception) => {
  selectedReception.value = reception
  purchasesStore.selectReception(reception)
  // TODO: Open edit dialog
}

const showReceptionActions = (reception: Reception) => {
  // TODO: Show context menu with actions
  console.log('Show actions for reception:', reception)
}

const handleSaveReception = async (receptionData: any) => {
  try {
    // TODO: Implement save logic
    console.log('Save reception:', receptionData)
    showCreateReceptionDialog.value = false
    await refreshData()
  } catch (error) {
    console.error('Error saving reception:', error)
  }
}

const handleEditFromView = (reception: Reception) => {
  showViewReceptionDialog.value = false
  editReception(reception)
}

const exportReceptions = () => {
  // TODO: Implement bulk export logic
  console.log('Export all receptions')
}

const refreshData = async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      purchasesStore.fetchReceptions(companyStore.selectedCompany.id),
      productsStore.fetchWarehouses(companyStore.selectedCompany.id)
    ])
  }
}

// Lifecycle
onMounted(async () => {
  if (companyStore.selectedCompany) {
    await refreshData()
  }
})

// Watchers
watch(
  () => companyStore.selectedCompany,
  async (newCompany) => {
    if (newCompany) {
      await refreshData()
    }
  }
)
</script>