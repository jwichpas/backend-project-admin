<template>
  <div class="p-6 space-y-6">
    <!-- Header with filters and refresh button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Dashboard de Ventas</h1>
        <p class="text-muted-foreground">Análisis y métricas de ventas en tiempo real</p>
        <div v-if="lastRefresh" class="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Clock class="h-3 w-3" />
          Última actualización: {{ formatDateTime(lastRefresh) }}
        </div>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Date Range Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">Período:</label>
          <input
            type="date"
            v-model="dashboardStore.selectedDateRange.start"
            @change="applyFilters"
            class="px-2 py-1 text-xs border border-input rounded-md bg-background"
          />
          <span class="text-sm text-muted-foreground">a</span>
          <input
            type="date"
            v-model="dashboardStore.selectedDateRange.end"
            @change="applyFilters"
            class="px-2 py-1 text-xs border border-input rounded-md bg-background"
          />
        </div>

        <!-- Refresh Button -->
        <Button
          @click="refreshViews"
          :disabled="loading"
          variant="outline"
          size="sm"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <RefreshCw v-else class="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Sales -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Ventas del Mes</p>
            <h3 class="text-2xl font-bold">
              {{ formatCurrency(currentMonthStats?.total_sales || 0) }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              {{ currentMonthStats?.total_transactions || 0 }} transacciones
            </p>
          </div>
          <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign class="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Avg Transaction Value -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
            <h3 class="text-2xl font-bold">
              {{ formatCurrency(currentMonthStats?.avg_transaction_value || 0) }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Por transacción
            </p>
          </div>
          <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <TrendingUp class="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Unique Customers -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Clientes Únicos</p>
            <h3 class="text-2xl font-bold">
              {{ currentMonthStats?.unique_customers || 0 }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Este mes
            </p>
          </div>
          <div class="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Users class="h-4 w-4 text-purple-600" />
          </div>
        </div>
      </div>

      <!-- Items Sold -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Items Vendidos</p>
            <h3 class="text-2xl font-bold">
              {{ formatNumber(currentMonthStats?.total_items_sold || 0) }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Unidades
            </p>
          </div>
          <div class="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Package class="h-4 w-4 text-orange-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Trend Chart with ApexCharts -->
      <SalesTrendChart
        :monthly-trend="salesTrendData"
        :profit-data="profitTrendData"
        :theme="currentTheme"
        :loading="loading"
      />

      <!-- Top Sellers -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Top Vendedores</h3>
          <Trophy class="h-5 w-5 text-muted-foreground" />
        </div>

        <div v-if="topSellersByMonth.length > 0" class="space-y-3">
          <div
            v-for="(seller, index) in topSellersByMonth.slice(0, 5)"
            :key="seller.seller_user_id"
            class="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                   :class="index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-400 text-white dark:bg-gray-600' : index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                {{ index + 1 }}
              </div>
              <div>
                <p class="font-medium text-sm">{{ seller.seller_name }}</p>
                <p class="text-xs text-muted-foreground">{{ seller.total_transactions }} ventas</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-sm">{{ formatCurrency(seller.total_sales) }}</p>
              <p class="text-xs text-muted-foreground">{{ seller.unique_customers }} clientes</p>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center py-8">
          <p class="text-muted-foreground">No hay datos disponibles</p>
        </div>
      </div>
    </div>

    <!-- Advanced Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Top Products Table -->
      <TopProductsTable
        :products="topProductsByValue"
        :theme="currentTheme"
        :max-items="10"
      />

      <!-- Sales Channel Chart -->
      <SalesChannelChart
        :channels="channelMonthly"
        :theme="currentTheme"
      />
    </div>

    <!-- Profitability Analysis -->
    <ProfitabilityChart
      :metrics="profitabilityMetrics"
      :theme="currentTheme"
    />

    <!-- Customer Analysis -->
    <div class="bg-card border border-border rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Mejores Clientes</h3>
        <Users class="h-5 w-5 text-muted-foreground" />
      </div>

      <div v-if="topCustomers.length > 0" class="space-y-3">
        <div
          v-for="(customer, index) in topCustomers.slice(0, 5)"
          :key="customer.customer_id"
          class="flex items-center justify-between p-3 bg-muted rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 text-white text-xs font-bold">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <p class="font-medium text-sm">{{ customer.customer_name || 'Cliente General' }}</p>
              <p class="text-xs text-muted-foreground">{{ customer.customer_doc_number || 'Sin documento' }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-sm">{{ formatCurrency(customer.total_sales_value) }}</p>
            <p class="text-xs text-muted-foreground">{{ customer.total_transactions }} compras</p>
          </div>
        </div>
      </div>

      <div v-else class="flex items-center justify-center py-8">
        <p class="text-muted-foreground">No hay datos disponibles</p>
      </div>
    </div>

    <!-- Branch Performance (if multiple branches) -->
    <div v-if="branchStats.length > 1" class="bg-card border border-border rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Rendimiento por Sucursal</h3>
        <Building class="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="branch in branchStats" 
          :key="branch.branch_id"
          class="p-4 bg-muted rounded-lg"
        >
          <h4 class="font-semibold text-sm mb-2">{{ branch.branch_name || 'Sucursal Principal' }}</h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span>Ventas:</span>
              <span class="font-bold">{{ formatCurrency(branch.total_sales_value) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Transacciones:</span>
              <span>{{ branch.total_transactions }}</span>
            </div>
            <div class="flex justify-between">
              <span>Clientes:</span>
              <span>{{ branch.unique_customers }}</span>
            </div>
            <div class="flex justify-between">
              <span>Vendedores:</span>
              <span>{{ branch.unique_sellers }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesDashboardStore } from '@/stores/salesDashboard'
import { useCompaniesStore } from '@/stores/companies'
import { useThemeStore } from '@/stores/theme'
import {
  Clock,
  RefreshCw,
  Loader2,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Trophy,
  Building
} from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart.vue'
import TopProductsTable from '@/components/dashboard/TopProductsTable.vue'
import SalesChannelChart from '@/components/dashboard/SalesChannelChart.vue'
import ProfitabilityChart from '@/components/dashboard/ProfitabilityChart.vue'

const dashboardStore = useSalesDashboardStore()
const companiesStore = useCompaniesStore()
const themeStore = useThemeStore()

// Local state
const loading = ref(false)

// Computed
const currentMonthStats = computed(() => dashboardStore.currentMonthStats)
const topSellersByMonth = computed(() => dashboardStore.topSellersByMonth)
const topProductsByValue = computed(() => dashboardStore.topProductsByValue)
const topCustomers = computed(() => dashboardStore.topCustomers)
const salesTrendData = computed(() => dashboardStore.salesTrendData)
const branchStats = computed(() => dashboardStore.branchStats)
const lastRefresh = computed(() => dashboardStore.lastRefresh)
const profitabilityMetrics = computed(() => dashboardStore.profitabilityMetrics)
const channelMonthly = computed(() => dashboardStore.channelMonthly)
const profitTrendData = computed(() => dashboardStore.profitTrendData)
const currentTheme = computed(() => themeStore.isDark ? 'dark' : 'light')

// Methods
const formatCurrency = (amount: number) => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatNumber = (num: number) => {
  return num.toLocaleString('es-PE')
}

const formatMonth = (monthStr: string) => {
  const date = new Date(monthStr)
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })
}

const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('es-PE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refreshViews = async () => {
  if (!companiesStore.currentCompany?.id) return

  loading.value = true
  try {
    // Refresh materialized views first
    await dashboardStore.refreshMaterializedViews(companiesStore.currentCompany.id)
    
    // Then fetch all dashboard data
    await dashboardStore.fetchAllDashboardData(companiesStore.currentCompany.id)
  } catch (error) {
    console.error('Error refreshing dashboard:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  if (!companiesStore.currentCompany?.id) return
  
  loading.value = true
  try {
    await dashboardStore.fetchAllDashboardData(companiesStore.currentCompany.id)
  } catch (error) {
    console.error('Error applying filters:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (companiesStore.currentCompany?.id) {
    loading.value = true
    try {
      await dashboardStore.fetchAllDashboardData(companiesStore.currentCompany.id)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // TODO: Show error toast
    } finally {
      loading.value = false
    }
  }
})
</script>