<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <!-- Collapsible Sidebar -->
    <aside class="relative flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300 ease-in-out" :class="[isCollapsed ? 'w-20' : 'w-64']">
      <div class="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div v-if="!isCollapsed" class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Package class="h-5 w-5" />
          </div>
          <span class="font-bold text-sidebar-foreground">ERP System</span>
        </div>
        <button @click="toggleCollapse" class="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu class="h-5 w-5" />
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto px-2">
        <ul class="space-y-1">
          <!-- Dashboard -->
          <li>
            <router-link to="/" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/')">
              <LayoutDashboard class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/')" />
              <span v-if="!isCollapsed">Dashboard</span>
            </router-link>
          </li>

          <!-- Sales Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ventas</p>
          </li>
          <li>
            <router-link to="/pos" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/pos')">
              <CreditCard class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/pos')" />
              <span v-if="!isCollapsed">Punto de Venta</span>
            </router-link>
          </li>
          <li>
            <div class="relative">
              <button
                @click="toggleSalesMenu"
                class="group flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="getNavClass('/sales')"
              >
                <Receipt class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/sales')" />
                <span v-if="!isCollapsed" class="flex-1 text-left">Gestión de Ventas</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': salesMenuOpen }"
                />
              </button>

              <!-- Sales Submenu -->
              <div v-if="salesMenuOpen && !isCollapsed" class="mt-1 space-y-1 pl-6">
                <router-link
                  to="/sales/dashboard"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/sales/dashboard')"
                >
                  Dashboard de Ventas
                </router-link>
                <router-link
                  to="/sales/orders"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/sales/orders')"
                >
                  Órdenes de Venta
                </router-link>
                <router-link
                  to="/sales/documents"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/sales/documents')"
                >
                  Documentos de Venta
                </router-link>
                <router-link
                  to="/sales/shipments"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/sales/shipments')"
                >
                  Envíos
                </router-link>
                <router-link
                  to="/sales/dispatch"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/sales/dispatch')"
                >
                  Órdenes de Despacho
                </router-link>
              </div>
            </div>
          </li>
          <li>
            <router-link to="/customers" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/customers')">
              <Users class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/customers')" />
              <span v-if="!isCollapsed">Clientes</span>
            </router-link>
          </li>

          <!-- Purchases Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compras</p>
          </li>
          <li>
            <div class="relative">
              <button
                @click="togglePurchasesMenu"
                class="group flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="getNavClass('/purchases')"
              >
                <ShoppingCart class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/purchases')" />
                <span v-if="!isCollapsed" class="flex-1 text-left">Compras</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': purchasesMenuOpen }"
                />
              </button>

              <!-- Purchases Submenu -->
              <div v-if="purchasesMenuOpen && !isCollapsed" class="mt-1 space-y-1 pl-6">
                <router-link
                  to="/purchases"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/purchases')"
                >
                  Dashboard de Compras
                </router-link>
                <router-link
                  to="/purchases/orders"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/purchases/orders')"
                >
                  Órdenes de Compra
                </router-link>
                <router-link
                  to="/purchases/docs"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/purchases/docs')"
                >
                  Documentos de Compra
                </router-link>
                <router-link
                  to="/purchases/receptions"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/purchases/receptions')"
                >
                  Recepciones
                </router-link>
              </div>
            </div>
          </li>
          <li>
            <router-link to="/suppliers" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/suppliers')">
              <Truck class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/suppliers')" />
              <span v-if="!isCollapsed">Proveedores</span>
            </router-link>
          </li>

          <!-- Inventory Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventario</p>
          </li>
          <li>
            <div class="relative">
              <button
                @click="toggleProductsMenu"
                class="group flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="getNavClass('/products')"
              >
                <Package class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/products')" />
                <span v-if="!isCollapsed" class="flex-1 text-left">Productos</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': productsMenuOpen }"
                />
              </button>

              <!-- Products Submenu -->
              <div v-if="productsMenuOpen && !isCollapsed" class="mt-1 space-y-1 pl-6">
                <router-link
                  to="/products"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/products')"
                >
                  Lista de Productos
                </router-link>
                <router-link
                  to="/products/categories"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/products/categories')"
                >
                  Categorías
                </router-link>
                <router-link
                  to="/products/brands"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/products/brands')"
                >
                  Marcas
                </router-link>
                <router-link
                  to="/products/price-lists"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/products/price-lists')"
                >
                  Listas de Precios
                </router-link>
                <router-link
                  to="/products/locations"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/products/locations')"
                >
                  Ubicaciones
                </router-link>
              </div>
            </div>
          </li>
          <li>
            <router-link to="/inventory" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/inventory')">
              <Package2 class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/inventory')" />
              <span v-if="!isCollapsed">Inventario</span>
            </router-link>
          </li>
          <li>
            <div class="relative">
              <button
                @click="toggleWarehousesMenu"
                class="group flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="getNavClass('/warehouses')"
              >
                <Warehouse class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/warehouses')" />
                <span v-if="!isCollapsed" class="flex-1 text-left">Almacenes</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': warehousesMenuOpen }"
                />
              </button>

              <!-- Warehouses Submenu -->
              <div v-if="warehousesMenuOpen && !isCollapsed" class="mt-1 space-y-1 pl-6">
                <router-link
                  to="/warehouses"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/warehouses')"
                >
                  Gestión de Almacenes
                </router-link>
                <router-link
                  to="/warehouses/visualizer"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/warehouses/visualizer')"
                >
                  Visualizador 2D/3D
                </router-link>
              </div>
            </div>
          </li>

          <!-- Logistics Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logística</p>
          </li>
          <li>
            <div class="relative">
              <button
                @click="toggleVehiclesMenu"
                class="group flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="getNavClass('/vehicles')"
              >
                <Car class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/vehicles')" />
                <span v-if="!isCollapsed" class="flex-1 text-left">Vehículos y Conductores</span>
                <ChevronDown
                  v-if="!isCollapsed"
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': vehiclesMenuOpen }"
                />
              </button>

              <!-- Vehicles Submenu -->
              <div v-if="vehiclesMenuOpen && !isCollapsed" class="mt-1 space-y-1 pl-6">
                <router-link
                  to="/vehicles"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/vehicles')"
                >
                  Lista de Vehículos
                </router-link>
                <router-link
                  to="/vehicles/drivers"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/vehicles/drivers')"
                >
                  Conductores
                </router-link>
                <router-link
                  to="/vehicles/tracking"
                  class="block rounded-md px-3 py-2 text-sm transition-colors"
                  :class="getSubmenuClass('/vehicles/tracking')"
                >
                  Seguimiento GPS
                </router-link>
              </div>
            </div>
          </li>
          <li>
            <router-link to="/map" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/map')">
              <MapPin class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/map')" />
              <span v-if="!isCollapsed">Mapa</span>
            </router-link>
          </li>

          <!-- Reports Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reportes</p>
          </li>
          <li>
            <router-link to="/reports" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/reports')">
              <BarChart3 class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/reports')" />
              <span v-if="!isCollapsed">Reportes</span>
            </router-link>
          </li>

          <!-- Administration Section -->
          <li class="mt-6">
            <p v-if="!isCollapsed" class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
          </li>
          <li>
            <router-link to="/companies" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/companies')">
              <Building class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/companies')" />
              <span v-if="!isCollapsed">Empresas</span>
            </router-link>
          </li>
          <li>
            <router-link to="/branches" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/branches')">
              <MapPin class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/branches')" />
              <span v-if="!isCollapsed">Sucursales</span>
            </router-link>
          </li>
          <li>
            <router-link to="/sunat" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/sunat')">
              <FileText class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/sunat')" />
              <span v-if="!isCollapsed">Catálogos SUNAT</span>
            </router-link>
          </li>
          <li>
            <router-link to="/exchange-rates" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/exchange-rates')">
              <DollarSign class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/exchange-rates')" />
              <span v-if="!isCollapsed">Tipos de Cambio</span>
            </router-link>
          </li>

          <!-- Settings -->
          <li class="mt-6">
            <router-link to="/settings" class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors" :class="getNavClass('/settings')">
              <Settings class="mr-3 h-5 w-5 transition-colors" :class="getIconClass('/settings')" />
              <span v-if="!isCollapsed">Configuración</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <header class="flex h-16 items-center justify-between border-b bg-background px-6">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-foreground capitalize">{{ getPageTitle() }}</h1>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Exchange Rate Display -->
          <div v-if="companiesStore.currentCompany && exchangeRates.length > 0" class="flex items-center gap-3 px-3 py-1 bg-muted/50 rounded-md">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-muted-foreground">{{ companiesStore.currentCompany.currency_code }}:</span>
              <div class="flex gap-2">
                <span v-for="rate in exchangeRates" :key="rate.id" class="text-xs font-mono">
                  {{ rate.to_currency_code }}: {{ formatExchangeRate(rate.rate) }}
                </span>
              </div>
            </div>
          </div>
          <!-- Company Selector -->
          <div v-if="companiesStore.userCompanies.length > 0" class="min-w-[200px]">
            <div class="flex items-center gap-2 mb-1">
              <Building class="h-3 w-3 text-muted-foreground" />
              <span class="text-xs font-medium text-muted-foreground">Empresa</span>
            </div>
            <select
              v-model="selectedCompanyId"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
              @change="onCompanyChange"
            >
              <option value="">Seleccionar empresa</option>
              <option
                v-for="userCompany in companiesStore.userCompanies"
                :key="userCompany.company.id"
                :value="userCompany.company.id"
              >
                {{ userCompany.company.trade_name || userCompany.company.legal_name }}
              </option>
            </select>
          </div>

          <!-- Branch Selector -->
          <div v-if="availableBranches.length > 0" class="min-w-[160px]">
            <div class="flex items-center gap-2 mb-1">
              <MapPin class="h-3 w-3 text-muted-foreground" />
              <span class="text-xs font-medium text-muted-foreground">Sucursal</span>
            </div>
            <select
              v-model="selectedBranchId"
              class="w-full px-2 py-1 text-xs border border-input rounded-md bg-background"
              @change="onBranchChange"
            >
              <option value="">Todas las sucursales</option>
              <option
                v-for="branch in availableBranches"
                :key="branch.id"
                :value="branch.id"
              >
                {{ branch.code }} - {{ branch.name }}
              </option>
            </select>
          </div>



          <!-- Notifications -->
          <div class="relative notifications-dropdown">
            <button
              @click="toggleNotifications"
              class="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
            >
              <Bell class="h-5 w-5" />
              <span v-if="unreadNotifications > 0" class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
              </span>
            </button>

            <!-- Notifications Dropdown -->
            <div v-if="notificationsOpen" class="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-50">
              <div class="p-3 border-b">
                <div class="flex items-center justify-between">
                  <h3 class="font-medium">Notificaciones</h3>
                  <button
                    @click="markAllAsRead"
                    class="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Marcar todas como leídas
                  </button>
                </div>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div v-if="notifications.length === 0" class="p-4 text-center text-muted-foreground">
                  No hay notificaciones
                </div>
                <div v-else>
                  <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    class="p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    :class="{ 'bg-blue-50 dark:bg-blue-950/20': !notification.read }"
                    @click="markAsRead(notification.id)"
                  >
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 mt-1">
                        <div class="h-2 w-2 bg-blue-500 rounded-full" v-if="!notification.read"></div>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-medium">{{ notification.title }}</p>
                        <p class="text-xs text-muted-foreground mt-1">{{ notification.message }}</p>
                        <p class="text-xs text-muted-foreground mt-1">{{ formatDate(notification.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dark Mode Toggle -->
          <button @click="toggleDarkMode" class="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <Moon v-if="!darkMode" class="h-5 w-5" />
            <Sun v-else class="h-5 w-5" />
          </button>

          <!-- User Profile -->
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center rounded-full p-1 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User class="h-4 w-4" />
              </div>
            </button>
            <div
              v-if="userMenuOpen"
              class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover border shadow-lg"
            >
              <div class="py-1">
                <a href="#" class="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted">Mi Perfil</a>
                <a href="#" class="block px-4 py-2 text-sm text-popover-foreground hover:bg-muted">Configuración</a>
                <div class="border-t border-border my-1"></div>
                <button @click="logout" class="block w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useBranchesStore } from '@/stores/branches'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import {
  Menu, LayoutDashboard, Settings, Moon, Sun, User,
  Receipt, Users, ShoppingCart, Truck, Package, Package2, Warehouse, BarChart3,
  Building, MapPin, FileText, ChevronDown, Bell, DollarSign, CreditCard, Car
} from 'lucide-vue-next'
import Select from '@/components/ui/Select.vue'
import { supabase } from '@/lib/supabase'

interface ExchangeRate {
  id: number
  rate_date: string
  from_currency_code: string
  to_currency_code: string
  rate: number
}

interface Notification {
  id: number
  title: string
  message: string
  read: boolean
  created_at: string
}

const route = useRoute()
const router = useRouter()
const companiesStore = useCompaniesStore()
const branchesStore = useBranchesStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const userMenuOpen = ref(false)
const productsMenuOpen = ref(false)
const salesMenuOpen = ref(false)
const purchasesMenuOpen = ref(false)
const vehiclesMenuOpen = ref(false)
const warehousesMenuOpen = ref(false)
const notificationsOpen = ref(false)
const exchangeRates = ref<ExchangeRate[]>([])
const notifications = ref<Notification[]>([])

const toggleCollapse = () => { isCollapsed.value = !isCollapsed.value }
const toggleProductsMenu = () => { productsMenuOpen.value = !productsMenuOpen.value }
const toggleSalesMenu = () => { salesMenuOpen.value = !salesMenuOpen.value }
const togglePurchasesMenu = () => { purchasesMenuOpen.value = !purchasesMenuOpen.value }
const toggleVehiclesMenu = () => { vehiclesMenuOpen.value = !vehiclesMenuOpen.value }
const toggleWarehousesMenu = () => { warehousesMenuOpen.value = !warehousesMenuOpen.value }
const toggleNotifications = () => { notificationsOpen.value = !notificationsOpen.value }

// Company and Branch selection
const selectedCompanyId = ref<string | null>(null)
const selectedBranchId = ref<string | null>(localStorage.getItem('selectedBranchId') || null)

// Available branches for the selected company
const availableBranches = computed(() => {
  return selectedCompanyId.value ? branchesStore.branches : []
})

// Current selected company name for display
const selectedCompanyName = computed(() => {
  const userCompany = companiesStore.userCompanies.find(uc => uc.company.id === selectedCompanyId.value)
  return userCompany ? (userCompany.company.trade_name || userCompany.company.legal_name) : ''
})

// Current selected branch name for display
const selectedBranchName = computed(() => {
  const branch = branchesStore.branches.find(b => b.id === selectedBranchId.value)
  return branch ? `${branch.code} - ${branch.name}` : ''
})

const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// Handlers for selector changes
const onCompanyChange = async () => {
  if (selectedCompanyId.value) {
    // Set current company in the store
    const userCompany = companiesStore.userCompanies.find(uc => uc.company.id === selectedCompanyId.value)
    if (userCompany) {
      companiesStore.setCurrentCompany(userCompany.company)
    }

    // Load branches for the selected company
    await branchesStore.fetchAll(selectedCompanyId.value)

    // Check if current selected branch belongs to this company
    const savedBranchId = localStorage.getItem('selectedBranchId')
    if (savedBranchId && branchesStore.branches.find(b => b.id === savedBranchId)) {
      selectedBranchId.value = savedBranchId
    } else {
      selectedBranchId.value = ''
      localStorage.removeItem('selectedBranchId')
    }
  } else {
    companiesStore.currentCompany = null
    branchesStore.reset()
    selectedBranchId.value = ''
    localStorage.removeItem('selectedBranchId')
  }
}

const onBranchChange = () => {
  // Save selected branch to localStorage for persistence
  if (selectedBranchId.value) {
    localStorage.setItem('selectedBranchId', selectedBranchId.value)
  } else {
    localStorage.removeItem('selectedBranchId')
  }
  console.log('Branch changed to:', selectedBranchId.value)
}

// Page title helper
const getPageTitle = () => {
  const routeNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'products': 'Productos',
    'products-categories': 'Categorías',
    'products-brands': 'Marcas',
    'products-price-lists': 'Listas de Precios',
    'products-locations': 'Ubicaciones',
    'sales': 'Ventas',
    'sales-orders': 'Órdenes de Venta',
    'sales-documents': 'Documentos de Venta',
    'sales-shipments': 'Envíos',
    'sales-dispatch': 'Órdenes de Despacho',
    'purchases': 'Compras',
    'purchases-orders': 'Órdenes de Compra',
    'purchases-docs': 'Documentos de Compra', 
    'purchases-receptions': 'Recepciones',
    'inventory': 'Inventario',
    'warehouses': 'Gestión de Almacenes',
    'warehouse-visualizer': 'Visualizador de Almacenes',
    'customers': 'Clientes',
    'suppliers': 'Proveedores',
    'vehicles': 'Vehículos',
    'vehicles-drivers': 'Conductores',
    'vehicles-tracking': 'Seguimiento GPS',
    'map': 'Mapa',
    'reports': 'Reportes',
    'companies': 'Empresas',
    'branches': 'Sucursales',
    'exchange-rates': 'Tipos de Cambio',
    'settings': 'Configuración'
  }
  return routeNames[route.name as string] || 'Sistema ERP'
}

const darkMode = ref(themeStore.darkMode)
const toggleDarkMode = () => {
  themeStore.toggleDarkMode()
  darkMode.value = themeStore.darkMode
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Navigation helpers
const getNavClass = (path: string) => {
  const isActive = route.path === path || route.path.startsWith(path + '/')
  return isActive
    ? 'bg-primary text-primary-foreground'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
}

const getIconClass = (path: string) => {
  const isActive = route.path === path || route.path.startsWith(path + '/')
  return isActive
    ? 'text-primary-foreground'
    : 'text-muted-foreground group-hover:text-foreground'
}

const getSubmenuClass = (path: string) => {
  const isActive = route.path === path
  return isActive
    ? 'bg-muted text-foreground font-medium'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
}

// Exchange rate and notifications functions
const fetchExchangeRates = async (company?: any) => {
  const selectedCompany = company || companiesStore.currentCompany
  if (!selectedCompany || !selectedCompany.currency_code) return

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('from_currency_code', selectedCompany.currency_code)
      .in('to_currency_code', ['USD', 'PEN'])
      .order('rate_date', { ascending: false })
      .limit(2)

    if (error) throw error
    exchangeRates.value = data || []
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
  }
}

const formatExchangeRate = (rate: number): string => {
  return rate.toFixed(4)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const markAsRead = (notificationId: number) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const loadMockNotifications = () => {
  notifications.value = [
    {
      id: 1,
      title: 'Stock bajo detectado',
      message: 'El producto "Leche Gloria 1L" tiene menos de 10 unidades en almacén principal.',
      read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
    },
    {
      id: 2,
      title: 'Documento de venta procesado',
      message: 'Factura F001-00123 fue procesada correctamente y enviada a SUNAT.',
      read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 3,
      title: 'Tipo de cambio actualizado',
      message: 'Se han actualizado los tipos de cambio del día. USD: 3.7250',
      read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: 4,
      title: 'Respaldo completado',
      message: 'El respaldo automático de la base de datos se completó exitosamente.',
      read: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ]
}

// Watch for route changes to auto-open menus
watch(route, (newRoute) => {
  // Auto-open products menu when visiting products routes
  if (newRoute.path.startsWith('/products')) {
    productsMenuOpen.value = true
  }
  // Auto-open purchases menu when visiting purchases routes
  if (newRoute.path.startsWith('/purchases')) {
    purchasesMenuOpen.value = true
  }
  // Auto-open vehicles menu when visiting vehicles routes
  if (newRoute.path.startsWith('/vehicles')) {
    vehiclesMenuOpen.value = true
  }
  // Auto-open warehouses menu when visiting warehouses routes
  if (newRoute.path.startsWith('/warehouses')) {
    warehousesMenuOpen.value = true
  }
}, { immediate: true })

// Watch for company changes to load exchange rates
watch(() => companiesStore.currentCompany, async (newCompany) => {
  if (newCompany) {
    await fetchExchangeRates()
  }
}, { immediate: true })

onMounted(async () => {
  // Initialize companies for the authenticated user
  if (authStore.user) {
    await companiesStore.fetchUserCompanies(authStore.user.id)

    // Auto-select first company if available and none is selected
    if (companiesStore.userCompanies.length > 0 && !selectedCompanyId.value) {
      const firstUserCompany = companiesStore.userCompanies[0]
      selectedCompanyId.value = firstUserCompany.company.id
      companiesStore.setCurrentCompany(firstUserCompany.company)

      // Load branches for the selected company
      await branchesStore.fetchAll(firstUserCompany.company.id)

      // Load exchange rates for the selected company
      await fetchExchangeRates(firstUserCompany.company)

      // Restore saved branch selection if valid for this company
      const savedBranchId = localStorage.getItem('selectedBranchId')
      if (savedBranchId && branchesStore.branches.find(b => b.id === savedBranchId)) {
        selectedBranchId.value = savedBranchId
      }
    }
  }

  // Load mock notifications
  loadMockNotifications()

  // Close notifications dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Element
    if (!target.closest('.notifications-dropdown')) {
      notificationsOpen.value = false
    }
  })
})
</script>
