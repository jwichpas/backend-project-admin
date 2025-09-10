<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Gestión de Compras</h1>
        <p class="text-muted-foreground">
          Panel principal para la gestión completa del flujo de compras
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" @click="exportData">
          <Download class="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button size="sm" @click="showQuickActions = !showQuickActions">
          <Plus class="mr-2 h-4 w-4" />
          Acciones Rápidas
        </Button>
      </div>
    </div>

    <!-- Quick Actions -->
    <Card v-if="showQuickActions" class="border-dashed">
      <CardContent class="p-6">
        <div class="grid gap-4 md:grid-cols-4">
          <Button @click="navigateToOrders" class="h-20 flex-col">
            <ShoppingCart class="h-6 w-6 mb-2" />
            Nueva Orden de Compra
          </Button>
          <Button @click="navigateToDocs" class="h-20 flex-col">
            <FileText class="h-6 w-6 mb-2" />
            Registrar Documento
          </Button>
          <Button @click="navigateToReceptions" class="h-20 flex-col">
            <Package class="h-6 w-6 mb-2" />
            Nueva Recepción
          </Button>
          <Button @click="navigateToSuppliers" class="h-20 flex-col" variant="outline">
            <Building2 class="h-6 w-6 mb-2" />
            Gestionar Proveedores
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Key Metrics -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <!-- Purchase Orders Metrics -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Órdenes Pendientes</p>
              <p class="text-2xl font-bold text-orange-600">{{ pendingOrdersCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                Total: {{ formatCurrency(pendingOrdersValue, 'PEN') }}
              </p>
            </div>
            <div class="relative">
              <ShoppingCart class="h-8 w-8 text-orange-500" />
              <Badge 
                v-if="urgentOrdersCount > 0" 
                variant="destructive" 
                class="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {{ urgentOrdersCount }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Documents This Month -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Docs. Este Mes</p>
              <p class="text-2xl font-bold text-blue-600">{{ currentMonthDocsCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                Valor: {{ formatCurrency(currentMonthDocsValue, 'PEN') }}
              </p>
            </div>
            <FileText class="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <!-- Receptions Today -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Recepciones Hoy</p>
              <p class="text-2xl font-bold text-green-600">{{ todayReceptionsCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ partialReceptionsCount }} parciales
              </p>
            </div>
            <Package class="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <!-- Active Suppliers -->
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">Proveedores Activos</p>
              <p class="text-2xl font-bold text-purple-600">{{ activeSuppliersCount }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ newSuppliersCount }} nuevos este mes
              </p>
            </div>
            <Building2 class="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recent Purchase Orders -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Órdenes de Compra Recientes</span>
            <Button variant="outline" size="sm" @click="navigateToOrders">
              Ver todas
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="purchasesStore.loading" class="flex items-center justify-center py-8">
            <Loader2 class="h-6 w-6 animate-spin mr-2" />
            Cargando órdenes...
          </div>
          <div v-else-if="recentOrders.length === 0" class="text-center py-8 text-muted-foreground">
            No hay órdenes recientes
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="order in recentOrders" 
              :key="order.id"
              class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
              @click="viewOrder(order)"
            >
              <div class="flex items-center gap-3">
                <div class="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <ShoppingCart class="h-4 w-4 text-white" />
                </div>
                <div>
                  <p class="font-medium text-sm">{{ order.supplier_name }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatDate(order.order_date) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-medium text-sm">{{ formatCurrency(order.total_amount, order.currency_code) }}</p>
                <Badge :variant="getStatusVariant(order.status)" class="text-xs">
                  {{ getStatusText(order.status) }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Alerts & Notifications -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5" />
            Alertas y Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Urgent Orders -->
            <div v-if="urgentOrdersCount > 0" class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start gap-2">
                <AlertTriangle class="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-red-800">
                    {{ urgentOrdersCount }} órdenes vencidas
                  </p>
                  <p class="text-xs text-red-600">
                    Fecha de entrega esperada pasada
                  </p>
                </div>
              </div>
            </div>

            <!-- Partial Receptions -->
            <div v-if="partialReceptionsCount > 0" class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div class="flex items-start gap-2">
                <Clock class="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-orange-800">
                    {{ partialReceptionsCount }} recepciones parciales
                  </p>
                  <p class="text-xs text-orange-600">
                    Pendientes de completar
                  </p>
                </div>
              </div>
            </div>

            <!-- Low Stock Alert (if applicable) -->
            <div v-if="lowStockProductsCount > 0" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-start gap-2">
                <Package class="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-yellow-800">
                    {{ lowStockProductsCount }} productos con stock bajo
                  </p>
                  <p class="text-xs text-yellow-600">
                    Considerar crear órdenes de compra
                  </p>
                </div>
              </div>
            </div>

            <!-- Success message if no alerts -->
            <div v-if="totalAlertsCount === 0" class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-start gap-2">
                <CheckCircle class="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-green-800">
                    Todo en orden
                  </p>
                  <p class="text-xs text-green-600">
                    No hay alertas pendientes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="recentActivity.length === 0" class="text-center py-8 text-muted-foreground">
          No hay actividad reciente
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="activity in recentActivity" 
            :key="activity.id"
            class="flex items-center gap-3 p-3 rounded-lg border"
          >
            <div class="h-8 w-8 rounded-full flex items-center justify-center" :class="activity.iconClass">
              <component :is="activity.icon" class="h-4 w-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">{{ activity.title }}</p>
              <p class="text-xs text-muted-foreground">{{ activity.description }}</p>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ formatRelativeTime(activity.timestamp) }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import { usePurchasesStore, type PurchaseOrder } from '@/stores/purchases'
import { useProductsStore } from '@/stores/products'
import {
  Download,
  Plus,
  ShoppingCart,
  FileText,
  Package,
  Building2,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-vue-next'

// UI Components
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Badge from '@/components/ui/Badge.vue'

const router = useRouter()
const companyStore = useCompanyStore()
const purchasesStore = usePurchasesStore()
const productsStore = useProductsStore()

// State
const showQuickActions = ref(false)

// Mock data for demonstration
const lowStockProductsCount = ref(5)
const newSuppliersCount = ref(2)

// Computed
const recentOrders = computed(() => {
  return purchasesStore.purchaseOrders.slice(0, 5)
})

const pendingOrdersCount = computed(() => {
  return purchasesStore.pendingPurchaseOrders.length
})

const pendingOrdersValue = computed(() => {
  return purchasesStore.pendingPurchaseOrders.reduce((total, order) => {
    // Convert to PEN for unified display
    const valueInPEN = order.currency_code === 'PEN' 
      ? order.total_amount 
      : order.total_amount * (order.exchange_rate || 1)
    return total + valueInPEN
  }, 0)
})

const urgentOrdersCount = computed(() => {
  const today = new Date()
  return purchasesStore.pendingPurchaseOrders.filter(order => {
    if (!order.expected_delivery_date) return false
    return new Date(order.expected_delivery_date) < today
  }).length
})

const currentMonthDocsCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return purchasesStore.activePurchaseDocs.filter(doc => {
    const docDate = new Date(doc.issue_date)
    return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear
  }).length
})

const currentMonthDocsValue = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return purchasesStore.activePurchaseDocs
    .filter(doc => {
      const docDate = new Date(doc.issue_date)
      return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear
    })
    .reduce((total, doc) => total + doc.total_ope_gravadas_local, 0)
})

const todayReceptionsCount = computed(() => {
  const today = new Date().toDateString()
  return purchasesStore.receptions.filter(reception => 
    new Date(reception.reception_date).toDateString() === today
  ).length
})

const partialReceptionsCount = computed(() => {
  return purchasesStore.receptions.filter(r => r.status === 'PARTIAL').length
})

const activeSuppliersCount = computed(() => {
  return purchasesStore.activeSuppliers.length
})

const totalAlertsCount = computed(() => {
  return urgentOrdersCount.value + partialReceptionsCount.value + lowStockProductsCount.value
})

const recentActivity = computed(() => {
  const activities = []

  // Add recent orders
  purchasesStore.purchaseOrders.slice(0, 3).forEach(order => {
    activities.push({
      id: `order-${order.id}`,
      title: 'Nueva orden de compra creada',
      description: `${order.supplier_name} - ${formatCurrency(order.total_amount, order.currency_code)}`,
      timestamp: order.created_at,
      icon: ShoppingCart,
      iconClass: 'bg-blue-500'
    })
  })

  // Add recent docs
  purchasesStore.activePurchaseDocs.slice(0, 2).forEach(doc => {
    activities.push({
      id: `doc-${doc.id}`,
      title: 'Documento de compra registrado',
      description: `${doc.series}-${doc.number} - ${doc.supplier_name}`,
      timestamp: doc.created_at,
      icon: FileText,
      iconClass: 'bg-indigo-500'
    })
  })

  // Add recent receptions
  purchasesStore.receptions.slice(0, 2).forEach(reception => {
    activities.push({
      id: `reception-${reception.id}`,
      title: 'Recepción procesada',
      description: `${reception.warehouse_name} - ${getStatusText(reception.status)}`,
      timestamp: reception.created_at,
      icon: Package,
      iconClass: 'bg-green-500'
    })
  })

  // Sort by timestamp (most recent first)
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PE')
}

const formatCurrency = (amount: number, currencyCode: string) => {
  if (currencyCode === 'PEN') {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else if (currencyCode === 'USD') {
    return `$ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  } else {
    return `${currencyCode} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
  }
}

const formatRelativeTime = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Hace unos minutos'
  if (diffInHours < 24) return `Hace ${diffInHours} horas`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Hace ${diffInDays} días`
  
  return formatDate(dateString)
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'destructive'
    case 'RECEIVED': return 'secondary'
    case 'CANCELLED': return 'outline'
    case 'PARTIAL': return 'warning'
    case 'COMPLETE': return 'success'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  const statusMap = {
    'PENDING': 'Pendiente',
    'APPROVED': 'Aprobada',
    'REJECTED': 'Rechazada',
    'RECEIVED': 'Recibida',
    'CANCELLED': 'Cancelada',
    'PARTIAL': 'Parcial',
    'COMPLETE': 'Completa'
  }
  return statusMap[status] || status
}

const viewOrder = (order: PurchaseOrder) => {
  purchasesStore.selectPurchaseOrder(order)
  router.push('/purchases/orders')
}

// Navigation methods
const navigateToOrders = () => {
  router.push('/purchases/orders')
}

const navigateToDocs = () => {
  router.push('/purchases/docs')
}

const navigateToReceptions = () => {
  router.push('/purchases/receptions')
}

const navigateToSuppliers = () => {
  router.push('/parties')
}

const exportData = () => {
  // TODO: Implement export functionality
  console.log('Export purchase data')
}

const refreshData = async () => {
  if (companyStore.selectedCompany) {
    await Promise.all([
      purchasesStore.fetchPurchaseOrders(companyStore.selectedCompany.id),
      purchasesStore.fetchPurchaseDocs(companyStore.selectedCompany.id),
      purchasesStore.fetchReceptions(companyStore.selectedCompany.id),
      purchasesStore.fetchSuppliers(companyStore.selectedCompany.id)
    ])
  }
}

// Lifecycle
onMounted(async () => {
  console.log('PurchasesView onMounted - selectedCompany:', companyStore.selectedCompany)
  console.log('Companies available:', companyStore.companies)
  
  // If no company is selected but companies exist, select the first one
  if (!companyStore.selectedCompany && companyStore.companies.length === 0) {
    console.log('No companies loaded, fetching companies...')
    await companyStore.fetchCompanies()
  }
  
  if (!companyStore.selectedCompany && companyStore.companies.length > 0) {
    console.log('Auto-selecting first company:', companyStore.companies[0])
    companyStore.selectCompany(companyStore.companies[0])
  }
  
  if (companyStore.selectedCompany) {
    console.log('Fetching purchase data for company:', companyStore.selectedCompany.id)
    await refreshData()
  } else {
    console.warn('No company available to fetch purchase data')
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